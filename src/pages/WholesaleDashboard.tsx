import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BackupScheduleManager from "../components/BackupScheduleManager";
import { Button } from "../components/ui/button";
import WholesaleStatsCards from "../components/wholesale/WholesaleStatsCards";
import WholesaleQuickActions from "../components/wholesale/WholesaleQuickActions";
import WholesaleRecentOrders from "../components/wholesale/WholesaleRecentOrders";
import WholesalePendingApprovalNotice from "../components/wholesale/WholesalePendingApprovalNotice";
import { orderService, Order } from "../services/orderService";
import { inventoryService } from "../services/inventoryService";

const WholesaleDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeRetailers: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'wholesale') {
      navigate('/login');
      return;
    }
    if (!user.isApproved) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedOrders = await orderService.getOrdersByWholesaler(user.id);
        const lowStock = await inventoryService.getLowStockProducts(user.id);

        const totalRevenue = fetchedOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = fetchedOrders.length;
        const activeRetailers = new Set(fetchedOrders.map(o => o.pharmacyName)).size;
        
        setOrders(fetchedOrders.slice(0, 5)); // show recent 5
        setStats({
          totalRevenue,
          totalOrders,
          activeRetailers,
          lowStockItems: lowStock.length,
        });

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!user?.isApproved) {
    return <WholesalePendingApprovalNotice />;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Welcome, {user?.name}</h1>
        <Button asChild variant="outline">
          <Link to="/wholesale/business-tools">Business Tools</Link>
        </Button>
      </div>
      <BackupScheduleManager />
      <WholesaleStatsCards stats={stats} />
      <WholesaleQuickActions />
      <WholesaleRecentOrders orders={orders} />
    </div>
  );
};

export default WholesaleDashboard;
