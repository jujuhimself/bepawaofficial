import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Package, Plus, ShoppingCart, Search, Filter, Truck, Calendar, DollarSign, Loader2 } from "lucide-react";

// Types
interface WholesalerProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  sell_price: number;
  stock: number;
  wholesaler_id: string;
  wholesaler_name: string;
}

interface CartItem extends WholesalerProduct {
  quantity: number;
}

interface PurchaseOrder {
    id: string;
    supplier: string;
    items: any[];
    total: number;
    date: string;
    status: string;
    expectedDelivery: string;
}

const WholesaleOrdering = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    // No role check here anymore, allowing retailers
  }, [user, navigate]);

  // Fetch products from all approved wholesalers
  const { data: wholesaleProducts = [], isLoading: isLoadingProducts } = useQuery<WholesalerProduct[]>({
    queryKey: ['wholesalerProducts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          description,
          sell_price,
          stock,
          user_id,
          profiles!inner (
            business_name,
            is_approved,
            role
          )
        `)
        .eq('profiles.role', 'wholesale')
        .eq('profiles.is_approved', true)
        .gt('stock', 0);

      if (error) {
        console.error("Error fetching wholesaler products:", error);
        throw new Error(error.message);
      }

      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        sell_price: p.sell_price,
        stock: p.stock,
        wholesaler_id: p.user_id,
        wholesaler_name: p.profiles.business_name || 'Unknown Wholesaler',
      }));
    },
  });

  const { data: purchaseOrders = [], isLoading: isLoadingPOs } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders', user?.id],
    queryFn: async () => {
        if (!user) return [];
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                id,
                order_date,
                status,
                expected_delivery,
                total_amount,
                purchase_order_items(count),
                suppliers(name)
            `)
            .eq('user_id', user.id)
            .order('order_date', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Error fetching POs:", error);
            throw new Error(error.message);
        }

        return data.map((po: any) => ({
            id: po.id,
            date: po.order_date,
            status: po.status,
            expectedDelivery: po.expected_delivery,
            total: po.total_amount,
            supplier: po.suppliers?.name || 'Unknown Supplier',
            items: po.purchase_order_items[0]?.count || 0,
        }));
    },
    enabled: !!user,
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (cartItems: CartItem[]) => {
      if (!user) throw new Error("User not authenticated.");

      const ordersBySupplier = cartItems.reduce((acc, item) => {
        const supplierName = item.wholesaler_name;
        if (!acc[supplierName]) {
          acc[supplierName] = [];
        }
        acc[supplierName].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      for (const supplierName in ordersBySupplier) {
        const items = ordersBySupplier[supplierName];
        
        // 1. Get or create supplier
        let { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .select('id')
          .eq('name', supplierName)
          .eq('user_id', user.id)
          .single();

        if (supplierError && supplierError.code !== 'PGRST116') { // PGRST116: no rows found
          throw new Error(`Error finding supplier ${supplierName}: ${supplierError.message}`);
        }

        if (!supplier) {
          const { data: newSupplier, error: newSupplierError } = await supabase
            .from('suppliers')
            .insert({ name: supplierName, user_id: user.id })
            .select('id')
            .single();
          if (newSupplierError) throw new Error(`Error creating supplier ${supplierName}: ${newSupplierError.message}`);
          supplier = newSupplier;
        }

        // 2. Create Purchase Order
        const total_amount = items.reduce((sum, item) => sum + item.sell_price * item.quantity, 0);
        const { data: po, error: poError } = await supabase
          .from('purchase_orders')
          .insert({
            user_id: user.id,
            supplier_id: supplier.id,
            total_amount,
            status: 'pending',
            po_number: `PO-${Date.now()}`
          })
          .select('id')
          .single();
        
        if (poError) throw poError;

        // 3. Create Purchase Order Items
        const poItems = items.map(item => ({
          purchase_order_id: po.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_cost: item.sell_price,
          total_cost: item.sell_price * item.quantity,
        }));

        const { error: poItemsError } = await supabase
          .from('purchase_order_items')
          .insert(poItems);

        if (poItemsError) throw poItemsError;
      }
    },
    onSuccess: () => {
      toast({ title: "Purchase Orders placed successfully!" });
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to place order", description: error.message, variant: "destructive" });
    }
  });

  const categories = ["all", ...new Set((wholesaleProducts || []).map(p => p.category))];

  const filteredProducts = (wholesaleProducts || []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.wholesaler_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: WholesalerProduct, quantity: number) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? {...item, quantity: item.quantity + quantity}
          : item
      ));
    } else {
      setCart([...cart, {...product, quantity}]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in-transit': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isLoadingProducts) {
    return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Wholesale Ordering</h1>
          <p className="text-gray-600 text-lg">Order in bulk from trusted pharmaceutical wholesalers</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wholesaleProducts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cart.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Truck className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseOrders.filter(po => po.status !== 'delivered').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">TZS {cartTotal.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search wholesale products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{product.category}</Badge>
                      <Badge variant="secondary">{product.wholesaler_name}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Supplier:</span>
                        <span className="text-sm font-medium">{product.wholesaler_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Unit Price:</span>
                        <span className="text-lg font-bold">TZS {product.sell_price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">In Stock (Supplier):</span>
                        <span className="text-sm font-medium">{product.stock}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        defaultValue="1"
                        className="w-24"
                        id={`quantity-${product.id}`}
                      />
                      <Button 
                        onClick={() => {
                          const quantityInput = document.getElementById(`quantity-${product.id}`) as HTMLInputElement;
                          const quantity = parseInt(quantityInput.value, 10);
                          if (quantity > 0) {
                            addToCart(product, quantity);
                          }
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Shopping Cart & Orders */}
          <div className="space-y-6">
            {/* Shopping Cart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Shopping Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            ×
                          </Button>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span>{item.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unit Price:</span>
                            <span>TZS {item.sell_price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Subtotal:</span>
                            <span>TZS {(item.sell_price * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Total:</span>
                        <span className="text-xl font-bold">TZS {cartTotal.toLocaleString()}</span>
                      </div>
                      <Button 
                        className="w-full" 
                        disabled={cart.length === 0 || placeOrderMutation.isPending}
                        onClick={() => placeOrderMutation.mutate(cart)}
                      >
                        {placeOrderMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Place Purchase Order
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Purchase Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Purchase Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPOs ? (
                    <div className="text-center text-gray-500">Loading orders...</div>
                ) : purchaseOrders.length === 0 ? (
                    <div className="text-center text-gray-500">No recent purchase orders.</div>
                ) : (
                    <div className="space-y-3">
                    {purchaseOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">PO-{order.id.substring(0, 6)}</span>
                            <Badge className={getStatusColor(order.status)}>
                            {order.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                            <div>{order.supplier}</div>
                            <div>{order.items} items • TZS {order.total.toLocaleString()}</div>
                            <div>Expected: {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesaleOrdering;
