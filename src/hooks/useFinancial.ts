import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService } from '../services/financialService';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';

export const useTransactions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['transactions', user?.id, user?.role],
    queryFn: () => financialService.fetchTransactions(user?.id || '', user?.role || ''),
    enabled: !!user?.id && !!user?.role,
  });
};

export const useFinancialSummary = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['financial-summary', user?.id, user?.role],
    queryFn: () => financialService.getFinancialSummary(user?.id || '', user?.role || ''),
    enabled: !!user?.id && !!user?.role,
  });
};

export const useFinancialAnalytics = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['financial-analytics', user?.id, user?.role],
    queryFn: () => financialService.getFinancialAnalytics(user?.id || '', user?.role || ''),
    enabled: !!user?.id && !!user?.role,
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: financialService.addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-analytics'] });
      toast({
        title: "Transaction added",
        description: "Transaction has been successfully recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding transaction:', error);
    },
  });
};

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => financialService.getExpenseCategories(),
  });
};

export const useIncomeCategories = () => {
  return useQuery({
    queryKey: ['income-categories'],
    queryFn: () => financialService.getIncomeCategories(),
  });
};