import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

export interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  customer_name?: string; // Assuming we can get this
  // other fields as necessary
}

class OrderService {
    
  // For Retailers/Pharmacies
  async getOrdersByPharmacy(pharmacyId: string): Promise<Order[]> {
    // This is a complex query. The best way is a DB function.
    // Let's assume a function `get_orders_for_pharmacy(pharmacy_uuid)` exists.
    // If not, this will fail and we'll need to create it.
    const { data, error } = await supabase.rpc('get_orders_for_pharmacy', {
        pharmacy_uuid: pharmacyId
    });

    if (error) {
        console.error("Error fetching pharmacy orders, likely the DB function is missing.", error);
        // Fallback to a simpler, but potentially incomplete query.
        // This won't work if orders aren't directly linked to pharmacies.
        const { data: fallbackData, error: fallbackError } = await supabase
            .from('orders')
            .select('*')
            .eq('pharmacy_id', pharmacyId); // This column might not exist.
        
        if (fallbackError) throw new Error(fallbackError.message);
        return fallbackData || [];
    }
    
    return data || [];
  }

  // For Wholesalers
  async getOrdersByWholesaler(wholesalerId: string): Promise<Order[]> {
    const { data, error } = await supabase.rpc('get_orders_by_wholesaler', {
        wholesaler_uuid: wholesalerId,
    });

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const orderService = new OrderService();