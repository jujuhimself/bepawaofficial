import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { creditService, CreditLimit, CreditTransaction } from "@/services/creditService";
import { format } from "date-fns";

interface CreditAccountManagerProps {
  businessId: string;
}

export function CreditAccountManager({ businessId }: CreditAccountManagerProps) {
  const [creditLimit, setCreditLimit] = useState<CreditLimit | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCreditInfo();
  }, [businessId]);

  const loadCreditInfo = async () => {
    try {
      setLoading(true);
      const [limitData, transactionsData] = await Promise.all([
        creditService.getCreditLimit(businessId),
        creditService.getTransactions(businessId),
      ]);
      setCreditLimit(limitData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading credit information:', error);
      toast({
        title: 'Error',
        description: 'Failed to load credit information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetCreditLimit = async () => {
    const amount = window.prompt('Enter new credit limit:');
    if (amount === null) return;

    try {
      const newLimit = parseFloat(amount);
      if (isNaN(newLimit) || newLimit < 0) {
        throw new Error('Invalid amount');
      }

      await creditService.setCreditLimit(businessId, newLimit);
      toast({
        title: 'Success',
        description: 'Credit limit updated successfully.',
      });
      loadCreditInfo();
    } catch (error) {
      console.error('Error setting credit limit:', error);
      toast({
        title: 'Error',
        description: 'Failed to set credit limit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      await creditService.recordPayment(
        creditLimit!.id,
        amount,
        undefined,
        paymentNotes || 'Manual payment'
      );
      toast({
        title: 'Success',
        description: 'Payment recorded successfully.',
      });
      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentNotes('');
      loadCreditInfo();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (status: 'active' | 'suspended' | 'cancelled') => {
    try {
      await creditService.updateCreditStatus(creditLimit!.id, status);
      toast({
        title: 'Success',
        description: 'Credit status updated successfully.',
      });
      loadCreditInfo();
    } catch (error) {
      console.error('Error updating credit status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update credit status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credit Account</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleSetCreditLimit}>Set Credit Limit</Button>
              <Button onClick={() => setShowPaymentDialog(true)}>Record Payment</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading credit information...</div>
          ) : creditLimit ? (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-gray-500">Credit Limit</div>
                  <div className="text-2xl font-semibold">
                    TZS {creditLimit.credit_limit.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-gray-500">Current Balance</div>
                  <div className="text-2xl font-semibold">
                    TZS {creditLimit.current_balance.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-gray-500">Available Credit</div>
                  <div className="text-2xl font-semibold">
                    TZS {(creditLimit.credit_limit - creditLimit.current_balance).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(creditLimit.status)}>
                      {creditLimit.status}
                    </Badge>
                    <select
                      className="ml-2 text-sm border rounded px-2 py-1"
                      value={creditLimit.status}
                      onChange={(e) => handleStatusUpdate(e.target.value as any)}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Previous Balance</TableHead>
                      <TableHead className="text-right">New Balance</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              transaction.transaction_type === 'payment'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          TZS {Math.abs(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          TZS {transaction.previous_balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          TZS {transaction.new_balance.toLocaleString()}
                        </TableCell>
                        <TableCell>{transaction.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No credit account found</p>
              <Button onClick={handleSetCreditLimit}>Set Up Credit Account</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional payment notes"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 