import React, { useEffect, useState, useRef } from "react";
import { posService, PosSale, PosSaleItem } from "../../services/posService";
import { inventoryService, Product } from "../../services/inventoryService";
import { auditService } from "../../services/auditService";
import { inventoryAdjustmentService, InventoryAdjustment } from "../../services/inventoryAdjustmentService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { useReactToPrint } from 'react-to-print';

const ReceiptToPrint = React.forwardRef<HTMLDivElement, { receipt: any }>(({ receipt }, ref) => {
  if (!receipt) return null;
  return (
    <div ref={ref} className="p-4 bg-white text-black text-sm">
      <h2 className="text-xl font-bold text-center mb-2">Sale Receipt</h2>
      <p className="text-center font-semibold">Your Pharmacy Name</p>
      <p className="text-center text-xs">123 Health St, Medcity</p>
      <hr className="my-2 border-black" />
      <p><strong>Date:</strong> {receipt.date}</p>
      <p><strong>Customer:</strong> {receipt.customer || 'Walk-in'}</p>
      <hr className="my-2 border-black" />
      <table className="w-full">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Item</th>
            <th className="text-right py-1">Qty</th>
            <th className="text-right py-1">Price</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item:any, index:number) => (
            <tr key={index}>
              <td className="py-1">{item.name}</td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1">{(item.unit_price || 0).toFixed(2)}</td>
              <td className="text-right py-1">{(item.total_price || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2 border-black" />
      <p className="text-right font-bold text-lg">Total: TZS {receipt.total.toFixed(2)}</p>
      <p className="text-center mt-4 text-xs">Thank you for your business!</p>
    </div>
  );
});

export default function RetailPos() {
  const { user } = useAuth();
  const { toast } = useToast();

  const isRetail = user?.role === "retail";
  const isOwner = isRetail && !user?.parent_id;
  const hasPOSPermission = Array.isArray(user?.permissions) && user.permissions.includes("canUsePOS");
  const canUsePOS = isOwner || hasPOSPermission;

  const [sales, setSales] = useState<PosSale[]>([]);
  const [filtered, setFiltered] = useState<PosSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: "", quantity: 1 },
  ]);
  const [method, setMethod] = useState("cash");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userId, setUserId] = useState("");
  const [payType, setPayType] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [receipt, setReceipt] = useState<null | { items: any[]; total: number; customer: string; date: string }> (null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  const fetchRetailerProducts = async () => {
    if (user?.id) {
      const prods = await inventoryService.getRetailProducts(user.id);
      setProducts(prods);
    }
  };

  useEffect(() => {
    if(canUsePOS) {
        posService.fetchSales().then(setSales);
        fetchRetailerProducts();
    }
  }, [canUsePOS, user]);

  useEffect(() => {
    setFiltered(
      sales.filter(s => {
        const dateOk = (!from || new Date(s.sale_date) >= new Date(from)) &&
          (!to || new Date(s.sale_date) <= new Date(to));
        const userOk = !userId || s.user_id === userId;
        const pmOk = !payType || s.payment_method === payType;
        return dateOk && userOk && pmOk;
      })
    );
  }, [sales, from, to, userId, payType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (saleItems.length === 0 || saleItems.some(item => !item.productId || item.quantity <= 0)) {
        toast({ title: "Invalid Sale", description: "Please select products and quantities.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
      const items: Omit<PosSaleItem, "id" | "pos_sale_id">[] = saleItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error("Product not found");
        if (item.quantity > product.stock) throw new Error(`Insufficient stock for ${product.name}`);
        return {
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: product.sell_price || 0,
          total_price: (product.sell_price || 0) * item.quantity,
        };
      });

      const totalAmount = items.reduce((sum, i) => sum + i.total_price, 0);
      
      const salePayload: Omit<PosSale, 'id' | 'created_at'> = {
        user_id: user.id,
        sale_date: new Date().toISOString(),
        total_amount: totalAmount,
        payment_method: method,
        customer_name: customerName,
        customer_phone: customerPhone,
      };

      const newSaleData = await posService.createSale(salePayload, items);
      if (!newSaleData || newSaleData.length === 0) throw new Error("Sale creation failed at service level.");
      const newSaleId = newSaleData[0].id;

      for (const item of saleItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;
        const newStock = product.stock - item.quantity;
        await inventoryService.updateStock(product.id, newStock);
      }

      await auditService.logAction("POS_SALE", "pos_sales", newSaleId, { customer: customerName, total: totalAmount });
      
      setReceipt({
        items: items.map((i) => ({ ...i, name: products.find(p => p.id === i.product_id)?.name || "" })),
        total: totalAmount,
        customer: customerName,
        date: new Date().toLocaleString(),
      });

      setIsReceiptModalOpen(true);
      setSaleItems([{ productId: "", quantity: 1 }]);
      setMethod("cash");
      setCustomerName("");
      setCustomerPhone("");
      toast({ title: "Success", description: "Sale logged successfully." });
      
      posService.fetchSales().then(setSales);
      fetchRetailerProducts();

    } catch (err: any) {
        toast({ title: "Error", description: err.message || "Error logging sale", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }

  if (!canUsePOS) {
    return <div className="p-8 text-center text-red-600 font-bold">You do not have permission to use the POS.</div>;
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Retail Point of Sale (POS)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="text-lg font-semibold">Customer Details</div>
            <div className="flex gap-4 items-center">
              <Input placeholder="Customer Name (optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <Input placeholder="Customer Phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
            <div className="text-lg font-semibold">Products</div>
            {saleItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  value={item.productId}
                  onChange={e => {
                    const newItems = [...saleItems];
                    newItems[idx].productId = e.target.value;
                    setSaleItems(newItems);
                  }}
                  className="border rounded px-2 py-2 flex-1 bg-white"
                  required
                >
                  <option value="">Select Product</option>
                  {products.filter(p => p.stock > 0).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  value={item.quantity}
                  min={1}
                  max={products.find(p => p.id === item.productId)?.stock || 1}
                  onChange={e => {
                    const newItems = [...saleItems];
                    newItems[idx].quantity = Math.max(1, Number(e.target.value));
                    setSaleItems(newItems);
                  }}
                  placeholder="Qty"
                  className="w-24"
                  required
                />
                {saleItems.length > 1 && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}>Remove</Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setSaleItems([...saleItems, { productId: "", quantity: 1 }])}>
              + Add Another Product
            </Button>
            <div className="text-lg font-semibold">Payment Method</div>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="border rounded px-2 py-2 bg-white"
              required
            >
              <option value="cash">Cash</option>
              <option value="mpesa">M-PESA</option>
              <option value="card">Card</option>
            </select>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Processing..." : "Complete Sale"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sale Complete - Receipt</DialogTitle></DialogHeader>
          <div className="hidden"><ReceiptToPrint receipt={receipt} ref={receiptRef} /></div>
          {receipt && (
             <div className="text-sm">
                <p className="mb-2"><strong>Customer:</strong> {receipt.customer || 'Walk-in'}</p>
                <p className="font-bold text-lg">Total: TZS {receipt.total.toFixed(2)}</p>
             </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsReceiptModalOpen(false)} variant="outline">Close</Button>
            <Button onClick={handlePrint}>Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent POS Sales</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <div>
              <label className="text-sm mr-2">Payment Method:</label>
              <select className="border rounded px-2 py-1 text-sm bg-white"
                value={payType} onChange={e => setPayType(e.target.value)}>
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="mpesa">M-PESA</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div>No sales found for the selected criteria.</div>
          ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sale => (
                    <tr key={sale.id} className="border-b">
                      <td className="p-2">{new Date(sale.sale_date).toLocaleString()}</td>
                      <td className="p-2">{sale.customer_name || 'Walk-in'}</td>
                      <td className="text-right p-2">TZS {sale.total_amount.toFixed(2)}</td>
                      <td className="text-right p-2">{sale.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
