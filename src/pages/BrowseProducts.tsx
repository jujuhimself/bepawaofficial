import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  sell_price: number;
  stock: number;
  retailer_id?: string;
  retailer_name?: string;
}

const BrowseProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      // Fetch products from all approved retailers with retailer info
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          category, 
          description, 
          sell_price, 
          stock,
          retailer_id,
          profiles!inner(business_name, is_approved)
        `)
        .neq("status", "deleted")
        .gt("stock", 0)
        .eq("profiles.is_approved", true)
        .order("name");
      
      if (!error && data) {
        const processedData = data.map((p: any) => ({
          ...p,
          retailer_name: p.profiles?.business_name || "Pharmacy"
        }));
        setProducts(processedData);
        setFiltered(processedData);
        setCategories([
          ...new Set(processedData.map((p: any) => p.category).filter(Boolean)),
        ]);
        
        // Generate suggested products based on user's recent orders
        if (user?.id) {
          generateSuggestedProducts(processedData);
        }
      }
      setLoading(false);
    }
    fetchProducts();
  }, [user]);

  const generateSuggestedProducts = async (allProducts: Product[]) => {
    if (!user?.id) return;
    
    // Fetch user's recent orders to suggest similar products
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("items")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (recentOrders && recentOrders.length > 0) {
      // Extract categories from recent orders
      const recentCategories = new Set<string>();
      recentOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.category) recentCategories.add(item.category);
          });
        }
      });
      
      // Suggest products from similar categories
      const suggested = allProducts
        .filter(p => recentCategories.has(p.category))
        .slice(0, 6);
      
      setSuggestedProducts(suggested);
    }
  };

  useEffect(() => {
    let filtered = products;
    if (search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    setFiltered(filtered);
  }, [search, category, products]);

  function addToCart(product: Product) {
    const cartKey = `cart_individual`;
    const existingCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const existingItem = existingCart.find((item: any) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      existingCart.push({ 
        ...product, 
        quantity: 1,
        price: product.sell_price // Ensure price is set correctly
      });
    }
    localStorage.setItem(cartKey, JSON.stringify(existingCart));
    alert(`${product.name} added to cart!`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Browse Products"
          description="Find and order medicines and other products"
        />
        
        {/* Suggested Products */}
        {suggestedProducts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Suggested for You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {suggestedProducts.map((product) => (
                <Card key={product.id} className="flex flex-col h-full">
                  <CardContent className="flex flex-col flex-1 p-4">
                    <div className="font-bold text-sm mb-1">{product.name}</div>
                    <div className="text-xs text-gray-500 mb-2">{product.category}</div>
                    <div className="font-semibold text-green-700 mb-2">TZS {product.sell_price.toLocaleString()}</div>
                    <Button size="sm" onClick={() => addToCart(product)} disabled={product.stock === 0}>
                      {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <Card key={product.id} className="flex flex-col h-full">
                <CardContent className="flex flex-col flex-1 p-4">
                  <div className="font-bold text-lg mb-1">{product.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{product.category}</div>
                  <div className="text-sm mb-2 flex-1">{product.description}</div>
                  <div className="font-semibold text-green-700 mb-2">TZS {product.sell_price.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mb-2">Stock: {product.stock}</div>
                  <div className="text-xs text-blue-600 mb-2">From: {product.retailer_name}</div>
                  <Button onClick={() => addToCart(product)} disabled={product.stock === 0}>
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseProducts;
