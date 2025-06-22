import React from 'react';
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RetailLayout from "@/components/retail/RetailLayout";

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

  // Use RetailLayout for sidebar and content
  return (
    <RetailLayout>
      <Outlet />
    </RetailLayout>
  );
}
