import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { auditService } from '../../services/auditService';

interface Retailer {
  id: string;
  name: string;
  business_name: string;
  email: string;
  phone?: string;
}

interface CreditAccount {
  id: string;
  retailer_id: string;
  wholesaler_id: string;
  credit_limit: number;
  current_balance: number;
  status: 'active' | 'suspended' | 'closed';
  created_at: string;
  retailer?: Retailer;
}

interface CreditTransaction {
  id: string;
  credit_account_id: string;
  type: 'loan' | 'repayment' | 'adjustment';
  amount: number;
  description: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'overdue';
  created_at: string;
}

const WholesaleCrm = () => {
  const { user } = useAuth();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch retailers who have ordered from this wholesaler
      const { data: retailerData, error: retailerError } = await supabase
        .from('profiles')
        .select('id, name, business_name, email, phone')
        .eq('role', 'retail')
        .order('business_name');

      if (retailerError) throw retailerError;
      setRetailers(retailerData || []);

      // Fetch credit accounts
      const { data: accountData, error: accountError } = await supabase
        .from('credit_accounts')
        .select(`
          *,
          retailer:profiles!credit_accounts_retailer_id_fkey(id, name, business_name, email, phone)
        `)
        .eq('wholesaler_id', user?.id)
        .order('created_at', { ascending: false });

      if (accountError) throw accountError;
      setCreditAccounts(accountData || []);

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('credit_transactions')
        .select('*')
        .in('credit_account_id', accountData?.map(acc => acc.id) || [])
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);

    } catch (error) {
      console.error('Error fetching CRM data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load CRM information",
        variant: "destructive"
      });
    }
  };

  const createCreditAccount = async () => {
    if (!selectedRetailer || !loanAmount) {
      toast({
        title: "Missing information",
        description: "Please select retailer and enter loan amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if credit account already exists
      const existingAccount = creditAccounts.find(acc => acc.retailer_id === selectedRetailer);
      
      if (existingAccount) {
        toast({
          title: "Account exists",
          description: "Credit account already exists for this retailer",
          variant: "destructive"
        });
        return;
      }

      // Create credit account
      const { data: accountData, error: accountError } = await supabase
        .from('credit_accounts')
        .insert({
          retailer_id: selectedRetailer,
          wholesaler_id: user?.id,
          credit_limit: parseFloat(loanAmount),
          current_balance: parseFloat(loanAmount),
          status: 'active'
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Create initial loan transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          credit_account_id: accountData.id,
          type: 'loan',
          amount: parseFloat(loanAmount),
          description: description || 'Initial credit line',
          due_date: dueDate || null,
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      // Log audit
      await auditService.logAction(
        'CREATE_CREDIT_ACCOUNT',
        'credit_account',
        accountData.id,
        {
          retailer_id: selectedRetailer,
          credit_limit: parseFloat(loanAmount),
          description
        }
      );

      toast({
        title: "Credit account created",
        description: `Credit line of TZS ${parseFloat(loanAmount).toLocaleString()} established`,
      });

      // Reset form and refresh data
      setSelectedRetailer('');
      setLoanAmount('');
      setDueDate('');
      setDescription('');
      fetchData();

    } catch (error) {
      console.error('Error creating credit account:', error);
      toast({
        title: "Error creating account",
        description: "Failed to create credit account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordRepayment = async (accountId: string) => {
    if (!repaymentAmount) {
      toast({
        title: "Missing amount",
        description: "Please enter repayment amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const amount = parseFloat(repaymentAmount);
      const account = creditAccounts.find(acc => acc.id === accountId);
      
      if (!account) throw new Error('Account not found');

      // Create repayment transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          credit_account_id: accountId,
          type: 'repayment',
          amount: amount,
          description: 'Repayment received',
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      // Update account balance
      const newBalance = account.current_balance - amount;
      const { error: updateError } = await supabase
        .from('credit_accounts')
        .update({ current_balance: newBalance })
        .eq('id', accountId);

      if (updateError) throw updateError;

      // Log audit
      await auditService.logAction(
        'RECORD_REPAYMENT',
        'credit_account',
        accountId,
        {
          amount,
          new_balance: newBalance,
          retailer_id: account.retailer_id
        }
      );

      toast({
        title: "Repayment recorded",
        description: `TZS ${amount.toLocaleString()} repayment recorded`,
      });

      setRepaymentAmount('');
      fetchData();

    } catch (error) {
      console.error('Error recording repayment:', error);
      toast({
        title: "Error recording repayment",
        description: "Failed to record repayment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getOverdueTransactions = () => {
    const today = new Date();
    return transactions.filter(t => 
      t.due_date && 
      new Date(t.due_date) < today && 
      t.status === 'pending'
    );
  };

  const getTotalCreditExtended = () => {
    return creditAccounts.reduce((sum, acc) => sum + acc.credit_limit, 0);
  };

  const getTotalOutstanding = () => {
    return creditAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  };

  const getActiveAccounts = () => {
    return creditAccounts.filter(acc => acc.status === 'active').length;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Credit Extended</p>
                <p className="text-xl font-bold">TZS {getTotalCreditExtended().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-xl font-bold">TZS {getTotalOutstanding().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Accounts</p>
                <p className="text-xl font-bold">{getActiveAccounts()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-xl font-bold">{getOverdueTransactions().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Credit Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Credit Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Retailer</label>
              <select
                value={selectedRetailer}
                onChange={(e) => setSelectedRetailer(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                <option value="">Select retailer</option>
                {retailers.map((retailer) => (
                  <option key={retailer.id} value={retailer.id}>
                    {retailer.business_name || retailer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Credit Limit (TZS)</label>
              <Input
                type="number"
                placeholder="Amount"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Due Date (Optional)</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Purpose of credit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={createCreditAccount}
            disabled={loading || !selectedRetailer || !loanAmount}
            className="mt-4"
          >
            {loading ? 'Creating...' : 'Create Credit Account'}
          </Button>
        </CardContent>
      </Card>

      {/* Credit Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Credit Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creditAccounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {account.retailer?.business_name || account.retailer?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Credit Limit: TZS {account.credit_limit.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Balance: TZS {account.current_balance.toLocaleString()}
                    </p>
                    <p className={`text-sm ${account.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {account.status}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div>
                      <Input
                        type="number"
                        placeholder="Repayment amount"
                        value={repaymentAmount}
                        onChange={(e) => setRepaymentAmount(e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => recordRepayment(account.id)}
                      disabled={loading || !repaymentAmount}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Record Repayment
                    </Button>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Recent Transactions</h4>
                  <div className="space-y-2">
                    {transactions
                      .filter(t => t.credit_account_id === account.id)
                      .slice(0, 3)
                      .map((transaction) => (
                        <div key={transaction.id} className="flex justify-between text-sm">
                          <span>{transaction.description}</span>
                          <span className={`font-medium ${
                            transaction.type === 'loan' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.type === 'loan' ? '-' : '+'}TZS {transaction.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alerts */}
      {getOverdueTransactions().length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getOverdueTransactions().map((transaction) => {
                const account = creditAccounts.find(acc => acc.id === transaction.credit_account_id);
                return (
                  <div key={transaction.id} className="flex justify-between items-center p-2 bg-red-100 rounded">
                    <div>
                      <p className="font-medium">
                        {account?.retailer?.business_name || account?.retailer?.name}
                      </p>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-700">
                        TZS {transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-red-600">
                        Due: {new Date(transaction.due_date!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WholesaleCrm; 