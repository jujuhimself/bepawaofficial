import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointmentService';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';

export const useUserAppointments = (userId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['appointments', userId, user?.role],
    queryFn: () => appointmentService.fetchAppointmentsByRole(userId, user?.role || 'individual'),
    enabled: !!userId && !!user?.role,
  });
};

export const useTodaysAppointments = (providerType?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['appointments', 'today', providerType, user?.role],
    queryFn: () => appointmentService.fetchTodaysAppointments(providerType),
    enabled: !!user?.role,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Appointment created",
        description: "Your appointment has been successfully scheduled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating appointment:', error);
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Appointment updated",
        description: "Appointment status has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating appointment:', error);
    },
  });
};