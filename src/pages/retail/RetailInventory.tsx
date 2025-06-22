import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryService, Product } from '../../services/inventoryService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Package, Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

// Types are now more aligned with the service
const newProductInitialState: Omit<Product, 'id' | 'wholesaler_id'> = {
    name: '',
    category: '',
    sku: '',
    stock: 0,
    min_stock_level: 10,
    buy_price: 0,
    sell_price: 0,
    description: '',
    pharmacy_id: ''
};

const RetailInventory = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);

    const { data: products, isLoading, isError, refetch } = useQuery({
        queryKey: ['retailProducts', user?.pharmacyId],
        queryFn: () => inventoryService.getRetailProducts(user!.pharmacyId!),
        enabled: !!user?.pharmacyId,
    });
    
    const productMutation = useMutation({
        mutationFn: (product: Product) => product.id ? inventoryService.updateProduct(product.id, product) : inventoryService.addRetailProduct(product as Omit<Product, 'id'>),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['retailProducts', user?.pharmacyId] });
            toast({ title: "Success", description: "Product saved successfully." });
            setIsDialogOpen(false);
            setActiveProduct(null);
        },
        onError: (error: any) => {
            toast({ title: "Save Error", description: `Failed to save product: ${error.message}`, variant: 'destructive' });
        }
    });

    const productDeleteMutation = useMutation({
        mutationFn: inventoryService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['retailProducts', user?.pharmacyId] });
            toast({ title: "Success", description: "Product deleted successfully." });
        },
        onError: (error: any) => {
             toast({ title: "Delete Error", description: `Failed to delete product: ${error.message}`, variant: 'destructive' });
        }
    });

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setActiveProduct(product);
        } else {
            setActiveProduct({ ...newProductInitialState, pharmacy_id: user!.pharmacyId! });
        }
        setIsDialogOpen(true);
    };
    
    const handleSubmit = () => {
        if (activeProduct) {
            productMutation.mutate(activeProduct);
        }
    };
    
    if (isLoading) return <LoadingState text="Loading your inventory..." />;
    if (isError) return <EmptyState title="Error" description="Could not load inventory." icon={<Package />} />;

    return (
        <div className="container mx-auto p-4 space-y-4">
            <PageHeader title="Retail Inventory"/>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Your Products</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}><RefreshCw className="h-4 w-4" /></Button>
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
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => productDeleteMutation.mutate(product.id!)}>
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
                                <Button onClick={handleSubmit} disabled={productMutation.isPending}>
                                    {productMutation.isPending ? 'Saving...' : 'Save Product'}
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    );
};

export default RetailInventory;