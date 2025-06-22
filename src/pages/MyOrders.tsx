import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  order_number?: string;
  created_at: string;
  status: string;
  total_amount: number;
}

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, created_at, status, total_amount")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setOrders(data);
        setFiltered(data);
      }
      setLoading(false);
    }
    fetchOrders();
  }, [user]);

  useEffect(() => {
    let filtered = orders;
    if (search) {
      filtered = filtered.filter((o) =>
        (o.order_number || o.id).toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }
    setFiltered(filtered);
  }, [search, status, orders]);

  const statuses = Array.from(new Set(orders.map((o) => o.status))).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="My Orders"
          description="View your order history"
        />
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Input
            placeholder="Search order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders found.</div>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">Order #</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-3 font-mono">{order.order_number || order.id.slice(0, 8)}</td>
                      <td className="p-3">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="p-3"><Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge></td>
                      <td className="p-3 font-semibold text-green-700">TZS {Number(order.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
