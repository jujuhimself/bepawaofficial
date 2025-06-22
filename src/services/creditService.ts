import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

export interface WholesaleCreditAccount {
  id: string;
  wholesaler_user_id: string;
  retailer_id: string;
  credit_limit: number;
  current_balance: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface WholesaleCreditTransaction {
  id: string;
  credit_account_id: string;
  transaction_type: 'credit' | 'debit' | 'payment';
  amount: number;
  reference?: string;
  transaction_date: string;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  credit_limit_id: string;
  transaction_type: 'purchase' | 'payment' | 'adjustment' | 'fee';
  amount: number;
  previous_balance: number;
  new_balance: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface CustomerCredit {
  credit_limit: number;
  current_balance: number;
  payment_terms: number;
  credit_status: 'good' | 'warning' | 'overdue';
}

export interface CreditLimit {
  id: string;
  business_id: string;
  credit_limit: number;
  current_balance: number;
  last_review_date?: string;
  next_review_date?: string;
  status: 'active' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
}

class CreditService {
  async createAccount(account: Omit<WholesaleCreditAccount, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    const { data, error } = await supabase
      .from('wholesale_credit_accounts')
      .insert({
        ...account,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async fetchAccounts(): Promise<WholesaleCreditAccount[]> {
    const { data, error } = await supabase
      .from('wholesale_credit_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Cast the data to match our interface types
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'active' | 'inactive' | 'suspended'
    }));
  }

  async updateAccountBalance(accountId: string, newBalance: number) {
    const { data, error } = await supabase
      .from('wholesale_credit_accounts')
      .update({ current_balance: newBalance })
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createTransaction(transaction: Omit<WholesaleCreditTransaction, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('wholesale_credit_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCustomerCredit(customerId: string): Promise<CustomerCredit | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('credit_limit, current_balance, payment_terms, credit_status')
      .eq('id', customerId)
      .single();

    if (error) throw error;
    return data;
  }

  async getTransactions(customerId: string): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addTransaction(transaction: Omit<CreditTransaction, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCreditLimit(customerId: string, creditLimit: number) {
    const { data, error } = await supabase
      .from('customers')
      .update({ credit_limit: creditLimit })
      .eq('id', customerId)
      .select('credit_limit, current_balance, payment_terms, credit_status')
      .single();

    if (error) throw error;
    return data;
  }

  async updatePaymentTerms(customerId: string, paymentTerms: number) {
    const { data, error } = await supabase
      .from('customers')
      .update({ payment_terms: paymentTerms })
      .eq('id', customerId)
      .select('credit_limit, current_balance, payment_terms, credit_status')
      .single();

    if (error) throw error;
    return data;
  }

  async getOverdueTransactions(): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('status', 'overdue')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCustomersNearLimit(threshold: number = 0.8): Promise<any[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .gte('current_balance', `credit_limit * ${threshold}`);

    if (error) throw error;
    return data || [];
  }

  async getCreditLimit(businessId: string) {
    try {
      const { data, error } = await supabase
        .from('credit_limits')
        .select('*')
        .eq('business_id', businessId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching credit limit:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch credit limit. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  async setCreditLimit(businessId: string, limit: number) {
    try {
      const { data, error } = await supabase
        .from('credit_limits')
        .upsert({
          business_id: businessId,
          credit_limit: limit,
          current_balance: 0,
          status: 'active',
          last_review_date: new Date().toISOString(),
          next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting credit limit:', error);
      toast({
        title: 'Error',
        description: 'Failed to set credit limit. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  async updateCreditStatus(creditLimitId: string, status: 'active' | 'suspended' | 'cancelled') {
    try {
      const { data, error } = await supabase
        .from('credit_limits')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', creditLimitId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating credit status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update credit status. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  async recordPurchase(creditLimitId: string, amount: number, referenceId: string) {
    try {
      const { data: creditLimit, error: fetchError } = await supabase
        .from('credit_limits')
        .select('current_balance, credit_limit, status')
        .eq('id', creditLimitId)
        .single();

      if (fetchError) throw fetchError;

      if (creditLimit.status !== 'active') {
        throw new Error('Credit account is not active');
      }

      const newBalance = creditLimit.current_balance + amount;
      if (newBalance > creditLimit.credit_limit) {
        throw new Error('Purchase would exceed credit limit');
      }

      const { data, error: updateError } = await supabase
        .from('credit_limits')
        .update({
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', creditLimitId)
        .select()
        .single();

      if (updateError) throw updateError;

      await this.createCreditTransaction({
        credit_limit_id: creditLimitId,
        transaction_type: 'purchase',
        amount,
        previous_balance: creditLimit.current_balance,
        new_balance: newBalance,
        reference_id: referenceId,
        reference_type: 'order',
        notes: 'Purchase on credit'
      });

      return data;
    } catch (error) {
      console.error('Error recording purchase:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record purchase. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  async recordPayment(creditLimitId: string, amount: number, referenceId?: string, notes?: string) {
    try {
      const { data: creditLimit, error: fetchError } = await supabase
        .from('credit_limits')
        .select('current_balance')
        .eq('id', creditLimitId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = creditLimit.current_balance - amount;
      if (newBalance < 0) {
        throw new Error('Payment amount exceeds current balance');
      }

      const { data, error: updateError } = await supabase
        .from('credit_limits')
        .update({
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', creditLimitId)
        .select()
        .single();

      if (updateError) throw updateError;

      await this.createCreditTransaction({
        credit_limit_id: creditLimitId,
        transaction_type: 'payment',
        amount: -amount, // Negative amount for payments
        previous_balance: creditLimit.current_balance,
        new_balance: newBalance,
        reference_id: referenceId,
        reference_type: 'payment',
        notes
      });

      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  private async createCreditTransaction(transaction: Omit<CreditTransaction, 'id' | 'created_by' | 'created_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          ...transaction,
          created_by: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating credit transaction:', error);
      throw error;
    }
  }

  async getCreditTransactions(
    creditLimitId: string,
    filters?: {
      type?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    try {
      let query = supabase
        .from('credit_transactions')
        .select('*')
        .eq('credit_limit_id', creditLimitId);

      if (filters?.type) {
        query = query.eq('transaction_type', filters.type);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch credit transactions. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }

  async getOverdueAccounts(businessId: string) {
    try {
      const { data, error } = await supabase
        .from('credit_limits')
        .select('*')
        .eq('business_id', businessId)
        .gt('current_balance', 0)
        .lt('next_review_date', new Date().toISOString());

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching overdue accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch overdue accounts. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }
}

export const creditService = new CreditService();
