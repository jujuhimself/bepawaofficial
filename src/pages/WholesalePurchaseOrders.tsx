import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Send, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

// Types
interface Product {
  id: string;
  name: string;
  sku: string;
  sell_price: number;
}
interface POItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
}
interface PurchaseOrder {
  id?: string;
  po_number: string;
  wholesaler_id: string;
  retailer_id: string;
  status: 'draft' | 'sent' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: POItem[];
  total_amount: number;
  created_at?: string;
  retailer_name?: string;
}
interface Retailer {
  id: string;
  business_name: string;
}

// API Functions
const fetchWholesalerData = async (wholesalerId: string) => {
  const productsPromise = supabase.from('products').select('id, name, sku, sell_price').eq('wholesaler_id', wholesalerId);
  const retailersPromise = supabase.from('profiles').select('id, business_name').eq('role', 'retail');
  const purchaseOrdersPromise = supabase.from('purchase_orders').select('*, retailer:retailer_id(business_name)').eq('wholesaler_id', wholesalerId).order('created_at', { ascending: false });

  const [productsRes, retailersRes, purchaseOrdersRes] = await Promise.all([productsPromise, retailersPromise, purchaseOrdersPromise]);

  if (productsRes.error) throw new Error(productsRes.error.message);
  if (retailersRes.error) throw new Error(retailersRes.error.message);
  if (purchaseOrdersRes.error) throw new Error(purchaseOrdersRes.error.message);

  const purchaseOrders = (purchaseOrdersRes.data || []).map((po: any) => ({
      ...po,
      retailer_name: po.retailer?.business_name,
  }));

  return { products: productsRes.data || [], retailers: retailersRes.data || [], purchaseOrders };
};

const savePurchaseOrder = async (po: PurchaseOrder) => {
  const { data, error } = await supabase.from('purchase_orders').upsert(po).select().single();
  if (error) throw new Error(error.message);
  return data;
};


const WholesalePurchaseOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['wholesalerPurchaseData', user?.id],
    queryFn: () => fetchWholesalerData(user!.id),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: savePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wholesalerPurchaseData', user?.id] });
      toast({ title: "Success", description: "Purchase Order saved." });
      setActivePO(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: `Failed to save PO: ${error.message}`, variant: 'destructive' });
    }
  });

  const createNewPO = () => {
    setActivePO({
      po_number: `PO-${Date.now()}`,
      wholesaler_id: user!.id,
      retailer_id: '',
      status: 'draft',
      items: [],
      total_amount: 0
    });
  };
  
  const handleItemChange = (productId: string) => {
    if (!activePO) return;
    const product = data?.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = activePO.items.find(item => item.product_id === productId);
    let newItems;
    if (existingItem) {
      newItems = activePO.items.map(item => item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      newItems = [...activePO.items, { product_id: product.id, product_name: product.name, sku: product.sku, quantity: 1, unit_price: product.sell_price }];
    }
    const newTotal = newItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    setActivePO({ ...activePO, items: newItems, total_amount: newTotal });
  };
  
  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (!activePO) return;
    let newItems;
    if(newQuantity <= 0) {
        newItems = activePO.items.filter(item => item.product_id !== productId);
    } else {
        newItems = activePO.items.map(item => item.product_id === productId ? { ...item, quantity: newQuantity } : item);
    }
    const newTotal = newItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    setActivePO({ ...activePO, items: newItems, total_amount: newTotal });
  };
  
  const handleSavePO = (status: 'draft' | 'sent' = 'draft') => {
      if (!activePO || !activePO.retailer_id || activePO.items.length === 0) {
          toast({ title: "Error", description: "Please select a retailer and add items.", variant: "destructive"});
          return;
      }
      mutation.mutate({ ...activePO, status });
  };

  if (isLoading) return <LoadingState text="Loading Purchase Orders..." />;
  if (isError) return <EmptyState title="Error" description="Could not load data." icon={<FileText />} />;

  // PO Builder View
  if (activePO) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">PO: {activePO.po_number}</h1>
          <Button variant="outline" onClick={() => setActivePO(null)}>Back to List</Button>
        </div>
        <Card>
          <CardHeader>
              <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <label>Retailer</label>
              <Select 
                value={activePO.retailer_id} 
                onValueChange={(value) => setActivePO({ ...activePO, retailer_id: value })}
              >
                <SelectTrigger><SelectValue placeholder="Select a retailer" /></SelectTrigger>
                <SelectContent>
                  {data?.retailers.map(r => <SelectItem key={r.id} value={r.id}>{r.business_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Status</label>
              <Badge>{activePO.status}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
                <Select onValueChange={handleItemChange}>
                    <SelectTrigger><SelectValue placeholder="Add a product..." /></SelectTrigger>
                    <SelectContent>
                        {data?.products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePO.items.map(item => (
                  <TableRow key={item.product_id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                    <TableCell>${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => updateItemQuantity(item.product_id, 0)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right font-bold mt-4">
              Total: ${activePO.total_amount.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleSavePO('draft')} disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button onClick={() => handleSavePO('sent')} disabled={mutation.isPending}>
                <Send className="mr-2 h-4 w-4"/>
                {mutation.isPending ? 'Sending...' : 'Send to Retailer'}
            </Button>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <Button onClick={createNewPO}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase Order
            </Button>
        </div>
        <Card>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Retailer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.purchaseOrders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No purchase orders found.</TableCell></TableRow>}
                      {data?.purchaseOrders.map((po: any) => (
                          <TableRow key={po.id} onClick={() => setActivePO(po as PurchaseOrder)} className="cursor-pointer">
                              <TableCell>{po.po_number}</TableCell>
                              <TableCell>{po.retailer_name || 'N/A'}</TableCell>
                              <TableCell><Badge>{po.status}</Badge></TableCell>
                              <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                              <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
};

export default WholesalePurchaseOrders;