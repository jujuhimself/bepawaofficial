import { supabase } from '../integrations/supabase/client';

export interface SalesAnalytics {
  date: string;
  total_sales: number;
  total_orders: number;
}

export interface ProductAnalytics {
  product_id: string;
  quantity_sold: number;
}

class AnalyticsService {
  async getSalesAnalytics(pharmacyId: string): Promise<SalesAnalytics[]> {
    const { data, error } = await supabase
      .from('sales_analytics')
      .select('date, total_sales, total_orders')
      .eq('pharmacy_id', pharmacyId);
      
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getProductAnalytics(pharmacyId: string): Promise<ProductAnalytics[]> {
    const { data, error } = await supabase
      .from('product_analytics')
      .select('product_id, quantity_sold')
      .eq('pharmacy_id', pharmacyId);

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const analyticsService = new AnalyticsService();