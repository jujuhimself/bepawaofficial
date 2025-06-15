
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Clock, User, FileText, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import QuickReorder from "@/components/QuickReorder";
import { BreadcrumbNavigation } from "@/components/BreadcrumbNavigation";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { NotificationService } from "@/components/NotificationSystem";
import { supabase } from "@/integrations/supabase/client";

const PharmacyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    cartItems: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'retail') {
      navigate('/login');
      return;
    }

    if (!user.isApproved) {
      // Show pending approval message
      return;
    }

    // Fetch stats and recent orders from Supabase
    async function fetchOrdersAndStats() {
      // Fetch orders for current pharmacy
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('pharmacy_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        setRecentOrders([]);
        setStats((prev) => ({ ...prev, totalOrders: 0, pendingOrders: 0 }));
        return;
      }

      // For cart, still use localStorage (unless we refactor persistence for cart!)
      const cart = JSON.parse(localStorage.getItem(`bepawa_cart_${user.id}`) || '[]');

      setRecentOrders((orders || []).slice(0, 5));
      setStats({
        totalOrders: orders?.length || 0,
        pendingOrders: (orders || []).filter((o: any) => o.status === 'pending').length,
        cartItems: cart.length
      });

      // Add welcome notification
      NotificationService.addSystemNotification(`Welcome back, ${user.pharmacyName}! Your dashboard has been updated.`);
    }

    fetchOrdersAndStats();
  }, [user, navigate]);

  if (!user || user.role !== 'retail') {
    return <div>Loading...</div>;
  }

  if (!user.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto" />
            <p className="text-gray-600">
              Your pharmacy account is pending admin approval. You'll receive an email notification once approved.
            </p>
            <Button onClick={logout} variant="outline">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'packed': return 'bg-blue-500';
      case 'out-for-delivery': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.pharmacyName}
          </h1>
          <p className="text-gray-600 text-lg">Manage your orders and browse our medical product catalog</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-yellow-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Cart Items</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.cartItems}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Reorder */}
        <QuickReorder />

        {/* Analytics Dashboard */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Business Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDashboard />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-24 flex-col bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/products">
                  <Package className="h-8 w-8 mb-2" />
                  Browse Products
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
                <Link to="/cart">
                  <ShoppingCart className="h-8 w-8 mb-2" />
                  View Cart ({stats.cartItems})
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
                <Link to="/orders">
                  <Clock className="h-8 w-8 mb-2" />
                  Order History
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
                <Link to="/credit-management">
                  <CreditCard className="h-8 w-8 mb-2" />
                  Credit Management
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Services */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Additional Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col border-2 hover:bg-gray-50">
                <Link to="/prescription-management">
                  <FileText className="h-6 w-6 mb-2" />
                  Prescription Management
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col border-2 hover:bg-gray-50">
                <Link to="/inventory-management">
                  <Package className="h-6 w-6 mb-2" />
                  Inventory Management
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col border-2 hover:bg-gray-50">
                <Link to="/business-tools">
                  <User className="h-6 w-6 mb-2" />
                  Business Tools
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-4">No orders yet</p>
                <Button asChild size="lg">
                  <Link to="/products">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex justify-between items-center p-6 border rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-lg">Order #{order.order_number || order.id}</p>
                      <p className="text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="font-bold text-blue-600">TZS {order.total_amount?.toLocaleString ? order.total_amount.toLocaleString() : order.total_amount}</p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white px-3 py-1`}>
                      {order.status?.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-4" size="lg">
                  <Link to="/orders">View All Orders</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyDashboard;

