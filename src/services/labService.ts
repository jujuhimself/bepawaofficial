import { supabase } from '../integrations/supabase/client';

export interface LabTest {
  id: string;
  user_id: string;
  test_name: string;
  test_code: string;
  category: string;
  description?: string;
  sample_type: string;
  preparation_instructions?: string;
  normal_range?: string;
  price: number;
  turnaround_time_hours: number;
  is_active: boolean;
  lab_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LabOrder {
  id: string;
  user_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female' | 'other';
  doctor_name: string;
  doctor_phone?: string;
  order_date: string;
  sample_collection_date?: string;
  sample_collection_time?: string;
  total_amount: number;
  status: 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  lab_id?: string;
  payment_status: 'unpaid' | 'paid' | 'partial';
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface LabOrderItem {
  id: string;
  lab_order_id: string;
  lab_test_id: string;
  test_name: string;
  test_price: number;
  result?: string;
  result_date?: string;
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
}

export interface Lab {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  location: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating: number;
  distance?: string;
  is_open: boolean;
  hours?: string;
  tests: string[];
  categories: string[];
  facilities: string[];
  certifications: string[];
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabBooking {
  id: string;
  user_id: string;
  lab_id: string;
  appointment_id?: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female' | 'other';
  doctor_name?: string;
  doctor_phone?: string;
  doctor_email?: string;
  booking_date: string;
  booking_time: string;
  test_types: string[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'partial';
  special_instructions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FileUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type?: string;
  upload_type: 'lab_result' | 'prescription' | 'medical_record' | 'other';
  related_id?: string;
  related_table?: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface NewOrderPayload {
  patient_name: string;
  patient_phone?: string;
  doctor_name: string;
  test_ids: string[];
  total_amount: number;
}

class LabService {
  // Lab Tests
  async getLabTests(): Promise<LabTest[]> {
    try {
        const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('is_active', true)
        .order('test_name');

        if (error) {
        console.error('Error fetching lab tests:', error);
        return this.getMockLabTests();
        }

        return data || [];
    } catch (error) {
        console.error('Caught error fetching lab tests:', error);
        return this.getMockLabTests();
    }
  }

  async getLabTestsByLab(labId: string): Promise<LabTest[]> {
    const { data, error } = await supabase
      .from('lab_tests')
      .select('*')
      .eq('lab_id', labId)
      .eq('is_active', true)
      .order('test_name');

    if (error) {
      console.error('Error fetching lab tests by lab:', error);
      throw error;
    }

    return data || [];
  }

  async createLabTest(test: Omit<LabTest, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<LabTest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lab_tests')
      .insert({
        ...test,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lab test:', error);
      throw error;
    }

    return data;
  }

  // Labs
  async getLabs(): Promise<Lab[]> {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching labs:', error);
      throw error;
    }

    return (data || []).map(lab => ({
      ...lab,
      tests: lab.tests || [],
      categories: lab.categories || [],
      facilities: lab.facilities || [],
      certifications: lab.certifications || []
    }));
  }

  async getLabById(labId: string): Promise<Lab | null> {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('id', labId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching lab by id:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      tests: data.tests || [],
      categories: data.categories || [],
      facilities: data.facilities || [],
      certifications: data.certifications || []
    };
  }

  async createLab(lab: Omit<Lab, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Lab> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('labs')
      .insert({
        ...lab,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lab:', error);
      throw error;
    }

    return {
      ...data,
      tests: data.tests || [],
      categories: data.categories || [],
      facilities: data.facilities || [],
      certifications: data.certifications || []
    };
  }

  async createLabOrder(orderPayload: NewOrderPayload): Promise<LabOrder> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: orderData, error: orderError } = await supabase
      .from('lab_orders')
      .insert({
        user_id: user.id,
        patient_name: orderPayload.patient_name,
        patient_phone: orderPayload.patient_phone,
        doctor_name: orderPayload.doctor_name,
        total_amount: orderPayload.total_amount,
        status: 'pending',
        payment_status: 'unpaid',
        order_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating lab order:', orderError);
      throw orderError;
    }

    const tests = await this.getLabTests();
    const orderItems = orderPayload.test_ids.map(testId => {
        const test = tests.find(t => t.id === testId);
        return {
            lab_order_id: orderData.id,
            lab_test_id: testId,
            test_name: test?.test_name || 'Unknown Test',
            test_price: test?.price || 0,
            status: 'pending',
        }
    });

    const { error: itemsError } = await supabase
      .from('lab_order_items')
      .insert(orderItems);

    if (itemsError) {
        console.error('Error creating lab order items:', itemsError);
        // Optional: Delete the order if items fail to be created
        await supabase.from('lab_orders').delete().eq('id', orderData.id);
        throw itemsError;
    }

    return orderData;
  }

  // Lab Orders
  async getLabOrders(): Promise<LabOrder[]> {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lab orders:', error);
      throw error;
    }

    return (data || []).map(order => ({
      ...order,
      status: order.status as LabOrder['status'],
      payment_status: order.payment_status as LabOrder['payment_status'],
      patient_gender: order.patient_gender as LabOrder['patient_gender']
    }));
  }

  async getLabOrdersByLab(labId: string): Promise<LabOrder[]> {
    const { data, error } = await supabase
      .from('lab_orders')
      .select('*')
      .eq('lab_id', labId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lab orders by lab:', error);
      throw error;
    }

    return (data || []).map(order => ({
      ...order,
      status: order.status as LabOrder['status'],
      payment_status: order.payment_status as LabOrder['payment_status'],
      patient_gender: order.patient_gender as LabOrder['patient_gender']
    }));
  }

  async getLabOrderItems(labOrderId: string): Promise<LabOrderItem[]> {
    const { data, error } = await supabase
      .from('lab_order_items')
      .select('*')
      .eq('lab_order_id', labOrderId);

    if (error) {
      console.error('Error fetching lab order items:', error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      status: item.status as LabOrderItem['status']
    }));
  }

  async createLabOrderItem(item: Omit<LabOrderItem, 'id' | 'created_at'>): Promise<LabOrderItem> {
    const { data, error } = await supabase
      .from('lab_order_items')
      .insert({ ...item })
      .select()
      .single();

    if (error) {
      console.error('Error creating lab order item:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as LabOrderItem['status']
    };
  }

  async updateLabOrderStatus(id: string, status: LabOrder['status']): Promise<LabOrder> {
    const { data, error } = await supabase
      .from('lab_orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lab order status:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as LabOrder['status'],
      payment_status: data.payment_status as LabOrder['payment_status'],
      patient_gender: data.patient_gender as LabOrder['patient_gender']
    };
  }

  async updateLabOrderItemResult(id: string, result: string): Promise<LabOrderItem> {
    const { data, error } = await supabase
      .from('lab_order_items')
      .update({ result, status: 'completed', result_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lab order item result:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as LabOrderItem['status']
    };
  }

  // Lab Bookings
  async getLabBookings(): Promise<LabBooking[]> {
    const { data, error } = await supabase
      .from('lab_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lab bookings:', error);
      throw error;
    }

    return (data || []).map(booking => ({
      ...booking,
      status: booking.status as LabBooking['status'],
      payment_status: booking.payment_status as LabBooking['payment_status'],
      patient_gender: booking.patient_gender as LabBooking['patient_gender']
    }));
  }

  async getLabBookingsByLab(labId: string): Promise<LabBooking[]> {
    const { data, error } = await supabase
      .from('lab_bookings')
      .select('*')
      .eq('lab_id', labId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lab bookings by lab:', error);
      throw error;
    }

    return (data || []).map(booking => ({
      ...booking,
      status: booking.status as LabBooking['status'],
      payment_status: booking.payment_status as LabBooking['payment_status'],
      patient_gender: booking.patient_gender as LabBooking['patient_gender']
    }));
  }

  async createLabBooking(booking: Omit<LabBooking, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<LabBooking> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lab_bookings')
      .insert({
        ...booking,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lab booking:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as LabBooking['status'],
      payment_status: data.payment_status as LabBooking['payment_status'],
      patient_gender: data.patient_gender as LabBooking['patient_gender']
    };
  }

  async updateLabBookingStatus(id: string, status: LabBooking['status']): Promise<LabBooking> {
    const { data, error } = await supabase
      .from('lab_bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lab booking status:', error);
      throw error;
    }

    return {
      ...data,
      status: data.status as LabBooking['status'],
      payment_status: data.payment_status as LabBooking['payment_status'],
      patient_gender: data.patient_gender as LabBooking['patient_gender']
    };
  }

  private getMockLabTests(): LabTest[] {
    return [
        { id: '1', test_name: 'Complete Blood Count (CBC)', price: 15.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '', test_code: '', category: '', sample_type: '', is_active: true, turnaround_time_hours: 24 },
        { id: '2', test_name: 'Lipid Profile', price: 25.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '', test_code: '', category: '', sample_type: '', is_active: true, turnaround_time_hours: 24 },
        { id: '3', test_name: 'HbA1c', price: 20.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '', test_code: '', category: '', sample_type: '', is_active: true, turnaround_time_hours: 48 },
        { id: '4', test_name: 'Urinalysis', price: 10.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: '', test_code: '', category: '', sample_type: '', is_active: true, turnaround_time_hours: 12 },
    ];
  }

  async uploadFile(
    file: File, 
    uploadType: FileUpload['upload_type'], 
    relatedId?: string, 
    relatedTable?: string,
    description?: string
  ): Promise<FileUpload> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${uploadType}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('uploads')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    const { data, error } = await supabase
      .from('file_uploads')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: `uploads/${fileName}`,
        file_size: file.size,
        file_type: file.type,
        upload_type,
        related_id,
        related_table,
        description,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating file upload record:', error);
      throw error;
    }

    return data;
  }

  async getFileUploads(uploadType?: FileUpload['upload_type'], relatedId?: string): Promise<FileUpload[]> {
    let query = supabase
      .from('file_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (uploadType) {
      query = query.eq('upload_type', uploadType);
    }

    if (relatedId) {
      query = query.eq('related_id', relatedId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching file uploads:', error);
      throw error;
    }

    return data || [];
  }

  async deleteFileUpload(id: string): Promise<void> {
    const { data: file, error: fetchError } = await supabase
      .from('file_uploads')
      .select('file_name')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching file for deletion:', fetchError);
      throw fetchError;
    }

    if (file) {
      const { error: storageError } = await supabase
        .storage
        .from('uploads')
        .remove([file.file_name]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        throw storageError;
      }
    }

    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting file record from db:', dbError);
      throw dbError;
    }
  }

  async getLabDashboardStats(labId?: string) {
    // This is a placeholder for a more complex query, potentially a Supabase function
    const { count: totalOrders, error: orderError } = await supabase
        .from('lab_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

    const { count: pendingOrders, error: pendingError } = await supabase
        .from('lab_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'sample_collected', 'processing']);

    // Example for revenue - would need to be more sophisticated in reality
    const { data: completedOrders, error: revenueError } = await supabase
        .from('lab_orders')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid');
    
    const totalRevenue = completedOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    if (orderError || pendingError || revenueError) {
        console.error('Error fetching dashboard stats:', orderError || pendingError || revenueError);
    }

    return {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue,
        turnaroundTime: 24, // Placeholder
        topTests: [ // Placeholder
            { name: 'Complete Blood Count', count: 150 },
            { name: 'Lipid Profile', count: 120 },
            { name: 'HbA1c', count: 90 },
        ]
    };
  }
}

export const labService = new LabService();