import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  ShoppingCart,
  Plus,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  categories: number;
  averageStockLevel: number;
  stockTurnoverRate: number;
}

interface RecentMovement {
  id: string;
  product_name: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  created_at: string;
}

const InventoryDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    categories: 0,
    averageStockLevel: 0,
    stockTurnoverRate: 0
  });
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id);

      if (productsError) throw productsError;

      // Fetch recent movements
      const { data: movements, error: movementsError } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products(name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (movementsError) throw movementsError;

      // Calculate stats
      const totalProducts = products?.length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.stock * p.sell_price), 0) || 0;
      const lowStockCount = products?.filter(p => p.status === 'low-stock').length || 0;
      const outOfStockCount = products?.filter(p => p.status === 'out-of-stock').length || 0;
      const expiredCount = products?.filter(p => p.expiry_date && new Date(p.expiry_date) < new Date()).length || 0;
      const expiringSoonCount = products?.filter(p => {
        if (!p.expiry_date) return false;
        const daysUntilExpiry = Math.ceil((new Date(p.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      }).length || 0;
      const categories = new Set(products?.map(p => p.category)).size;
      const averageStockLevel = products?.length ? products.reduce((sum, p) => sum + p.stock, 0) / products.length : 0;

      setStats({
        totalProducts,
        totalValue,
        lowStockCount,
        outOfStockCount,
        expiredCount,
        expiringSoonCount,
        categories,
        averageStockLevel,
        stockTurnoverRate: 0 // TODO: Calculate from historical data
      });

      setRecentMovements(movements?.map(m => ({
        id: m.id,
        product_name: m.products?.name || 'Unknown Product',
        movement_type: m.movement_type,
        quantity: m.quantity,
        reason: m.reason,
        created_at: m.created_at
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment': return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const config = {
      'in': { variant: 'default' as const, label: 'Stock In' },
      'out': { variant: 'destructive' as const, label: 'Stock Out' },
      'adjustment': { variant: 'secondary' as const, label: 'Adjustment' }
    };
    return config[type as keyof typeof config] || config.in;
  };

  const exportInventoryReport = () => {
    // TODO: Implement CSV export
    toast({
      title: "Export",
      description: "Inventory report export feature coming soon",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600">Overview of your inventory status and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventoryReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.categories} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">TZS {stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average: TZS {stats.totalProducts ? (stats.totalValue / stats.totalProducts).toLocaleString() : '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStockCount + stats.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockCount} low, {stats.outOfStockCount} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiry Alerts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiredCount + stats.expiringSoonCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expiredCount} expired, {stats.expiringSoonCount} expiring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0 || stats.expiredCount > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.lowStockCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Low Stock Items</span>
                  </div>
                  <Badge variant="destructive">{stats.lowStockCount} items</Badge>
                </div>
              )}
              
              {stats.outOfStockCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Out of Stock Items</span>
                  </div>
                  <Badge variant="destructive">{stats.outOfStockCount} items</Badge>
                </div>
              )}
              
              {stats.expiredCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Expired Items</span>
                  </div>
                  <Badge variant="destructive">{stats.expiredCount} items</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Level Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Level Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average Stock Level</span>
                <span>{Math.round(stats.averageStockLevel)} units</span>
              </div>
              <Progress value={Math.min((stats.averageStockLevel / 100) * 100, 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Stock Turnover Rate</span>
                <span>{stats.stockTurnoverRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.stockTurnoverRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inventory Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMovements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent movements</p>
              ) : (
                recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.movement_type)}
                      <div>
                        <p className="font-medium text-sm">{movement.product_name}</p>
                        <p className="text-xs text-gray-500">{movement.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getMovementBadge(movement.movement_type).variant}>
                        {getMovementBadge(movement.movement_type).label}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col gap-2">
              <Plus className="h-6 w-6" />
              <span>Add Product</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Eye className="h-6 w-6" />
              <span>View All Products</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Download className="h-6 w-6" />
              <span>Export Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;
