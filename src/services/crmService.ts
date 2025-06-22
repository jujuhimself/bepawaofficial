import { supabase } from '../integrations/supabase/client';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  notes: string;
  status: 'active' | 'inactive';
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number;
  creditStatus: 'good' | 'warning' | 'overdue';
  user_id: string;
  created_at: string;
}

export interface Communication {
  id: string;
  customerId: string;
  type: 'call' | 'email' | 'sms' | 'meeting';
  subject: string;
  notes: string;
  date: string;
  user_id: string;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  customerId: string;
  type: 'purchase' | 'payment';
  amount: number;
  date: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  user_id: string;
  created_at: string;
}

class CrmService {
  // Fetch customers based on user role
  async fetchCustomers(userId: string, userRole: string): Promise<Customer[]> {
    switch (userRole) {
      case 'wholesale':
        // Wholesalers can see all their customers (retailers)
        const { data: wholesaleData, error: wholesaleError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            address,
            created_at
          `)
          .eq('role', 'retail')
          .eq('is_approved', true);

        if (wholesaleError) throw wholesaleError;

        // Transform to Customer format and add mock data for now
        return (wholesaleData || []).map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          totalOrders: Math.floor(Math.random() * 50) + 1,
          totalSpent: Math.floor(Math.random() * 20000000) + 1000000,
          lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Regular customer',
          status: 'active' as const,
          creditLimit: 10000000,
          currentBalance: Math.floor(Math.random() * 8000000) + 1000000,
          paymentTerms: 30,
          creditStatus: 'good' as const,
          user_id: userId,
          created_at: profile.created_at
        }));

      case 'retail':
        // Retailers can see individual customers
        const { data: retailData, error: retailError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            address,
            created_at
          `)
          .eq('role', 'individual');

        if (retailError) throw retailError;

        return (retailData || []).map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          totalOrders: Math.floor(Math.random() * 20) + 1,
          totalSpent: Math.floor(Math.random() * 500000) + 50000,
          lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Individual customer',
          status: 'active' as const,
          creditLimit: 500000,
          currentBalance: Math.floor(Math.random() * 300000) + 10000,
          paymentTerms: 0,
          creditStatus: 'good' as const,
          user_id: userId,
          created_at: profile.created_at
        }));

      case 'admin':
        // Admins can see all customers
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            address,
            role,
            created_at
          `)
          .in('role', ['retail', 'individual']);

        if (adminError) throw adminError;

        return (adminData || []).map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          totalOrders: Math.floor(Math.random() * 50) + 1,
          totalSpent: Math.floor(Math.random() * 20000000) + 1000000,
          lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: `${profile.role} customer`,
          status: 'active' as const,
          creditLimit: profile.role === 'retail' ? 10000000 : 500000,
          currentBalance: Math.floor(Math.random() * 8000000) + 1000000,
          paymentTerms: profile.role === 'retail' ? 30 : 0,
          creditStatus: 'good' as const,
          user_id: userId,
          created_at: profile.created_at
        }));

      default:
        return [];
    }
  }

  // Fetch communications for a customer
  async fetchCommunications(customerId: string, userId: string): Promise<Communication[]> {
    // For now, return mock data since we don't have a communications table
    return [
      {
        id: '1',
        customerId,
        type: 'call' as const,
        subject: 'Monthly order discussion',
        notes: 'Discussed upcoming bulk order for antibiotics',
        date: new Date().toISOString().split('T')[0],
        user_id: userId,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        customerId,
        type: 'email' as const,
        subject: 'New product catalog',
        notes: 'Sent updated catalog with new medicines',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_id: userId,
        created_at: new Date().toISOString()
      }
    ];
  }

  // Fetch credit transactions for a customer
  async fetchCreditTransactions(customerId: string, userId: string): Promise<CreditTransaction[]> {
    // For now, return mock data since we don't have a credit_transactions table
    return [
      {
        id: '1',
        customerId,
        type: 'purchase' as const,
        amount: 2500000,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending' as const,
        user_id: userId,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        customerId,
        type: 'payment' as const,
        amount: 1500000,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'paid' as const,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    ];
  }

  // Add a new communication
  async addCommunication(communication: Omit<Communication, 'id' | 'created_at'>): Promise<Communication> {
    // For now, just return the communication with generated ID
    // In a real implementation, this would save to the database
    return {
      ...communication,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
  }

  // Update customer notes
  async updateCustomerNotes(customerId: string, notes: string): Promise<void> {
    // For now, just log the update
    console.log(`Updated notes for customer ${customerId}: ${notes}`);
  }
}

export const crmService = new CrmService(); 