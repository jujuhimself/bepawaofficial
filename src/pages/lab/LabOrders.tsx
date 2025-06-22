import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { TestTube, Calendar, User, Phone, Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { supabase } from "../../integrations/supabase/client";
import { useToast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import { labService } from "../../services/labService";
import { NewLabOrderDialog } from "../../components/lab/NewLabOrderDialog";

interface LabOrder {
  id: string;
  user_id: string;
  patient_name: string;
  patient_phone?: string;
  doctor_name: string;
  order_date: string;
  status: 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  items: Array<{
    test_name: string;
    test_price: number;
    status: string;
  }>;
}

const LabOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          lab_order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedOrders: LabOrder[] = (data || []).map(order => ({
        id: order.id,
        user_id: order.user_id,
        patient_name: order.patient_name,
        patient_phone: order.patient_phone || undefined,
        doctor_name: order.doctor_name,
        order_date: order.order_date,
        status: order.status as 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled',
        total_amount: order.total_amount,
        items: (order.lab_order_items || []).map((item: any) => ({
          test_name: item.test_name,
          test_price: item.test_price,
          status: item.status
        }))
      }));

      setOrders(typedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOrderCreated = () => {
    fetchOrders();
    setIsNewOrderDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sample_collected': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenStatusDialog = (order: LabOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = (value: string) => setNewStatus(value);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await labService.updateLabOrderStatus(selectedOrder.id, newStatus as any);
      toast({ title: "Status Updated", description: `Order status updated to ${newStatus}.` });
      setStatusDialogOpen(false);
      fetchOrders();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div>Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Lab Orders"
          description="Manage laboratory test orders"
          badge={{ text: "Lab Portal", variant: "outline" }}
        />

        <div className="flex justify-end mb-6">
          <Button onClick={() => setIsNewOrderDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-4">
                No lab orders have been placed yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Order #{order.id.slice(0, 8)}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-1" />
                        <span>{order.patient_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <span className="text-sm">Doctor: {order.doctor_name}</span>
                      </div>
                      {order.patient_phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>{order.patient_phone}</span>
                        </div>
                      )}
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(order.order_date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.items.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <h4 className="text-sm font-medium mb-2">Tests ({order.items.length})</h4>
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.test_name}</span>
                            <span>${item.test_price.toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{order.items.length - 3} more tests
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenStatusDialog(order)}>
                      Update Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <Select value={newStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sample_collected">Sample Collected</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateStatus} disabled={updatingStatus || !newStatus}>
                {updatingStatus ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <NewLabOrderDialog
        isOpen={isNewOrderDialogOpen}
        onClose={() => setIsNewOrderDialogOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default LabOrders;