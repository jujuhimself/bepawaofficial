import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

export interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  customer_name?: string;
  user_id?: string;
  // other fields as necessary
}

class OrderService {
    
  // For Retailers/Pharmacies
  async getOrdersByPharmacy(pharmacyId: string): Promise<Order[]> {
    try {
      // Try the database function first
      const { data, error } = await supabase.rpc('get_orders_for_pharmacy', {
          pharmacy_uuid: pharmacyId
      });

      if (!error && data) {
          return data;
      }

      // Fallback: get orders by user_id (pharmacy user)
      const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', pharmacyId);
      
      if (fallbackError) {
          console.error("Error fetching pharmacy orders:", fallbackError);
          toast({
              title: "Error",
              description: "Failed to load orders. Please try again.",
              variant: "destructive",
          });
          return [];
      }
      
      return fallbackData || [];
    } catch (error) {
      console.error("Error in getOrdersByPharmacy:", error);
      toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
      });
      return [];
    }
  }

  // For Wholesalers
  async getOrdersByWholesaler(wholesalerId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase.rpc('get_orders_by_wholesaler', {
          wholesaler_uuid: wholesalerId,
      });

      if (error) {
          console.error("Error fetching wholesaler orders:", error);
          // Fallback: get orders that contain products from this wholesaler
          const { data: fallbackData, error: fallbackError } = await supabase
              .from('orders')
              .select(`
                  *,
                  order_items!inner(
                      product_id,
                      products!inner(wholesaler_id)
                  )
              `)
              .eq('order_items.products.wholesaler_id', wholesalerId);
          
          if (fallbackError) {
              toast({
                  title: "Error",
                  description: "Failed to load orders. Please try again.",
                  variant: "destructive",
              });
              return [];
          }
          
          return fallbackData || [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Error in getOrdersByWholesaler:", error);
      toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
      });
      return [];
    }
  }

  // For Retailers (direct orders)
  async getOrdersByRetailer(retailerId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', retailerId);
      
      if (error) {
          console.error("Error fetching retailer orders:", error);
          toast({
              title: "Error",
              description: "Failed to load orders. Please try again.",
              variant: "destructive",
          });
          return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Error in getOrdersByRetailer:", error);
      toast({
          title: "Error",
          description: "Failed to load orders. Please try again.",
          variant: "destructive",
      });
      return [];
    }
  }
}

export const orderService = new OrderService();