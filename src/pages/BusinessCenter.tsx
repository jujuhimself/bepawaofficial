import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  BarChart3,
  FileText,
  Calendar,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const BusinessCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessMetrics, setBusinessMetrics] = useState({
    monthlyRevenue: 0,
    activeCustomers: 0,
    ordersThisMonth: 0,
    growthRate: null // null means not shown
  });

  useEffect(() => {
    if (user) {
      fetchBusinessMetrics();
    }
  }, [user]);

  const fetchBusinessMetrics = async () => {
    try {
      // Fetch orders for current month
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, user_id')
        .eq('user_id', user?.id)
        .gte('created_at', firstDayOfMonth.toISOString());

      if (ordersError) throw ordersError;

      // Calculate metrics
      const monthlyRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;
      const ordersThisMonth = ordersData?.length || 0;
      const activeCustomers = new Set(ordersData?.map(o => o.user_id)).size;

      setBusinessMetrics({
        monthlyRevenue,
        activeCustomers,
        ordersThisMonth,
        growthRate: null // Not shown
      });
    } catch (error) {
      setBusinessMetrics({ monthlyRevenue: 0, activeCustomers: 0, ordersThisMonth: 0, growthRate: null });
      console.error('Error fetching business metrics:', error);
      toast({
        title: "Error loading metrics",
        description: "Could not load business metrics",
        variant: "destructive",
      });
    }
  };

  // Role-aware business tools
  let businessTools = [];
  if (user?.role === 'retail') {
    businessTools = [
      {
        title: "Analytics Dashboard",
        description: "Comprehensive business insights and reporting",
        icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
        action: "View Analytics",
        href: "/business-tools-retail/forecast"
      },
      {
        title: "Financial Reports",
        description: "Generate detailed financial statements",
        icon: <FileText className="h-8 w-8 text-green-600" />,
        action: "Generate Reports",
        href: "/retail/reporting"
      },
      {
        title: "Schedule Management",
        description: "Manage appointments and schedules",
        icon: <Calendar className="h-8 w-8 text-purple-600" />,
        action: "Manage Schedule",
        href: "/pharmacy/appointments"
      },
      {
        title: "Business Settings",
        description: "Configure business preferences",
        icon: <Settings className="h-8 w-8 text-gray-600" />,
        action: "Open Settings",
        href: "/settings"
      }
    ];
  } else if (user?.role === 'wholesale') {
    businessTools = [
      {
        title: "Analytics Dashboard",
        description: "Comprehensive business insights and reporting",
        icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
        action: "View Analytics",
        href: "/wholesale/analytics"
      },
      {
        title: "Financial Reports",
        description: "Generate detailed financial statements",
        icon: <FileText className="h-8 w-8 text-green-600" />,
        action: "Generate Reports",
        href: "/wholesale/business-tools"
      },
      {
        title: "Business Settings",
        description: "Configure business preferences",
        icon: <Settings className="h-8 w-8 text-gray-600" />,
        action: "Open Settings",
        href: "/settings"
      }
    ];
  } else if (user?.role === 'lab') {
    businessTools = [
      {
        title: "Analytics Dashboard",
        description: "Comprehensive business insights and reporting",
        icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
        action: "View Analytics",
        href: "/lab/analytics"
      },
      {
        title: "Schedule Management",
        description: "Manage appointments and schedules",
        icon: <Calendar className="h-8 w-8 text-purple-600" />,
        action: "Manage Schedule",
        href: "/lab/appointments"
      },
      {
        title: "Business Settings",
        description: "Configure business preferences",
        icon: <Settings className="h-8 w-8 text-gray-600" />,
        action: "Open Settings",
        href: "/settings"
      }
    ];
  } else if (user?.role === 'admin') {
    businessTools = [
      {
        title: "Analytics Dashboard",
        description: "Comprehensive business insights and reporting",
        icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
        action: "View Analytics",
        href: "/admin/analytics"
      },
      {
        title: "User Management",
        description: "Manage users and staff",
        icon: <Users className="h-8 w-8 text-green-600" />,
        action: "Manage Users",
        href: "/admin/users"
      },
      {
        title: "Business Settings",
        description: "Configure business preferences",
        icon: <Settings className="h-8 w-8 text-gray-600" />,
        action: "Open Settings",
        href: "/settings"
      }
    ];
  } else {
    // Individual or fallback
    businessTools = [
      {
        title: "Analytics Dashboard",
        description: "Comprehensive business insights and reporting",
        icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
        action: "View Analytics",
        href: "/individual"
      },
      {
        title: "Business Settings",
        description: "Configure business preferences",
        icon: <Settings className="h-8 w-8 text-gray-600" />,
        action: "Open Settings",
        href: "/settings"
      }
    ];
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Center</h1>
          <p className="text-gray-600 text-lg">Manage and grow your healthcare business</p>
        </div>

        {/* Business Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {businessMetrics.monthlyRevenue === 0 && businessMetrics.ordersThisMonth === 0 ? (
            <div className="text-gray-500">No data found for this month.</div>
          ) : (
            <>
              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+{businessMetrics.growthRate?.toFixed(1) || ''}%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(businessMetrics.monthlyRevenue)}
                  </h3>
                  <p className="text-gray-600 text-sm">Monthly Revenue</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium text-green-600">+8.2%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{businessMetrics.activeCustomers}</h3>
                  <p className="text-gray-600 text-sm">Active Customers</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-medium text-green-600">+15.3%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{businessMetrics.ordersThisMonth}</h3>
                  <p className="text-gray-600 text-sm">Orders This Month</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                    <span className="text-sm font-medium text-green-600">+5.1%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{businessMetrics.growthRate?.toFixed(1) || ''}%</h3>
                  <p className="text-gray-600 text-sm">Growth Rate</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Business Tools */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Business Management Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {businessTools.map((tool, index) => (
                <div key={index} className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                    <p className="text-gray-600 mb-4">{tool.description}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={tool.href}>
                        {tool.action}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                <a href="/wholesale-ordering">
                  Create New Order
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/business-tools-retail">
                  Export Data
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/appointments">
                  Schedule Appointment
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/settings">
                  Contact Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessCenter;
