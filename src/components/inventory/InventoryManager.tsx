import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { inventoryService, InventoryItem } from '@/services/inventoryService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function InventoryManager({ businessId }: { businessId: string }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    quantity: 0,
    min_stock_level: 0,
    max_stock_level: 0,
    reorder_point: 0,
    unit_price: 0,
    stock_location: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
  }, [businessId]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory(businessId);
      setInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await inventoryService.updateInventoryItem(selectedItem.id, formData);
        toast({
          title: 'Success',
          description: 'Inventory item updated successfully.',
        });
        setShowEditDialog(false);
      } else {
        await inventoryService.createInventoryItem({
          ...formData,
          business_id: businessId,
        });
        toast({
          title: 'Success',
          description: 'Inventory item created successfully.',
        });
        setShowAddDialog(false);
      }
      loadInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save inventory item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAdjustStock = async (id: string, quantity: number) => {
    try {
      await inventoryService.adjustStock(
        id,
        quantity,
        'adjustment',
        undefined,
        undefined,
        'Manual stock adjustment'
      );
      toast({
        title: 'Success',
        description: 'Stock adjusted successfully.',
      });
      loadInventory();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust stock. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku,
      quantity: item.quantity,
      min_stock_level: item.min_stock_level,
      max_stock_level: item.max_stock_level,
      reorder_point: item.reorder_point,
      unit_price: item.unit_price,
      stock_location: item.stock_location || '',
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      quantity: 0,
      min_stock_level: 0,
      max_stock_level: 0,
      reorder_point: 0,
      unit_price: 0,
      stock_location: '',
    });
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventory Management</CardTitle>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading inventory...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Min Stock</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Restock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.min_stock_level}</TableCell>
                    <TableCell className="text-right">{item.reorder_point}</TableCell>
                    <TableCell className="text-right">TZS {item.unit_price.toLocaleString()}</TableCell>
                    <TableCell>{item.stock_location || '-'}</TableCell>
                    <TableCell>
                      {item.last_restock_date
                        ? format(new Date(item.last_restock_date), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const qty = window.prompt('Enter adjustment quantity (use negative for reduction):');
                            if (qty !== null) {
                              handleAdjustStock(item.id, parseInt(qty, 10));
                            }
                          }}
                        >
                          Adjust Stock
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog || showEditDialog} onOpenChange={() => {
        setShowAddDialog(false);
        setShowEditDialog(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Min Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_stock_level">Max Stock Level</Label>
                <Input
                  id="max_stock_level"
                  type="number"
                  value={formData.max_stock_level}
                  onChange={(e) => setFormData({ ...formData, max_stock_level: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_point">Reorder Point</Label>
                <Input
                  id="reorder_point"
                  type="number"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_location">Stock Location</Label>
                <Input
                  id="stock_location"
                  value={formData.stock_location}
                  onChange={(e) => setFormData({ ...formData, stock_location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit">{selectedItem ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 