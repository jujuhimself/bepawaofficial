import { supabase } from '../integrations/supabase/client';

export interface Appointment {
  id: string;
  user_id: string;
  provider_id?: string | null;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  provider_type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

class AppointmentService {
  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async fetchUserAppointments(userId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(apt => ({
      ...apt,
      status: apt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
    }));
  }

  async fetchProviderAppointments(providerId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('provider_id', providerId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(apt => ({
      ...apt,
      status: apt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
    }));
  }

  async updateAppointmentStatus(appointmentId: string, status: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async fetchTodaysAppointments(providerType?: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', today);

    if (providerType) {
      query = query.eq('provider_type', providerType);
    }

    const { data, error } = await query.order('appointment_time', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(apt => ({
      ...apt,
      status: apt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
    }));
  }

  // Role-based appointment fetching
  async fetchAppointmentsByRole(userId: string, userRole: string): Promise<Appointment[]> {
    switch (userRole) {
      case 'individual':
        // Individuals can only see their own appointments
        return this.fetchUserAppointments(userId);
      
      case 'pharmacy':
      case 'lab':
        // Providers can see appointments where they are the provider
        return this.fetchProviderAppointments(userId);
      
      case 'admin':
        // Admins can see all appointments
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: true });

        if (error) throw error;
        return (data || []).map(apt => ({
          ...apt,
          status: apt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
        }));
      
      default:
        return [];
    }
  }
}

export const appointmentService = new AppointmentService();