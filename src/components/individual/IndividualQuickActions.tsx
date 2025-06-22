import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Building, TestTube, Upload, Clock, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

const IndividualQuickActions = () => (
  <Card className="mb-8 shadow-lg border-0">
    <CardHeader>
      <CardTitle className="text-2xl">Quick Actions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Button asChild className="h-24 flex-col bg-blue-600 hover:bg-blue-700 text-white">
          <Link to="/browse-products">
            <Search className="h-8 w-8 mb-2" />
            Browse Medicines
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
          <Link to="/individual/cart">
            <ShoppingCart className="h-8 w-8 mb-2" />
            My Cart
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
          <Link to="/pharmacy-directory">
            <Building className="h-8 w-8 mb-2" />
            Find Pharmacies
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
          <Link to="/lab-directory">
            <TestTube className="h-8 w-8 mb-2" />
            Find Labs
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
          <Link to="/prescriptions">
            <Upload className="h-8 w-8 mb-2" />
            Upload Prescription
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 flex-col border-2 hover:bg-gray-50">
          <Link to="/my-orders">
            <Clock className="h-8 w-8 mb-2" />
            Order History
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default IndividualQuickActions;
