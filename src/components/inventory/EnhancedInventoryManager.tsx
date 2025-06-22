import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryService, Product } from '../../services/inventoryService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Package, Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';

// Types
type ProductFormData = {
  id?: string;
  name: string;
  description?: string;
  category: string;
  sku: string;
  stock: number;
  min_stock_level: number;
  buy_price: number;
  sell_price: number;
  wholesaler_id: string;
};

const newProductInitialState: Omit<ProductFormData, 'id'> = {
    name: '',
    category: '',
    sku: '',
    stock: 0,
    min_stock_level: 10,
    buy_price: 0,
    sell_price: 0,
    description: '',
    wholesaler_id: ''
};

const EnhancedInventoryManager = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<ProductFormData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProducts = async () => {
        if (!user) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const data = await inventoryService.getWholesaleProducts(user.id);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setIsError(true);
            toast({ title: "Error", description: "Failed to load products", variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [user]);

    const handleOpenDialog = (product?: ProductFormData) => {
        if (product) {
            setActiveProduct(product);
        } else {
            setActiveProduct({ ...newProductInitialState, wholesaler_id: user!.id });
        }
        setIsDialogOpen(true);
    };
    
    const handleSubmit = async () => {
        if (!activeProduct) return;
        setIsSaving(true);
        try {
            if (activeProduct.id) {
                await inventoryService.updateProduct(activeProduct.id, activeProduct);
                toast({ title: "Success", description: "Product updated successfully." });
            } else {
                await inventoryService.addWholesaleProduct(activeProduct);
                toast({ title: "Success", description: "Product added successfully." });
            }
            setIsDialogOpen(false);
            setActiveProduct(null);
            fetchProducts(); // Refresh the list
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to save product: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (productId: string) => {
        setIsDeleting(true);
        try {
            await inventoryService.deleteProduct(productId);
            toast({ title: "Success", description: "Product deleted successfully." });
            fetchProducts(); // Refresh the list
        } catch (error: any) {
            toast({ title: "Error", description: `Failed to delete product: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };
    
    if (isLoading) return <LoadingState message="Loading inventory..." />;
    if (isError) return <EmptyState title="Error" description="Could not load inventory." icon={<Package />} />;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Product Inventory</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchProducts} disabled={isLoading}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products && products.length > 0 ? products.map((product: Product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>
                                    <Badge variant={product.stock <= product.min_stock_level ? 'destructive' : 'default'}>
                                        {product.stock}
                                    </Badge>
                                </TableCell>
                                <TableCell>${product.sell_price.toFixed(2)}</TableCell>
                                <TableCell className="space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog({
                                        id: product.id,
                                        name: product.name,
                                        description: product.description,
                                        category: product.category,
                                        sku: product.sku,
                                        stock: product.stock,
                                        min_stock_level: product.min_stock_level,
                                        buy_price: product.buy_price,
                                        sell_price: product.sell_price,
                                        wholesaler_id: product.wholesaler_id || user!.id
                                    })}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDelete(product.id!)}
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                           <TableRow>
                               <TableCell colSpan={5} className="text-center">No products found. Add your first product to get started.</TableCell>
                           </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{activeProduct?.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    {activeProduct && (
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Product Name" value={activeProduct.name} onChange={(e) => setActiveProduct({...activeProduct, name: e.target.value})} />
                            <Textarea placeholder="Description" value={activeProduct.description} onChange={(e) => setActiveProduct({...activeProduct, description: e.target.value})} />
                            <Input placeholder="Category" value={activeProduct.category} onChange={(e) => setActiveProduct({...activeProduct, category: e.target.value})} />
                            <Input placeholder="SKU" value={activeProduct.sku} onChange={(e) => setActiveProduct({...activeProduct, sku: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="number" placeholder="Stock Quantity" value={activeProduct.stock} onChange={(e) => setActiveProduct({...activeProduct, stock: parseInt(e.target.value) || 0})} />
                                <Input type="number" placeholder="Min. Stock Level" value={activeProduct.min_stock_level} onChange={(e) => setActiveProduct({...activeProduct, min_stock_level: parseInt(e.target.value) || 0})} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <Input type="number" placeholder="Buy Price" value={activeProduct.buy_price} onChange={(e) => setActiveProduct({...activeProduct, buy_price: parseFloat(e.target.value) || 0})} />
                                <Input type="number" placeholder="Sell Price" value={activeProduct.sell_price} onChange={(e) => setActiveProduct({...activeProduct, sell_price: parseFloat(e.target.value) || 0})} />
                            </div>
                            <Button onClick={handleSubmit} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Product'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default EnhancedInventoryManager;