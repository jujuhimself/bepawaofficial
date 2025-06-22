import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Microscope, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const LabQuickActions = () => (
  <Card className="mt-8 shadow-lg border-0">
    <CardHeader>
      <CardTitle className="text-2xl">Quick Actions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid md:grid-cols-4 gap-4">
        <Button asChild className="h-20 flex-col bg-blue-600 hover:bg-blue-700">
          <Link to="/lab/appointments">
            <Calendar className="h-6 w-6 mb-2" />
            Schedule Test
          </Link>
        </Button>
        <Button asChild className="h-20 flex-col bg-purple-600 hover:bg-purple-700">
          <Link to="/lab/equipment">
            <Microscope className="h-6 w-6 mb-2" />
            Lab Equipment
          </Link>
        </Button>
        <Button asChild className="h-20 flex-col bg-green-600 hover:bg-green-700">
          <Link to="/lab/patient-records">
            <FileText className="h-6 w-6 mb-2" />
            Patient Records
          </Link>
        </Button>
        <Button asChild className="h-20 flex-col bg-orange-600 hover:bg-orange-700">
          <Link to="/lab/analytics">
            <TrendingUp className="h-6 w-6 mb-2" />
            Lab Analytics
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default LabQuickActions;
