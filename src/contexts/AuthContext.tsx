import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { auditService } from '../services/auditService';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'individual' | 'retail' | 'wholesale' | 'lab';
  // Common fields
  phone?: string;
  address?: string;
  isApproved?: boolean;
  createdAt?: string;
  parent_id?: string;
  permissions?: string[];
  
  // Individual user fields
  dateOfBirth?: string;
  emergencyContact?: string;
  
  // Retail pharmacy fields
  pharmacyName?: string;
  licenseNumber?: string;
  pharmacistName?: string;
  
  // Wholesale pharmacy fields
  businessName?: string;
  businessLicense?: string;
  taxId?: string;
  
  // Lab fields
  labName?: string;
  labLicense?: string;
  specializations?: string[];
  operatingHours?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  getDashboardRoute: (user?: User | null) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get dashboard route based on user role
  const getDashboardRoute = (userData?: User | null): string => {
    const currentUser = userData || user;
    if (!currentUser) return '/';
    
    switch (currentUser.role) {
      case 'admin': return '/admin';
      case 'individual': return '/individual';
      case 'retail': return '/pharmacy';
      case 'wholesale': return '/wholesale';
      case 'lab': return '/lab';
      default: return '/';
    }
  };

  // Convert Supabase profile to our User type
  const convertProfileToUser = (profile: any, supabaseUser: SupabaseUser): User => {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      address: profile.address,
      isApproved: profile.is_approved,
      createdAt: profile.created_at,
      parent_id: profile.parent_id,
      permissions: profile.permissions,
      dateOfBirth: profile.date_of_birth,
      emergencyContact: profile.emergency_contact,
      pharmacyName: profile.pharmacy_name,
      licenseNumber: profile.license_number,
      pharmacistName: profile.pharmacist_name,
      businessName: profile.business_name,
      businessLicense: profile.business_license,
      taxId: profile.tax_id,
      labName: profile.lab_name,
      labLicense: profile.lab_license,
      specializations: profile.specializations,
      operatingHours: profile.operating_hours,
    };
  };

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile when authenticated
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            if (profile) {
              const userData = convertProfileToUser(profile, session.user);
              setUser(userData);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          if (profile) {
            const userData = convertProfileToUser(profile, session.user);
            setUser(userData);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; redirectTo?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        import("../hooks/use-toast").then(({ toast }) => {
          toast({
            title: "Login error",
            description: error.message,
            variant: "destructive",
          });
        });
        return { success: false, error: error.message };
      }
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          // Check if user is approved (except for individuals and admins)
          if (!profile.is_approved && profile.role !== "individual" && profile.role !== "admin") {
            await supabase.auth.signOut();
            setIsLoading(false);
            import("../hooks/use-toast").then(({ toast }) => {
              toast({
                title: "Pending Approval",
                description: "Your account is pending approval. Please contact the administrator.",
                variant: "destructive",
              });
            });
            return { success: false, error: "Your account is pending approval. Please contact the administrator." };
          }
          const userData = convertProfileToUser(profile, data.user);
          setUser(userData);
          setSession(data.session);

          // Log successful login
          auditService.logLogin();

          // Toast on successful login
          import("../hooks/use-toast").then(({ toast }) => {
            toast({
              title: "Login successful",
              description: `Welcome back, ${userData.name || userData.email}!`,
              variant: "default",
            });
          });

          // Begin: Robust redirect logic ...
          const redirectTo = getDashboardRoute(userData);
          setTimeout(() => {
            if (window?.location?.pathname !== redirectTo) {
              window.location.replace(redirectTo);
            }
          }, 100);
          setIsLoading(false);
          return { success: true, redirectTo };
        }
      }
      setIsLoading(false);
      return { success: true, redirectTo: "/" };
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      import("../hooks/use-toast").then(({ toast }) => {
        toast({
          title: "Login error",
          description: "An error occurred during login. Please try again.",
          variant: "destructive",
        });
      });
      return { success: false, error: "An error occurred during login. Please try again." };
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Prepare metadata for the trigger
      const userMetadata = {
        name: userData.name,
        role: userData.role || 'individual',
        phone: userData.phone,
        address: userData.address,
        dateOfBirth: userData.dateOfBirth,
        emergencyContact: userData.emergencyContact,
        pharmacyName: userData.pharmacyName,
        licenseNumber: userData.licenseNumber,
        pharmacistName: userData.pharmacistName,
        businessName: userData.businessName,
        businessLicense: userData.businessLicense,
        taxId: userData.taxId,
        labName: userData.labName,
        labLicense: userData.labLicense,
        specializations: userData.specializations?.join(','),
        operatingHours: userData.operatingHours,
      };

      // Use the actual site URL for the redirect
      const redirectUrl = `${window.location.origin}/auth-callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email!,
        password: userData.password,
        options: {
          data: userMetadata,
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return { success: false, error: 'An error occurred during registration. Please try again.' };
    }
  };

  const logout = async () => {
    // Log logout before signing out
    await auditService.logLogout();
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Toast on logout
    import("../hooks/use-toast").then(({ toast }) => {
      toast({
        title: "Logged out",
        description: "You have been logged out.",
        variant: "default",
      });
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, register, isLoading, getDashboardRoute }}>
      {children}
    </AuthContext.Provider>
  );
};
