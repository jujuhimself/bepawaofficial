import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProduct, useDeleteProduct } from "@/hooks/useInventory";
import { Product } from "@/services/inventoryService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProductImageManager from "./ProductImageManager";
import { useAuth } from "@/contexts/AuthContext";

interface ProductEditDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductEditDialog = ({ product, open, onOpenChange }: ProductEditDialogProps) => {
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sku: "",
    description: "",
    stock: 0,
    min_stock: 0,
    max_stock: 0,
    buy_price: 0,
    sell_price: 0,
    supplier: "",
    expiry_date: "",
    batch_number: ""
  });
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        sku: product.sku,
        description: product.description || "",
        stock: product.stock,
        min_stock: product.min_stock,
        max_stock: product.max_stock || 0,
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        supplier: product.supplier || "",
        expiry_date: product.expiry_date || "",
        batch_number: product.batch_number || ""
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason && !customReason) {
      alert("Please provide a reason for the update.");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        updates: formData,
        oldProduct: product,
        reason: reason === 'other' ? customReason : reason
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync({ id: product.id, product });
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product image manager (if user) */}
            {user?.id && (
              <div className="md:col-span-2">
                <ProductImageManager
                  userId={user.id}
                  productId={product.id}
                  // no initialImageKey for now; could be product.image_key if added to schema
                />
              </div>
            )}
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="min_stock">Minimum Stock *</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => handleChange('min_stock', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="max_stock">Maximum Stock</Label>
              <Input
                id="max_stock"
                type="number"
                min="0"
                value={formData.max_stock}
                onChange={(e) => handleChange('max_stock', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => handleChange('batch_number', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="buy_price">Buy Price (TZS) *</Label>
              <Input
                id="buy_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.buy_price}
                onChange={(e) => handleChange('buy_price', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sell_price">Sell Price (TZS) *</Label>
              <Input
                id="sell_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.sell_price}
                onChange={(e) => handleChange('sell_price', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason for Update *</Label>
              <select
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className="border rounded px-2 py-1 w-full"
              >
                <option value="">Select reason</option>
                <option value="theft">Theft</option>
                <option value="damage">Damage</option>
                <option value="expiration">Expiration</option>
                <option value="correction">Correction</option>
                <option value="other">Other</option>
              </select>
              {reason === 'other' && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom reason"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Delete Product
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product
                    and all associated inventory data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleteProduct.isPending}>
                    {deleteProduct.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;
