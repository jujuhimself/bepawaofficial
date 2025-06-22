import { supabase } from '../integrations/supabase/client';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  user_id: string;
  created_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

class FinancialService {
  // Fetch transactions based on user role
  async fetchTransactions(userId: string, userRole: string): Promise<Transaction[]> {
    // For now, return mock data since we don't have a transactions table
    // In a real implementation, this would query the database based on user role
    
    const baseTransactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 2500000,
        category: 'Sales',
        description: 'Monthly sales revenue',
        date: new Date().toISOString().split('T')[0],
        user_id: userId,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'expense',
        amount: 800000,
        category: 'Inventory',
        description: 'Medicine purchase',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_id: userId,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'expense',
        amount: 150000,
        category: 'Utilities',
        description: 'Electricity bill',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_id: userId,
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        type: 'income',
        amount: 1200000,
        category: 'Services',
        description: 'Consultation fees',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_id: userId,
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        type: 'expense',
        amount: 300000,
        category: 'Staff',
        description: 'Salary payments',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user_id: userId,
        created_at: new Date().toISOString()
      }
    ];

    // Adjust amounts based on user role
    const multiplier = userRole === 'wholesale' ? 3 : userRole === 'retail' ? 1.5 : 1;
    
    return baseTransactions.map(t => ({
      ...t,
      amount: Math.round(t.amount * multiplier)
    }));
  }

  // Get financial summary
  async getFinancialSummary(userId: string, userRole: string): Promise<FinancialSummary> {
    const transactions = await this.fetchTransactions(userId, userRole);
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalIncome - totalExpenses;

    // Generate monthly data
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      
      if (existing) {
        if (transaction.type === 'income') {
          existing.income += transaction.amount;
        } else {
          existing.expenses += transaction.amount;
        }
      } else {
        acc.push({
          month,
          income: transaction.type === 'income' ? transaction.amount : 0,
          expenses: transaction.type === 'expense' ? transaction.amount : 0
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; income: number; expenses: number; }>);

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      monthlyData
    };
  }

  // Add a new transaction
  async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    // For now, just return the transaction with generated ID
    // In a real implementation, this would save to the database
    return {
      ...transaction,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
  }

  // Get expense categories
  async getExpenseCategories(): Promise<string[]> {
    return [
      'Inventory',
      'Utilities',
      'Staff',
      'Rent',
      'Marketing',
      'Insurance',
      'Maintenance',
      'Other'
    ];
  }

  // Get income categories
  async getIncomeCategories(): Promise<string[]> {
    return [
      'Sales',
      'Services',
      'Consultation',
      'Commission',
      'Investment',
      'Other'
    ];
  }

  // Get financial analytics
  async getFinancialAnalytics(userId: string, userRole: string): Promise<{
    topExpenseCategories: Array<{ category: string; amount: number }>;
    topIncomeSources: Array<{ category: string; amount: number }>;
    monthlyTrend: Array<{ month: string; profit: number }>;
  }> {
    const transactions = await this.fetchTransactions(userId, userRole);
    
    // Top expense categories
    const expenseCategories = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.category === t.category);
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category: t.category, amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Top income sources
    const incomeCategories = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.category === t.category);
        if (existing) {
          existing.amount += t.amount;
        } else {
          acc.push({ category: t.category, amount: t.amount });
        }
        return acc;
      }, [] as Array<{ category: string; amount: number }>)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Monthly trend
    const monthlyTrend = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      
      if (existing) {
        if (transaction.type === 'income') {
          existing.profit += transaction.amount;
        } else {
          existing.profit -= transaction.amount;
        }
      } else {
        acc.push({
          month,
          profit: transaction.type === 'income' ? transaction.amount : -transaction.amount
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; profit: number }>);

    return {
      topExpenseCategories: expenseCategories,
      topIncomeSources: incomeCategories,
      monthlyTrend
    };
  }
}

export const financialService = new FinancialService();