import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Search,
  Package,
  DollarSign
} from 'lucide-react';
import { auditService } from '../../services/auditService';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

const WholesalePos = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const receiptRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('wholesaler_id', user?.id)
        .gt('stock', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error fetching products",
        description: "Failed to load products",
        variant: "destructive"
      });
    }
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity >= product.stock) {
          toast({
            title: "Stock limit reached",
            description: `Only ${product.stock} units available`,
            variant: "destructive"
          });
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.price }
            : item
        );
      } else {
        return [...prevCart, {
          product,
          quantity: 1,
          subtotal: product.price
        }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => {
      const item = prevCart.find(item => item.product.id === productId);
      if (!item || newQuantity > item.product.stock) {
        toast({
          title: "Invalid quantity",
          description: `Maximum ${item?.product.stock} units available`,
          variant: "destructive"
        });
        return prevCart;
      }
      
      return prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price }
          : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart",
        variant: "destructive"
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter customer name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          wholesaler_id: user?.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: getTotal(),
          payment_method: paymentMethod,
          status: 'completed',
          order_type: 'walk_in'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and update stock
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id);

        if (stockError) throw stockError;

        // Log stock update
        await auditService.logStockUpdate(
          item.product.id,
          item.product.stock,
          newStock,
          `POS sale - Order ${orderData.id}`
        );
      }

      // Log order creation
      await auditService.logAction(
        'CREATE_ORDER',
        'order',
        orderData.id,
        {
          order_number: orderData.id,
          total_amount: getTotal(),
          items_count: cart.length,
          customer_name: customerName
        }
      );

      toast({
        title: "Sale completed",
        description: `Order #${orderData.id} created successfully`,
      });

      // Print receipt
      setTimeout(() => {
        if (receiptRef.current) {
          window.print();
        }
      }, 500);

      // Clear cart and form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "Error processing sale",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = useReactToPrint({
    content: () => receiptRef.current,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{product.sku}</p>
                  <p className="text-lg font-bold text-green-600">
                    TZS {product.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Customer Info */}
            <div className="space-y-3 mb-4">
              <Input
                placeholder="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Money</option>
              </select>
            </div>

            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    <p className="text-xs text-gray-500">
                      TZS {item.product.price.toLocaleString()} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>TZS {getTotal().toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full mt-4"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Receipt (Hidden for printing) */}
      <div className="hidden">
        <div ref={receiptRef} className="p-4 max-w-sm">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">{user?.businessName}</h2>
            <p className="text-sm text-gray-600">Wholesale Receipt</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
          </div>
          
          <div className="border-t border-b py-2 mb-4">
            <p><strong>Customer:</strong> {customerName}</p>
            {customerPhone && <p><strong>Phone:</strong> {customerPhone}</p>}
            <p><strong>Payment:</strong> {paymentMethod.toUpperCase()}</p>
          </div>
          
          <div className="space-y-2 mb-4">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <span>{item.product.name} x {item.quantity}</span>
                <span>TZS {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold">
              <span>TOTAL:</span>
              <span>TZS {getTotal().toLocaleString()}</span>
            </div>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-600">
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesalePos; 