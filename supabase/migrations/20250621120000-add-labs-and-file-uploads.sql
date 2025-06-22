-- Create labs table for lab directory and visibility
CREATE TABLE public.labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  distance TEXT,
  is_open BOOLEAN DEFAULT true,
  hours TEXT,
  tests JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  facilities JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file_uploads table for test result files
CREATE TABLE public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('lab_result', 'prescription', 'medical_record', 'other')),
  related_id UUID, -- ID of related record (lab_order_item_id, prescription_id, etc.)
  related_table TEXT, -- Table name of related record
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab_bookings table for appointment-based bookings
CREATE TABLE public.lab_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lab_id UUID REFERENCES public.labs(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  patient_age INTEGER,
  patient_gender TEXT CHECK (patient_gender IN ('male', 'female', 'other')),
  doctor_name TEXT,
  doctor_phone TEXT,
  doctor_email TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  test_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'sample_collected', 'processing', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
  special_instructions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_labs_user_id ON public.labs(user_id);
CREATE INDEX idx_labs_location ON public.labs(location);
CREATE INDEX idx_labs_active ON public.labs(is_active);
CREATE INDEX idx_labs_verified ON public.labs(is_verified);
CREATE INDEX idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX idx_file_uploads_type ON public.file_uploads(upload_type);
CREATE INDEX idx_file_uploads_related ON public.file_uploads(related_id, related_table);
CREATE INDEX idx_lab_bookings_user_id ON public.lab_bookings(user_id);
CREATE INDEX idx_lab_bookings_lab_id ON public.lab_bookings(lab_id);
CREATE INDEX idx_lab_bookings_date ON public.lab_bookings(booking_date);
CREATE INDEX idx_lab_bookings_status ON public.lab_bookings(status);

-- Enable Row Level Security
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for labs
CREATE POLICY "Anyone can view active labs" ON public.labs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Lab owners can manage their labs" ON public.labs
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for file_uploads
CREATE POLICY "Users can view their own file uploads" ON public.file_uploads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own file uploads" ON public.file_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own file uploads" ON public.file_uploads
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own file uploads" ON public.file_uploads
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for lab_bookings
CREATE POLICY "Users can view their own lab bookings" ON public.lab_bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own lab bookings" ON public.lab_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lab bookings" ON public.lab_bookings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Labs can view bookings for their lab" ON public.lab_bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.labs WHERE labs.id = lab_bookings.lab_id AND labs.user_id = auth.uid())
  );

CREATE POLICY "Labs can update bookings for their lab" ON public.lab_bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.labs WHERE labs.id = lab_bookings.lab_id AND labs.user_id = auth.uid())
  );

-- Insert sample lab data
INSERT INTO public.labs (user_id, name, description, location, address, phone, email, rating, distance, hours, tests, categories, facilities, certifications, is_verified) VALUES
(
  (SELECT id FROM auth.users WHERE role = 'lab' LIMIT 1),
  'QuickLab Diagnostics',
  'Modern diagnostic laboratory offering comprehensive testing services with quick turnaround times.',
  'Dar es Salaam',
  '123 Medical Center Drive, Dar es Salaam',
  '+255 22 123 4567',
  'info@quicklab.co.tz',
  4.5,
  '0.8km',
  'Mon-Fri: 7AM-8PM, Sat: 8AM-6PM, Sun: 9AM-4PM',
  '["Blood Test", "Urine Analysis", "Diabetes Screening", "Cholesterol Test", "Liver Function Test", "Kidney Function Test", "Thyroid Test", "HIV Test", "Malaria Test", "Pregnancy Test"]',
  '["General Health", "Diabetes", "Cardiovascular", "Infectious Diseases", "Pregnancy"]',
  '["Modern Equipment", "Certified Technicians", "Quick Results", "Home Collection", "Online Reports"]',
  '["ISO 15189", "CAP Accredited", "Ministry of Health Approved"]',
  true
),
(
  (SELECT id FROM auth.users WHERE role = 'lab' LIMIT 1),
  'MediTest Center',
  'Specialized laboratory focusing on advanced diagnostic testing and research.',
  'Nairobi',
  '456 Healthcare Avenue, Nairobi',
  '+254 20 987 6543',
  'contact@meditest.co.ke',
  4.8,
  '1.5km',
  'Mon-Sat: 6AM-10PM, Sun: 8AM-6PM',
  '["Complete Blood Count", "Comprehensive Metabolic Panel", "Lipid Panel", "Hormone Tests", "Allergy Testing", "Genetic Testing", "Cancer Markers", "STD Testing", "Drug Testing", "Toxicology"]',
  '["Specialized Testing", "Research", "Genetic Analysis", "Oncology", "Allergy"]',
  '["Advanced Equipment", "Research Lab", "Specialized Staff", "Consultation Services", "Express Testing"]',
  '["ISO 15189", "CLIA Certified", "Research Accredited"]',
  true
);

-- Update lab_orders table to reference labs table
ALTER TABLE public.lab_orders 
ADD CONSTRAINT fk_lab_orders_lab_id 
FOREIGN KEY (lab_id) REFERENCES public.labs(id) ON DELETE SET NULL;

-- Update lab_tests table to reference labs table
ALTER TABLE public.lab_tests 
ADD CONSTRAINT fk_lab_tests_lab_id 
FOREIGN KEY (lab_id) REFERENCES public.labs(id) ON DELETE SET NULL; 