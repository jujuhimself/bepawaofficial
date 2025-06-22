import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService } from '../services/crmService';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';

export const useCustomers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customers', user?.id, user?.role],
    queryFn: () => crmService.fetchCustomers(user?.id || '', user?.role || ''),
    enabled: !!user?.id && !!user?.role,
  });
};

export const useCustomerCommunications = (customerId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['communications', customerId, user?.id],
    queryFn: () => crmService.fetchCommunications(customerId, user?.id || ''),
    enabled: !!customerId && !!user?.id,
  });
};

export const useCustomerCreditTransactions = (customerId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['credit-transactions', customerId, user?.id],
    queryFn: () => crmService.fetchCreditTransactions(customerId, user?.id || ''),
    enabled: !!customerId && !!user?.id,
  });
};

export const useAddCommunication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: crmService.addCommunication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast({
        title: "Communication logged",
        description: "Customer interaction has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log communication. Please try again.",
        variant: "destructive",
      });
      console.error('Error logging communication:', error);
    },
  });
};