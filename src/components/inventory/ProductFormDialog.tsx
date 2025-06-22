import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { inventoryService, Product } from '../../services/inventoryService';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  stock: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(0, 'Stock cannot be negative')
  ),
  min_stock: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(0, 'Min stock cannot be negative')
  ),
  buy_price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, 'Buy price must be positive')
  ),
  sell_price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, 'Sell price must be positive')
  ),
  supplier: z.string().optional(),
  expiry_date: z.string().optional(),
  status: z.enum(['in-stock', 'low-stock', 'out-of-stock', 'expired']),
});

interface ProductFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  product?: Product;
  onSubmitSuccess: () => void;
}

export default function ProductFormDialog({
  isOpen,
  setIsOpen,
  product,
  onSubmitSuccess,
}: ProductFormDialogProps) {
  const isEditMode = Boolean(product);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        ...product,
        stock: product.stock ?? 0,
        min_stock: product.min_stock ?? 0,
        buy_price: product.buy_price ?? 0,
        sell_price: product.sell_price ?? 0,
      });
    } else {
      reset({
        name: '',
        category: '',
        sku: '',
        description: '',
        stock: 0,
        min_stock: 10,
        buy_price: 0,
        sell_price: 0,
        supplier: '',
        expiry_date: '',
        status: 'in-stock',
      });
    }
  }, [product, reset, isOpen]);

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    try {
      if (isEditMode && product) {
        await inventoryService.updateProduct(product.id, data);
      } else {
        await inventoryService.createProduct(data as any); // Casting because service expects slightly different type
      }
      onSubmitSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      // Add toast notification for error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" {...register('name')} className="col-span-3" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Input id="category" {...register('category')} className="col-span-3" />
            {errors.category && <p className="col-span-4 text-red-500 text-xs">{errors.category.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">Stock</Label>
            <Input id="stock" type="number" {...register('stock')} className="col-span-3" />
            {errors.stock && <p className="col-span-4 text-red-500 text-xs">{errors.stock.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min_stock" className="text-right">Min Stock</Label>
            <Input id="min_stock" type="number" {...register('min_stock')} className="col-span-3" />
            {errors.min_stock && <p className="col-span-4 text-red-500 text-xs">{errors.min_stock.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buy_price" className="text-right">Buy Price</Label>
            <Input id="buy_price" type="number" {...register('buy_price')} className="col-span-3" />
            {errors.buy_price && <p className="col-span-4 text-red-500 text-xs">{errors.buy_price.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sell_price" className="text-right">Sell Price</Label>
            <Input id="sell_price" type="number" {...register('sell_price')} className="col-span-3" />
            {errors.sell_price && <p className="col-span-4 text-red-500 text-xs">{errors.sell_price.message}</p>}
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiry_date" className="text-right">Expiry Date</Label>
            <Input id="expiry_date" type="date" {...register('expiry_date')} className="col-span-3" />
            {errors.expiry_date && <p className="col-span-4 text-red-500 text-xs">{errors.expiry_date.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 