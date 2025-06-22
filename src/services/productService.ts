import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  stock: number;
  min_stock: number;
  max_stock?: number;
  buy_price: number;
  sell_price: number;
  supplier?: string;
  expiry_date?: string;
  batch_number?: string;
  last_ordered?: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_wholesale_product?: boolean;
  is_retail_product?: boolean;
  is_public_product?: boolean;
  wholesaler_id?: string;
  retailer_id?: string;
  wholesaler_name?: string;
  retailer_name?: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  category: string;
  sku?: string;
  stock: number;
  min_stock: number;
  max_stock?: number;
  buy_price: number;
  sell_price: number;
  supplier?: string;
  expiry_date?: string;
  batch_number?: string;
  is_wholesale_product?: boolean;
  is_retail_product?: boolean;
  is_public_product?: boolean;
}

class ProductService {
  // Get products based on user role and permissions
  async getProducts(userRole: string, userId: string): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        wholesaler_profile:profiles!products_wholesaler_id_fkey(business_name),
        retailer_profile:profiles!products_retailer_id_fkey(business_name)
      `);

    // Apply role-based filtering
    switch (userRole) {
      case 'wholesale':
        // Wholesalers see their own products and can see other wholesalers' products
        query = query.or(`wholesaler_id.eq.${userId},is_wholesale_product.eq.true`);
        break;
      case 'retail':
        // Retailers see wholesale products (for ordering) and their own retail products
        query = query.or(`is_wholesale_product.eq.true,retailer_id.eq.${userId},is_retail_product.eq.true`);
        break;
      case 'individual':
        // Individuals see public retail products
        query = query.eq('is_public_product', true);
        break;
      case 'admin':
        // Admins see all products
        break;
      default:
        // Default to public products
        query = query.eq('is_public_product', true);
    }

    const { data, error } = await query.gt('stock', 0).order('name');

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    // Transform data to include wholesaler/retailer names
    return data.map((product: any) => ({
      ...product,
      wholesaler_name: product.wholesaler_profile?.business_name || 'Unknown Wholesaler',
      retailer_name: product.retailer_profile?.business_name || 'Unknown Retailer'
    }));
  }

  // Get wholesale products for retailers
  async getWholesaleProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_wholesaler_id_fkey(business_name, is_approved)
      `)
      .eq('is_wholesale_product', true)
      .eq('profiles.is_approved', true)
      .gt('stock', 0)
      .order('name');

    if (error) {
      console.error('Error fetching wholesale products:', error);
      throw new Error(error.message);
    }

    return data.map((product: any) => ({
      ...product,
      wholesaler_name: product.profiles?.business_name || 'Unknown Wholesaler'
    }));
  }

  // Get retail products for individuals
  async getRetailProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_retailer_id_fkey(business_name, is_approved)
      `)
      .eq('is_public_product', true)
      .eq('profiles.is_approved', true)
      .gt('stock', 0)
      .order('name');

    if (error) {
      console.error('Error fetching retail products:', error);
      throw new Error(error.message);
    }

    return data.map((product: any) => ({
      ...product,
      retailer_name: product.profiles?.business_name || 'Unknown Retailer'
    }));
  }

  // Create a new product with proper role-based settings
  async createProduct(productData: CreateProductData, userRole: string, userId: string): Promise<Product> {
    const productPayload: any = {
      ...productData,
      user_id: userId,
      status: 'in-stock'
    };

    // Set role-specific fields
    if (userRole === 'wholesale') {
      productPayload.is_wholesale_product = true;
      productPayload.wholesaler_id = userId;
    } else if (userRole === 'retail') {
      productPayload.is_retail_product = true;
      productPayload.retailer_id = userId;
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productPayload)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Update product stock
  async updateStock(productId: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) {
      console.error('Error updating stock:', error);
      throw new Error(error.message);
    }
  }

  // Update product details
  async updateProduct(productId: string, updates: Partial<CreateProductData>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Delete product (soft delete)
  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error(error.message);
    }
  }

  // Get product by ID with proper access control
  async getProductById(productId: string, userRole: string, userId: string): Promise<Product | null> {
    let query = supabase
      .from('products')
      .select(`
        *,
        wholesaler_profile:profiles!products_wholesaler_id_fkey(business_name),
        retailer_profile:profiles!products_retailer_id_fkey(business_name)
      `)
      .eq('id', productId);

    // Apply role-based access control
    switch (userRole) {
      case 'wholesale':
        query = query.or(`wholesaler_id.eq.${userId},is_wholesale_product.eq.true`);
        break;
      case 'retail':
        query = query.or(`is_wholesale_product.eq.true,retailer_id.eq.${userId},is_retail_product.eq.true`);
        break;
      case 'individual':
        query = query.eq('is_public_product', true);
        break;
      case 'admin':
        // Admins can see all products
        break;
      default:
        query = query.eq('is_public_product', true);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Product not found or access denied
      }
      console.error('Error fetching product:', error);
      throw new Error(error.message);
    }

    return {
      ...data,
      wholesaler_name: data.wholesaler_profile?.business_name || 'Unknown Wholesaler',
      retailer_name: data.retailer_profile?.business_name || 'Unknown Retailer'
    };
  }

  // Search products with role-based filtering
  async searchProducts(
    searchTerm: string, 
    userRole: string, 
    userId: string,
    category?: string
  ): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        wholesaler_profile:profiles!products_wholesaler_id_fkey(business_name),
        retailer_profile:profiles!products_retailer_id_fkey(business_name)
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    // Apply role-based filtering
    switch (userRole) {
      case 'wholesale':
        query = query.or(`wholesaler_id.eq.${userId},is_wholesale_product.eq.true`);
        break;
      case 'retail':
        query = query.or(`is_wholesale_product.eq.true,retailer_id.eq.${userId},is_retail_product.eq.true`);
        break;
      case 'individual':
        query = query.eq('is_public_product', true);
        break;
      case 'admin':
        // Admins can see all products
        break;
      default:
        query = query.eq('is_public_product', true);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query.gt('stock', 0).order('name');

    if (error) {
      console.error('Error searching products:', error);
      throw new Error(error.message);
    }

    return data.map((product: any) => ({
      ...product,
      wholesaler_name: product.wholesaler_profile?.business_name || 'Unknown Wholesaler',
      retailer_name: product.retailer_profile?.business_name || 'Unknown Retailer'
    }));
  }

  // Get product categories based on user role
  async getCategories(userRole: string, userId: string): Promise<string[]> {
    const products = await this.getProducts(userRole, userId);
    return [...new Set(products.map(p => p.category).filter(Boolean))];
  }

  // Log product sharing activity
  async logProductSharing(
    productId: string, 
    sharedBy: string, 
    sharedWithRole: string, 
    action: 'view' | 'order' | 'update'
  ): Promise<void> {
    const { error } = await supabase.rpc('log_product_sharing', {
      p_product_id: productId,
      p_shared_by: sharedBy,
      p_shared_with_role: sharedWithRole,
      p_action: action
    });

    if (error) {
      console.error('Error logging product sharing:', error);
      // Don't throw error as this is not critical
    }
  }
}

export const productService = new ProductService(); 