-- Staff management for retailers and wholesalers

CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL, -- references either a retailer or wholesaler business
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'worker')),
  permissions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_email TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.staff_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: Only allow staff to view their own record, or business owners/managers to view/manage staff for their business
CREATE POLICY "Staff can view their own record" ON public.staff
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Business owners/managers can view/manage staff for their business" ON public.staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.staff AS s2
      WHERE s2.user_id = auth.uid()
        AND s2.business_id = staff.business_id
        AND s2.role IN ('owner', 'manager')
        AND s2.status = 'active'
    )
  );

-- RLS: Only allow staff to view their own audit log, or business owners/managers to view logs for their business
CREATE POLICY "Staff can view their own audit log" ON public.staff_audit_log
  FOR SELECT USING (
    staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
  );

CREATE POLICY "Business owners/managers can view audit logs for their business" ON public.staff_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff AS s2
      WHERE s2.user_id = auth.uid()
        AND s2.role IN ('owner', 'manager')
        AND s2.status = 'active'
        AND s2.business_id = (SELECT business_id FROM public.staff WHERE public.staff.id = staff_audit_log.staff_id)
    )
  );

-- Indexes for performance
CREATE INDEX idx_staff_business_id ON public.staff(business_id);
CREATE INDEX idx_staff_user_id ON public.staff(user_id);
CREATE INDEX idx_staff_audit_log_staff_id ON public.staff_audit_log(staff_id); 