import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import { inventoryService } from '../../services/inventoryService';
import { Plus, Package, Save, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useNavigate } from 'react-router-dom';

const CreateProduct = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    description: '',
    stock: 0,
    min_stock_level: 10,
    buy_price: 0,
    sell_price: 0,
  });

  const categories = [
    'Pain Relief',
    'Antibiotics',
    'Vitamins & Supplements',
    'Gastrointestinal',
    'Cardiovascular',
    'Respiratory',
    'Dermatological',
    'Neurological',
    'Endocrine',
    'Other'
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.sku.trim()) {
      toast({
        title: "Validation Error",
        description: "SKU is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.buy_price <= 0) {
      toast({
        title: "Validation Error",
        description: "Buy price must be greater than 0",
        variant: "destructive",
      });
      return false;
    }

    if (formData.sell_price <= 0) {
      toast({
        title: "Validation Error",
        description: "Sell price must be greater than 0",
        variant: "destructive",
      });
      return false;
    }

    if (formData.sell_price <= formData.buy_price) {
      toast({
        title: "Validation Error",
        description: "Sell price must be greater than buy price",
        variant: "destructive",
      });
      return false;
    }

    if (formData.min_stock_level < 0) {
      toast({
        title: "Validation Error",
        description: "Minimum stock level cannot be negative",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const product = await inventoryService.addRetailProduct({
        ...formData,
        pharmacy_id: user!.id,
      });

      toast({
        title: "Success",
        description: `Product "${product.name}" created successfully`,
      });

      // Reset form
      setFormData({
        name: '',
        category: '',
        sku: '',
        description: '',
        stock: 0,
        min_stock_level: 10,
        buy_price: 0,
        sell_price: 0,
      });

      // Navigate back to inventory
      navigate('/retail/inventory');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProfit = () => {
    const profit = formData.sell_price - formData.buy_price;
    const profitMargin = formData.buy_price > 0 ? (profit / formData.buy_price) * 100 : 0;
    return { profit, profitMargin };
  };

  const { profit, profitMargin } = calculateProfit();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Create New Product"
          description="Add a new product to your inventory"
          badge={{ text: "Retail Portal", variant: "outline" }}
        />

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Paracetamol 500mg"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU (Stock Keeping Unit) *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="e.g., PAR-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Product description, usage instructions, etc."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Stock Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Stock Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock">Initial Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        min="0"
                        value={formData.min_stock_level}
                        onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pricing Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buy_price">Buy Price (₦) *</Label>
                      <Input
                        id="buy_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.buy_price}
                        onChange={(e) => handleInputChange('buy_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="sell_price">Sell Price (₦) *</Label>
                      <Input
                        id="sell_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.sell_price}
                        onChange={(e) => handleInputChange('sell_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  {/* Profit Calculation */}
                  {formData.buy_price > 0 && formData.sell_price > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Profit Analysis</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Profit per unit:</span>
                          <span className="ml-2 font-medium text-blue-900">₦{profit.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Profit margin:</span>
                          <span className="ml-2 font-medium text-blue-900">{profitMargin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/retail/inventory')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
