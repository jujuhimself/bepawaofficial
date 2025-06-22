import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { logError } from '../utils/logger';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireApproval?: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  allowedRoles = [], 
  requireApproval = false 
}) => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!isLoading) {
        if (!user) {
          navigate('/login');
          return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          setError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (requireApproval && !user.isApproved && user.role !== 'individual' && user.role !== 'admin') {
          // The downstream component is now responsible for handling the pending approval state.
          // This allows the main layout to render, preventing a jarring full-page lock.
          return;
        }

        setError(null);
      }
    } catch (err: any) {
      logError(err, 'RouteGuard authorization error');
      setError('An error occurred while checking permissions');
    }
  }, [user, isLoading, navigate, allowedRoles, requireApproval]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="space-x-2">
              <Button onClick={() => navigate('/login')} variant="outline">
                Back to Login
              </Button>
              <Button onClick={() => navigate('/')} variant="default">
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  // The approval pending message is now handled by the specific dashboard components
  // (e.g., WholesaleDashboard) so we can remove the generic full-page lock here.
  // This provides a better user experience as they can see the app shell.
  /*
  if (requireApproval && !user.isApproved && user.role !== 'individual' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-yellow-500" />
              Approval Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your account is pending admin approval. You'll receive a notification once approved.
            </p>
            <Button onClick={logout} variant="outline">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  */

  return <>{children}</>;
};

export default RouteGuard;
