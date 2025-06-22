import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { inventoryService, Product } from '../../services/inventoryService';
import { inventoryAdjustmentService, InventoryAdjustment } from '../../services/inventoryAdjustmentService';
import { auditService } from '../../services/auditService';
import { Plus, Package, TrendingUp, TrendingDown, AlertTriangle, Calendar, User } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const WholesaleAdjustment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterProduct, setFilterProduct] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [adjustmentsData, productsData] = await Promise.all([
        inventoryAdjustmentService.fetchAdjustments(),
        inventoryService.getWholesaleProducts(user!.id)
      ]);
      setAdjustments(adjustmentsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load adjustment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0 || !reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const product = products.find(p => p.id === selectedProduct);
      if (!product) throw new Error('Product not found');

      const currentStock = product.stock;
      const newStock = adjustmentType === 'add' 
        ? currentStock + quantity 
        : currentStock - quantity;

      if (newStock < 0) {
        toast({
          title: "Error",
          description: "Insufficient stock for removal",
          variant: "destructive",
        });
        return;
      }

      // Update stock
      await inventoryService.updateStock(selectedProduct, newStock, reason);
      
      // Create adjustment record
      await inventoryAdjustmentService.createAdjustment({
        user_id: user!.id,
        product_id: selectedProduct,
        adjustment_type: adjustmentType,
        quantity,
        reason,
      });

      // Log audit
      await auditService.logStockUpdate(selectedProduct, currentStock, newStock, reason);

      toast({
        title: "Success",
        description: `Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`,
      });

      // Reset form and refresh data
      setSelectedProduct('');
      setAdjustmentType('add');
      setQuantity(1);
      setReason('');
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process adjustment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredAdjustments = () => {
    return adjustments.filter(adj => {
      const typeMatch = filterType === 'all' || adj.adjustment_type === filterType;
      const productMatch = !filterProduct || adj.product_id === filterProduct;
      return typeMatch && productMatch;
    });
  };

  const getAdjustmentIcon = (type: string) => {
    return type === 'add' ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getAdjustmentColor = (type: string) => {
    return type === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div>Loading adjustments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Inventory Adjustments"
          description="Manage inventory stock adjustments and track changes"
          badge={{ text: "Wholesale Portal", variant: "outline" }}
        />

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="add">Additions</SelectItem>
                <SelectItem value="remove">Removals</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Products</SelectItem>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        </div>

        <div className="grid gap-4">
          {getFilteredAdjustments().length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No adjustments found</h3>
                <p className="text-gray-600">
                  {filterType !== 'all' || filterProduct ? 'Try adjusting your filters' : 'No inventory adjustments have been made yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            getFilteredAdjustments().map((adjustment) => {
              const product = products.find(p => p.id === adjustment.product_id);
              return (
                <Card key={adjustment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {getAdjustmentIcon(adjustment.adjustment_type)}
                        <div>
                          <h3 className="text-lg font-semibold">
                            {product?.name || 'Unknown Product'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {adjustment.reason}
                          </p>
                        </div>
                      </div>
                      <Badge className={getAdjustmentColor(adjustment.adjustment_type)}>
                        {adjustment.adjustment_type === 'add' ? '+' : '-'}{adjustment.quantity}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(adjustment.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>{adjustment.user_id}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          {adjustment.adjustment_type === 'add' ? 'Stock Added' : 'Stock Removed'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Inventory Adjustment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={(value: 'add' | 'remove') => setAdjustmentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="remove">Remove Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Damaged goods, Found inventory, etc."
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Create Adjustment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WholesaleAdjustment;
