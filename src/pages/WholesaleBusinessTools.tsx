import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { posService, PosSale, PosSaleItem } from "../services/posService";
import { inventoryService, Product } from "../services/inventoryService";
import { inventoryForecastService, InventoryForecast } from "../services/inventoryForecastService";
import { inventoryAdjustmentService, InventoryAdjustment } from "../services/inventoryAdjustmentService";
import { auditService } from "../services/auditService";
import { creditService, WholesaleCreditAccount, WholesaleCreditTransaction } from "../services/creditService";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { supabase } from "../lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { InventoryForecasts } from "../components/inventory/InventoryForecasts";
import { CreditAccountManager } from "../components/wholesale/CreditAccountManager";

const WholesaleBusinessTools = () => {
  const { user } = useAuth();
  // Improved POS permission check
  const isOwnerOrManager = user?.role === "wholesale" && (!user?.parent_id || user?.role === "manager");
  const canUsePOS = isOwnerOrManager || (user?.permissions?.includes("canUsePOS") || user?.permissions?.includes("fullAccess"));

  // POS
  const [sales, setSales] = useState<PosSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: "", quantity: 1 },
  ]);
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  // Forecasting
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  // Adjustments
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  // Credit/CRM
  const [accounts, setAccounts] = useState<WholesaleCreditAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WholesaleCreditAccount | null>(null);
  const [transactions, setTransactions] = useState<WholesaleCreditTransaction[]>([]);
  const [crmNote, setCrmNote] = useState("");
  const [newCredit, setNewCredit] = useState("");
  const [repayment, setRepayment] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [receipt, setReceipt] = useState<null | { items: any[]; total: number; customer: string; date: string }>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);
  const [filtered, setFiltered] = useState<PosSale[]>([]);
  // Inventory Forecasts filters
  const [forecastProduct, setForecastProduct] = useState("");
  const [forecastFrom, setForecastFrom] = useState("");
  const [forecastTo, setForecastTo] = useState("");
  // CRM filters and stats
  const [accountSearch, setAccountSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const filteredAccounts = useMemo(() => accounts.filter(acc => {
    const retailer = retailers.find(r => r.id === acc.retailer_id)?.business_name || acc.retailer_id;
    const matchesSearch = !accountSearch || retailer.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesStatus = !accountStatus || acc.status === accountStatus;
    return matchesSearch && matchesStatus;
  }), [accounts, accountSearch, accountStatus, retailers]);
  const totalCredit = filteredAccounts.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0);
  const totalOutstanding = filteredAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  // Forecasts filtered
  const filteredForecasts = useMemo(() => forecasts.filter(f => {
    const productOk = !forecastProduct || f.product_id === forecastProduct;
    const fromOk = !forecastFrom || new Date(f.forecast_date) >= new Date(forecastFrom);
    const toOk = !forecastTo || new Date(f.forecast_date) <= new Date(forecastTo);
    return productOk && fromOk && toOk;
  }), [forecasts, forecastProduct, forecastFrom, forecastTo]);

  const fetchWholesaleProducts = async () => {
    if (user?.id) {
      const prods = await inventoryService.getWholesaleProducts(user.id);
      setProducts(prods);
    }
  };

  // POS sales loading
  useEffect(() => { posService.fetchSales().then(setSales); }, []);
  useEffect(() => { fetchWholesaleProducts(); }, [user]);
  // Forecasts loading
  useEffect(() => { inventoryForecastService.fetchForecasts().then(setForecasts); }, []);
  // Adjustments loading
  useEffect(() => { inventoryAdjustmentService.fetchAdjustments().then(setAdjustments); }, []);
  // Credit/CRM accounts loading
  useEffect(() => { creditService.fetchAccounts().then(setAccounts); }, []);
  // Fetch retailers (pharmacies) for POS
  useEffect(() => {
    async function fetchRetailers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, business_name')
        .eq('role', 'retail')
        .eq('is_approved', true);
      if (!error && data) setRetailers(data);
    }
    fetchRetailers();
  }, []);

  useEffect(() => {
    setFiltered(
      sales.filter(s => {
        const dateOk = (!from || new Date(s.sale_date) >= new Date(from)) &&
          (!to || new Date(s.sale_date) <= new Date(to));
        return dateOk;
      })
    );
  }, [sales, from, to]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!user || !canUsePOS) return;
    if (saleItems.length === 0 || saleItems.some(item => !item.productId || item.quantity <= 0)) {
      setErrorMsg("Please select products and quantities.");
      return;
    }
    setLoading(true);
    try {
      // Prepare sale items
      const items: Omit<PosSaleItem, "id" | "pos_sale_id">[] = saleItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: product?.sell_price || 0,
          total_price: (product?.sell_price || 0) * item.quantity,
        };
      });
      const totalAmount = items.reduce((sum, i) => sum + i.total_price, 0);
      // Deduct stock for each product
      for (const item of saleItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;
        const newStock = product.stock - item.quantity;
        if (newStock < 0) {
          setErrorMsg(`Insufficient stock for ${product.name}`);
          setLoading(false);
          return;
        }
        await inventoryService.updateStock(product.id, newStock, "POS Sale");
        await auditService.logStockUpdate(product.id, product.stock, newStock, "POS Sale");
        await inventoryAdjustmentService.createAdjustment({
          user_id: user.id,
          product_id: product.id,
          adjustment_type: "remove",
          quantity: item.quantity,
          reason: "POS Sale",
        });
      }
      // Record sale
      const { error: saleError } = await posService.createSale(
        {
          user_id: user.id,
          sale_date: new Date().toISOString(),
          total_amount: totalAmount,
          payment_method: method,
          customer_name: customerName,
          customer_phone: customerPhone,
        },
        items
      );
      if (saleError) throw saleError;
      await auditService.logAction("POS_SALE", "pos_sale", undefined, { items, totalAmount });
      setReceipt({
        items: items.map((i, idx) => ({ ...i, name: products.find(p => p.id === i.product_id)?.name || "" })),
        total: totalAmount,
        customer: customerName,
        date: new Date().toLocaleString(),
      });
      setSaleItems([{ productId: "", quantity: 1 }]);
      setMethod("cash");
      setCustomerName("");
      setCustomerPhone("");
      setSuccessMsg("Sale logged successfully.");
      posService.fetchSales().then(setSales);
      fetchWholesaleProducts();
      inventoryAdjustmentService.fetchAdjustments().then(setAdjustments);
    } catch (err: any) {
      setErrorMsg(err.message || "Error logging sale");
    } finally {
      setLoading(false);
    }
  }

  async function openAccountDetails(account: WholesaleCreditAccount) {
    setSelectedAccount(account);
    setCrmNote(account.crm_notes || "");
    // Fetch transactions
    const { data, error } = await supabase
      .from("wholesale_credit_transactions")
      .select("*")
      .eq("credit_account_id", account.id)
      .order("transaction_date", { ascending: false });
    if (!error) setTransactions(data || []);
  }

  async function saveCrmNote() {
    if (!selectedAccount) return;
    setNoteLoading(true);
    await supabase
      .from("wholesale_credit_accounts")
      .update({ crm_notes: crmNote })
      .eq("id", selectedAccount.id);
    await auditService.logAction("UPDATE_CRM_NOTE", "credit_account", selectedAccount.id, { crmNote });
    setNoteLoading(false);
  }

  async function addCredit() {
    if (!selectedAccount || !newCredit) return;
    setTxnLoading(true);
    const amount = Number(newCredit);
    await creditService.createTransaction({
      credit_account_id: selectedAccount.id,
      transaction_type: "credit",
      amount,
      transaction_date: new Date().toISOString(),
    });
    await creditService.updateAccountBalance(selectedAccount.id, selectedAccount.current_balance + amount);
    await auditService.logAction("ADD_CREDIT", "credit_account", selectedAccount.id, { amount });
    setNewCredit("");
    openAccountDetails(selectedAccount);
    setTxnLoading(false);
  }

  async function recordRepayment() {
    if (!selectedAccount || !repayment) return;
    setTxnLoading(true);
    const amount = Number(repayment);
    await creditService.createTransaction({
      credit_account_id: selectedAccount.id,
      transaction_type: "payment",
      amount,
      transaction_date: new Date().toISOString(),
    });
    await creditService.updateAccountBalance(selectedAccount.id, selectedAccount.current_balance - amount);
    await auditService.logAction("RECORD_REPAYMENT", "credit_account", selectedAccount.id, { amount });
    setRepayment("");
    openAccountDetails(selectedAccount);
    setTxnLoading(false);
  }

  if (!canUsePOS) {
    return <div className="p-8 text-center text-red-600 font-bold">You do not have permission to use the POS. Please contact your admin.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Wholesale Business Tools</h1>

      <Tabs defaultValue="pos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pos">Point of Sale</TabsTrigger>
          <TabsTrigger value="forecasts">Inventory Forecasts</TabsTrigger>
          <TabsTrigger value="credit">Credit Management</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          {/* Existing POS content */}
          {canUsePOS ? (
            <div className="space-y-6">
              {/* POS Sale Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Wholesale Point of Sale (POS)</CardTitle>
                </CardHeader>
                <CardContent>
                  {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
                  {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="mb-2 text-lg font-semibold">Customer Details</div>
                    <div className="flex gap-2 items-center mb-4">
                      <Input
                        placeholder="Customer Name (optional)"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Customer Phone (optional)"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="mb-2 text-lg font-semibold">Products</div>
                    {saleItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <select
                          value={item.productId}
                          onChange={e => {
                            const newItems = [...saleItems];
                            newItems[idx].productId = e.target.value;
                            setSaleItems(newItems);
                          }}
                          className="border rounded px-2 py-1 flex-1"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.filter(p => p.stock > 0).map(p => (
                            <option key={p.id} value={p.id} disabled={p.stock === 0}>
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
                            newItems[idx].quantity = Number(e.target.value);
                            setSaleItems(newItems);
                          }}
                          placeholder="Qty"
                          className="w-20"
                          required
                        />
                        {saleItems.length > 1 && (
                          <Button type="button" variant="outline" onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}>Remove</Button>
                        )}
                      </div>
                    ))}
                    <div className="space-y-4">
                      <Button type="button" variant="secondary" onClick={() => setSaleItems([...saleItems, { productId: "", quantity: 1 }])}>
                        + Add Product
                      </Button>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Payment Method</div>
                        <select
                          value={method}
                          onChange={e => setMethod(e.target.value)}
                          className="border rounded px-2 py-1 mb-4"
                          required
                        >
                          <option value="cash">Cash</option>
                          <option value="mpesa">M-PESA</option>
                          <option value="card">Card</option>
                        </select>
                      </div>
                      <Button type="submit" disabled={loading}>{loading ? "Processing..." : "Log Sale"}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              {/* POS Quick Log */}
              <Card>
                <CardHeader>
                  <CardTitle>POS Sales (Last 5)</CardTitle>
                </CardHeader>
                <CardContent>
                  {sales.slice(0, 5).length === 0 ? (
                    <div>No sales yet.</div>
                  ) : (
                    <ul>
                      {sales.slice(0, 5).map(sale => (
                        <li key={sale.id} className="mb-2">
                          <span className="font-semibold">{new Date(sale.sale_date).toLocaleString()}</span>
                          {" — "}
                          <span>TZS {Number(sale.total_amount).toLocaleString()}</span>
                          {" ("}{sale.payment_method}{")"}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              {/* Inventory Adjustments */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Adjustments (Recent)</CardTitle>
                </CardHeader>
                <CardContent>
                  {adjustments.length === 0 ? (
                    <div>No recent adjustments.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Qty</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adjustments.slice(0, 20).map(adj => (
                            <tr key={adj.id}>
                              <td>{new Date(adj.created_at).toLocaleString()}</td>
                              <td>{products.find(p => p.id === adj.product_id)?.name || adj.product_id}</td>
                              <td>{adj.adjustment_type}</td>
                              <td>{adj.quantity}</td>
                              <td>{adj.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">You don't have permission to use the POS system.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="forecasts">
          <InventoryForecasts />
        </TabsContent>

        <TabsContent value="credit">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Credit Accounts Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Credit Limit</div>
                    <div className="text-2xl font-semibold">
                      TZS {totalCredit.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Outstanding</div>
                    <div className="text-2xl font-semibold">
                      TZS {totalOutstanding.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Active Accounts</div>
                    <div className="text-2xl font-semibold">
                      {filteredAccounts.length}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {retailers.map(retailer => (
                    <Card key={retailer.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{retailer.business_name}</h3>
                          <CreditAccountManager customerId={retailer.id} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!receipt} onOpenChange={open => { if (!open) setReceipt(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div ref={receiptRef} className="space-y-2">
              <div>Date: {receipt.date}</div>
              <div>Customer: {receipt.customer || "N/A"}</div>
              <div>
                <strong>Items:</strong>
                <ul className="ml-4 list-disc">
                  {receipt.items.map((item, idx) => (
                    <li key={idx}>{item.name} x {item.quantity} @ {item.unit_price} = {item.total_price}</li>
                  ))}
                </ul>
              </div>
              <div className="font-bold">Total: {receipt.total}</div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setReceipt(null)}>Close</Button>
            <Button variant="outline" onClick={() => { if (receiptRef.current) { const printContents = receiptRef.current.innerHTML; const win = window.open('', '', 'height=600,width=400'); win?.document.write('<html><head><title>Receipt</title></head><body>' + printContents + '</body></html>'); win?.document.close(); win?.print(); } }}>Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WholesaleBusinessTools;
