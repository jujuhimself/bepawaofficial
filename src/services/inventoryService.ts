import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  description?: string;
  stock: number;
  min_stock_level: number;
  buy_price: number;
  sell_price: number;
  pharmacy_id?: string;
  wholesaler_id?: string;
  user_id?: string;
  is_wholesale_product?: boolean;
  is_retail_product?: boolean;
  is_public_product?: boolean;
}

class InventoryService {
  // For Retailers - Get their own products
  async getRetailProducts(pharmacyId: string): Promise<Product[]> {
    try {
      // Try with user_id first (most common)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', pharmacyId)
        .eq('is_retail_product', true);

      if (!error && data) {
        return data;
      }

      // Fallback: try with pharmacy_id
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .eq('is_retail_product', true);

      if (fallbackError) {
        console.error('Error fetching retail products:', fallbackError);
        toast({
          title: "Error",
          description: "Failed to load products. Using mock data.",
          variant: "destructive",
        });
        return this.getMockRetailProducts(pharmacyId);
      }

      return fallbackData || [];
    } catch (error) {
      console.error('Error in getRetailProducts:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Using mock data.",
        variant: "destructive",
      });
      return this.getMockRetailProducts(pharmacyId);
    }
  }
  
  // For Wholesalers - Get their own products
  async getWholesaleProducts(wholesalerId: string): Promise<Product[]> {
    try {
      // Try with user_id first (most common)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', wholesalerId)
        .eq('is_wholesale_product', true);
        
      if (!error && data) {
        return data;
      }

      // Fallback: try with wholesaler_id
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select('*')
        .eq('wholesaler_id', wholesalerId)
        .eq('is_wholesale_product', true);

      if (fallbackError) {
        console.error('Error fetching wholesale products:', fallbackError);
        toast({
          title: "Error",
          description: "Failed to load products. Using mock data.",
          variant: "destructive",
        });
        return this.getMockWholesaleProducts(wholesalerId);
      }

      return fallbackData || [];
    } catch (error) {
      console.error('Error in getWholesaleProducts:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Using mock data.",
        variant: "destructive",
      });
      return this.getMockWholesaleProducts(wholesalerId);
    }
  }

  // For Individuals - Get public products
  async getPublicProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_public_product', true);

      if (error) {
        console.error('Error fetching public products:', error);
        toast({
          title: "Error",
          description: "Failed to load products. Using mock data.",
          variant: "destructive",
        });
        return this.getMockPublicProducts();
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPublicProducts:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Using mock data.",
        variant: "destructive",
      });
      return this.getMockPublicProducts();
    }
  }

  // Role-based product fetching
  async getProductsByRole(userId: string, userRole: string): Promise<Product[]> {
    switch (userRole) {
      case 'retail':
        return this.getRetailProducts(userId);
      case 'wholesale':
        return this.getWholesaleProducts(userId);
      case 'individual':
        return this.getPublicProducts();
      case 'admin':
        // Admins can see all products
        const { data, error } = await supabase
          .from('products')
          .select('*');
        
        if (error) {
          console.error('Error fetching all products:', error);
          toast({
            title: "Error",
            description: "Failed to load products.",
            variant: "destructive",
          });
          return [];
        }
        return data || [];
      default:
        return [];
    }
  }
  
  async addRetailProduct(product: Omit<Product, 'id' | 'wholesaler_id'>): Promise<Product> {
    try {
      const productData = {
        ...product,
        is_retail_product: true,
        user_id: product.pharmacy_id, // Use user_id as primary identifier
        pharmacy_id: product.pharmacy_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding retail product:', error);
        toast({
          title: "Error",
          description: "Failed to add product. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Product added successfully!",
      });
      
      return data;
    } catch (error) {
      console.error('Error in addRetailProduct:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }
  
  async addWholesaleProduct(product: Omit<Product, 'id' | 'pharmacy_id'>): Promise<Product> {
    try {
      const productData = {
        ...product,
        is_wholesale_product: true,
        user_id: product.wholesaler_id, // Use user_id as primary identifier
        wholesaler_id: product.wholesaler_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding wholesale product:', error);
        toast({
          title: "Error",
          description: "Failed to add product. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Product added successfully!",
      });
      
      return data;
    } catch (error) {
      console.error('Error in addWholesaleProduct:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Common
  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw error;
    }
  }

  // Update stock level
  async updateStock(productId: string, newStock: number, reason?: string): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          stock: newStock, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', productId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateStock:', error);
      throw error;
    }
  }
  
  async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw error;
    }
  }

  // Mock data methods
  private getMockRetailProducts(pharmacyId: string): Product[] {
    return [
      {
        id: '1',
        name: 'Paracetamol 500mg',
        category: 'Pain Relief',
        sku: 'PAR-500',
        description: 'Pain relief tablets',
        stock: 150,
        min_stock_level: 20,
        buy_price: 50,
        sell_price: 100,
        pharmacy_id: pharmacyId,
        user_id: pharmacyId,
        is_retail_product: true
      },
      {
        id: '2',
        name: 'Amoxicillin 250mg',
        category: 'Antibiotics',
        sku: 'AMX-250',
        description: 'Antibiotic capsules',
        stock: 75,
        min_stock_level: 15,
        buy_price: 200,
        sell_price: 400,
        pharmacy_id: pharmacyId,
        user_id: pharmacyId,
        is_retail_product: true
      }
    ];
  }

  private getMockWholesaleProducts(wholesalerId: string): Product[] {
    return [
      {
        id: '3',
        name: 'Ibuprofen 400mg',
        category: 'Pain Relief',
        sku: 'IBU-400',
        description: 'Anti-inflammatory tablets',
        stock: 500,
        min_stock_level: 100,
        buy_price: 30,
        sell_price: 80,
        wholesaler_id: wholesalerId,
        user_id: wholesalerId,
        is_wholesale_product: true
      },
      {
        id: '4',
        name: 'Omeprazole 20mg',
        category: 'Gastrointestinal',
        sku: 'OME-20',
        description: 'Acid reflux medication',
        stock: 300,
        min_stock_level: 50,
        buy_price: 150,
        sell_price: 300,
        wholesaler_id: wholesalerId,
        user_id: wholesalerId,
        is_wholesale_product: true
      }
    ];
  }

  private getMockPublicProducts(): Product[] {
    return [
      {
        id: '5',
        name: 'Vitamin C 1000mg',
        category: 'Vitamins',
        sku: 'VIT-C-1000',
        description: 'Immune support supplement',
        stock: 200,
        min_stock_level: 30,
        buy_price: 80,
        sell_price: 150,
        is_public_product: true
      },
      {
        id: '6',
        name: 'Zinc 50mg',
        category: 'Minerals',
        sku: 'ZNC-50',
        description: 'Mineral supplement',
        stock: 150,
        min_stock_level: 25,
        buy_price: 60,
        sell_price: 120,
        is_public_product: true
      }
    ];
  }
}

export const inventoryService = new InventoryService();