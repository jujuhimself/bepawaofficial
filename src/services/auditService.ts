import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  details?: any;
  category?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface AuditLog extends AuditLogEntry {}

class AuditService {
  private async createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'user_id' | 'created_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          ...entry,
          user_id: user.id
        });

      if (error) {
        console.error('Error creating audit log:', error);
      }
    } catch (error) {
      console.error('AuditService error:', error);
    }
  }

  async logAction(action: string, resourceType: string, resourceId?: string, details?: any) {
    await this.createAuditLog({
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      category: 'general'
    });
  }

  async logLogin() {
    await this.createAuditLog({
      action: 'LOGIN',
      resource_type: 'user',
      category: 'authentication',
      details: { message: 'User logged in' }
    });
  }

  async logLogout() {
    await this.createAuditLog({
      action: 'LOGOUT',
      resource_type: 'user',
      category: 'authentication',
      details: { message: 'User logged out' }
    });
  }

  async logSettingsUpdate(oldValues: any, newValues: any) {
    await this.createAuditLog({
      action: 'UPDATE',
      resource_type: 'settings',
      old_values: oldValues,
      new_values: newValues,
      category: 'settings',
      details: { message: 'User settings updated' }
    });
  }

  async logProductCreate(productId: string, productData: any) {
    await this.createAuditLog({
      action: 'CREATE',
      resource_type: 'product',
      resource_id: productId,
      new_values: productData,
      category: 'inventory',
      details: { message: `Product ${productData.name} created` }
    });
  }

  async logProductUpdate(productId: string, oldData: any, newData: any, reason?: string) {
    await this.createAuditLog({
      action: 'UPDATE',
      resource_type: 'product',
      resource_id: productId,
      old_values: oldData,
      new_values: newData,
      category: 'inventory',
      details: { message: `Product ${newData.name} updated`, reason },
    });
  }

  async logProductDelete(productId: string, productData: any) {
    await this.createAuditLog({
      action: 'DELETE',
      resource_type: 'product',
      resource_id: productId,
      old_values: productData,
      category: 'inventory',
      details: { message: `Product ${productData.name} deleted` }
    });
  }

  async logInventoryMovement(productId: string, movementData: any) {
    await this.createAuditLog({
      action: 'INVENTORY_MOVEMENT',
      resource_type: 'product',
      resource_id: productId,
      new_values: movementData,
      category: 'inventory',
      details: { message: `Inventory movement recorded for product ${productId}` }
    });
  }

  async logStockUpdate(productId: string, oldStock: number, newStock: number, reason?: string) {
    await this.createAuditLog({
      action: 'STOCK_UPDATE',
      resource_type: 'product',
      resource_id: productId,
      old_values: { stock: oldStock },
      new_values: { stock: newStock },
      category: 'inventory',
      details: { 
        message: `Stock updated from ${oldStock} to ${newStock}`,
        reason: reason || 'Manual adjustment'
      }
    });
  }

  async getUserActivity(userId?: string) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }

    return data || [];
  }

  async getAuditLogs(resourceType?: string, resourceId?: string) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }

    return data || [];
  }
}

export const auditService = new AuditService();
