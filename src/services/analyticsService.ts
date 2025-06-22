import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

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
    try {
      // Try with pharmacy_id first
      const { data, error } = await supabase
        .from('sales_analytics')
        .select('date, total_sales, total_orders')
        .eq('pharmacy_id', pharmacyId);
      
      if (!error && data) {
        return data;
      }

      // Fallback: try with user_id
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('sales_analytics')
        .select('date, total_sales, total_orders')
        .eq('user_id', pharmacyId);
        
      if (fallbackError) {
        console.error("Error fetching sales analytics:", fallbackError);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
        return [];
      }
      
      return fallbackData || [];
    } catch (error) {
      console.error("Error in getSalesAnalytics:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  }

  async getProductAnalytics(pharmacyId: string): Promise<ProductAnalytics[]> {
    try {
      // Try with pharmacy_id first
      const { data, error } = await supabase
        .from('product_analytics')
        .select('product_id, quantity_sold')
        .eq('pharmacy_id', pharmacyId);

      if (!error && data) {
        return data;
      }

      // Fallback: try with user_id
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('product_analytics')
        .select('product_id, quantity_sold')
        .eq('user_id', pharmacyId);

      if (fallbackError) {
        console.error("Error fetching product analytics:", fallbackError);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
        return [];
      }

      return fallbackData || [];
    } catch (error) {
      console.error("Error in getProductAnalytics:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  }

  // Get mock data for development/testing
  async getMockSalesAnalytics(): Promise<SalesAnalytics[]> {
    return [
      { date: '2025-01-01', total_sales: 1500, total_orders: 25 },
      { date: '2025-01-02', total_sales: 2200, total_orders: 35 },
      { date: '2025-01-03', total_sales: 1800, total_orders: 30 },
    ];
  }

  async getMockProductAnalytics(): Promise<ProductAnalytics[]> {
    return [
      { product_id: '1', quantity_sold: 50 },
      { product_id: '2', quantity_sold: 30 },
      { product_id: '3', quantity_sold: 25 },
    ];
  }
}

export const analyticsService = new AnalyticsService();