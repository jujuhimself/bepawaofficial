import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, Product, InventoryMovement, Supplier, PurchaseOrder, PurchaseOrderItem } from '@/services/inventoryService';
import { auditService } from '@/services/auditService';
import { useToast } from '@/hooks/use-toast';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: inventoryService.getProducts,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: inventoryService.createProduct,
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Log product creation
      auditService.logProductCreate(newProduct.id, newProduct);
      toast({
        title: "Product created",
        description: "Product has been successfully added to inventory.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating product:', error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates, oldProduct, reason }: { id: string; updates: Partial<Product>; oldProduct?: Product; reason?: string }) => {
      const result = await inventoryService.updateProduct(id, updates);
      // Log product update
      if (oldProduct) {
        await auditService.logProductUpdate(id, oldProduct, result, reason);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product updated",
        description: "Product has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating product:', error);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, product }: { id: string; product?: Product }) => {
      const result = await inventoryService.deleteProduct(id);
      // Log product deletion
      if (product) {
        await auditService.logProductDelete(id, product);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product deleted",
        description: "Product has been successfully removed from inventory.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting product:', error);
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productId, newStock, reason }: { productId: string; newStock: number; reason?: string }) => {
      const result = await inventoryService.updateStock(productId, newStock, reason);
      // Log inventory movement
      await auditService.logInventoryMovement(productId, { newStock, reason });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast({
        title: "Stock updated",
        description: "Product stock has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating stock:', error);
    },
  });
};

export const useInventoryMovements = (productId?: string) => {
  return useQuery({
    queryKey: ['inventory-movements', productId],
    queryFn: () => inventoryService.getInventoryMovements(productId),
  });
};

export const useCreateInventoryMovement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: inventoryService.createInventoryMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Inventory movement recorded",
        description: "Inventory movement has been successfully recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record inventory movement. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating inventory movement:', error);
    },
  });
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: inventoryService.getSuppliers,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: inventoryService.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Supplier created",
        description: "Supplier has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create supplier. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating supplier:', error);
    },
  });
};

export const usePurchaseOrders = () => {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: inventoryService.getPurchaseOrders,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: inventoryService.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({
        title: "Purchase order created",
        description: "Purchase order has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create purchase order. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating purchase order:', error);
    },
  });
};

export const usePurchaseOrderItems = (purchaseOrderId: string) => {
  return useQuery({
    queryKey: ['purchase-order-items', purchaseOrderId],
    queryFn: () => inventoryService.getPurchaseOrderItems(purchaseOrderId),
    enabled: !!purchaseOrderId,
  });
};

export const useCreatePurchaseOrderItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: inventoryService.createPurchaseOrderItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order-items', data.purchase_order_id] });
      toast({
        title: "Purchase order item added",
        description: "Purchase order item has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add purchase order item. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating purchase order item:', error);
    },
  });
};

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: inventoryService.getLowStockProducts,
  });
};

export const useExpiringProducts = (days: number = 30) => {
  return useQuery({
    queryKey: ['expiring-products', days],
    queryFn: () => inventoryService.getExpiringProducts(days),
  });
};

export const useSalesAnalytics = (dateRange?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['sales-analytics', dateRange],
    queryFn: () => inventoryService.getSalesAnalytics(dateRange),
  });
};

export const useProductAnalytics = (productId?: string, dateRange?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['product-analytics', productId, dateRange],
    queryFn: () => inventoryService.getProductAnalytics(productId, dateRange),
    enabled: !!productId,
  });
};
