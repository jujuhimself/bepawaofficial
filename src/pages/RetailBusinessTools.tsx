import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const subPages = [
  "/business-tools-retail/pos",
  "/business-tools-retail/forecast",
  "/business-tools-retail/adjustment",
  "/business-tools-retail/credit"
];

export default function RetailBusinessTools() {
  const { user } = useAuth();
  const location = useLocation();

  // Only allow retail users
  if (!user || user.role !== "retail") {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Not authorized.</div>;
  }

  // Redirect /business-tools-retail to default sub-page
  if (location.pathname === "/business-tools-retail") {
    return <Navigate to="/business-tools-retail/pos" replace />;
  }

  // Shell with sidebar and page content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col">
      {/* Removed Navbar here to avoid duplicate navigation */}
      <div className="flex flex-1 w-full">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
