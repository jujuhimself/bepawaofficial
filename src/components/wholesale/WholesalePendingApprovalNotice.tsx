import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Mail } from 'lucide-react';

const WholesalePendingApprovalNotice = () => {
  const { logout } = useAuth();

  return (
    <div className="container mx-auto py-12 flex items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-yellow-100 rounded-full p-3 w-fit">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="mt-4">Account Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Thank you for registering. Your wholesale account is currently under review by our team. 
            You will be notified via email once your account has been approved.
          </p>
          <p className="text-sm text-gray-500">
            This usually takes 1-2 business days.
          </p>
          <div className="flex justify-center space-x-4 pt-4">
            <Button variant="outline" onClick={logout}>
              Log Out
            </Button>
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WholesalePendingApprovalNotice;
