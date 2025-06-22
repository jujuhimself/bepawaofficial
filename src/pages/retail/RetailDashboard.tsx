import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { inventoryService } from '../../services/inventoryService';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { Package } from 'lucide-react';

// A single hook to fetch all dashboard data
const useRetailDashboardData = (pharmacyId: string | undefined) => {
    return useQuery({
        queryKey: ['retailDashboard', pharmacyId],
        queryFn: async () => {
            if (!pharmacyId) throw new Error("Pharmacy ID is not available.");

            const [salesAnalytics, productAnalytics, allProducts] = await Promise.all([
                analyticsService.getSalesAnalytics(pharmacyId),
                analyticsService.getProductAnalytics(pharmacyId),
                inventoryService.getRetailProducts(pharmacyId),
            ]);

            const lowStockAlerts = allProducts.filter(p => p.stock < p.min_stock_level);
            
            const totalRevenue = salesAnalytics.reduce((acc, current) => acc + current.total_sales, 0);
            const today = new Date().toISOString().split('T')[0];
            const salesToday = salesAnalytics
              .filter(s => s.date === today)
              .reduce((acc, current) => acc + current.total_sales, 0);
            const totalOrders = salesAnalytics.reduce((acc, current) => acc + current.total_orders, 0);

            const productSales = productAnalytics.reduce((acc, p) => {
              acc[p.product_id] = (acc[p.product_id] || 0) + p.quantity_sold;
              return acc;
            }, {} as Record<string, number>);

            const topProducts = Object.entries(productSales)
              .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
              .slice(0, 5)
              .map(([productId, sales]) => {
                const product = allProducts.find(p => p.id === productId);
                return { name: product?.name ?? 'Unknown Product', sales };
              });

            return {
                salesData: { totalRevenue, salesToday, totalOrders },
                topProducts,
                lowStockAlerts
            };
        },
        enabled: !!pharmacyId,
    });
};

export default function RetailDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useRetailDashboardData(user?.id);

  if (isLoading) {
    return <LoadingState message="Loading Dashboard Data..." />;
  }

  if (isError) {
    return <EmptyState title="Failed to Load Dashboard" description={error instanceof Error ? error.message : 'An unknown error occurred.'} icon={<Package />} />;
  }

  // Provide default values to prevent undefined errors
  const salesData = data?.salesData || { totalRevenue: 0, salesToday: 0, totalOrders: 0 };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Welcome back, {user?.pharmacyName ?? user?.name ?? 'Retailer'}!
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${salesData.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${salesData.salesToday.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.lowStockAlerts?.length || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
