import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import LabStatsCards from "@/components/lab/LabStatsCards";
import LabAppointmentsList from "@/components/lab/LabAppointmentsList";
import LabResultsList from "@/components/lab/LabResultsList";
import LabQuickActions from "@/components/lab/LabQuickActions";
import { useLabDashboard } from "@/hooks/useLabDashboard";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const LabDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useLabDashboard();

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      scheduled: 'bg-purple-100 text-purple-800',
      confirmed: 'bg-green-100 text-green-800',
      ready: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-lg">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <div className="text-red-600 text-lg mb-4">Error loading dashboard: {(error as Error)?.message || "An unknown error occurred."}</div>
            <Button onClick={() => refetch()}>
              Retry
            </Button>
          </div>
      </div>
    );
  }

  const stats = data?.stats || { todayAppointments: 0, pendingResults: 0, urgentTests: 0, completedToday: 0 };
  const appointments = data?.appointments || [];
  const testResults = data?.testResults || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Laboratory Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage your laboratory operations efficiently</p>
        </div>

        <LabStatsCards
          todayAppointmentsCount={stats.todayAppointments}
          pendingResultsCount={stats.pendingResults}
          urgentTestsCount={stats.urgentTests}
          completedTodayCount={stats.completedToday}
        />

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <LabAppointmentsList 
            appointments={appointments}
            getStatusColor={getStatusColor}
          />
          <LabResultsList 
            testResults={testResults}
            getStatusColor={getStatusColor}
          />
        </div>

        <LabQuickActions />
      </div>
    </div>
  );
};

export default LabDashboard;
