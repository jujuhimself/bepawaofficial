import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import RouteGuard from "../components/RouteGuard";

// Index and Auth
import Index from "../pages/Index";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AuthCallback from "../pages/AuthCallback";

// Individual Pages
import IndividualDashboard from "../pages/IndividualDashboard";
import Appointments from "../pages/Appointments";
import HealthRecords from "../pages/HealthRecords";
import Prescriptions from "../pages/Prescriptions";
import PharmacyDirectory from "../pages/PharmacyDirectory";
import LabDirectory from "../pages/LabDirectory";
import BrowseProducts from "../pages/BrowseProducts";
import MyOrders from "../pages/MyOrders";
import IndividualCart from "../pages/IndividualCart";

// Pharmacy/Retail Pages
import Orders from "../pages/Orders";
import Cart from "../pages/Cart";
import RetailBusinessTools from "../pages/RetailBusinessTools";
import RetailAuditLog from "../pages/retail/RetailAuditLog";
import RetailAdjustment from "../pages/retail/RetailAdjustment";
import RetailCredit from "../pages/retail/RetailCredit";
import RetailForecast from "../pages/retail/RetailForecast";
import RetailPos from "../pages/retail/RetailPos";
import RetailReporting from "../pages/retail/RetailReporting";
import PharmacyStaffManagement from '../pages/pharmacy/StaffManagement';
import RetailInventory from "../pages/retail/RetailInventory";
import RetailDashboard from "../pages/retail/RetailDashboard";
import CreateProduct from "../pages/retail/CreateProduct";

// Wholesale Pages
import WholesaleDashboard from "../pages/WholesaleDashboard";
import WholesaleInventory from "../pages/WholesaleInventory";
import WholesaleOrders from "../pages/WholesaleOrders";
import WholesaleRetailers from "../pages/WholesaleRetailers";
import WholesaleAnalytics from "../pages/WholesaleAnalytics";
import WholesaleBusinessTools from "../pages/WholesaleBusinessTools";
import WholesaleStaffManagement from '../pages/wholesale/StaffManagement';
import WholesalePurchaseOrders from '../pages/WholesalePurchaseOrders';
import WholesaleAdjustment from '../pages/wholesale/WholesaleAdjustment';
import WholesaleAuditLog from '../pages/wholesale/WholesaleAuditLog';

// Lab Pages
import LabDashboard from "../pages/LabDashboard";
import LabOrders from "../pages/lab/LabOrders";
import LabAppointments from "../pages/lab/LabAppointments";
import LabResults from "../pages/lab/LabResults";

// Admin Pages
import AdminDashboard from "../pages/AdminDashboard";
import AdminAnalytics from "../pages/AdminAnalytics";
import AdminStaffManagement from '../pages/admin/StaffManagement';
import AdminSystemMonitoring from '../pages/admin/AdminSystemMonitoring';
import AdminAuditLogs from '../pages/admin/AuditLogs';

// Common Pages
import SystemSettings from "../pages/SystemSettings";
import NotFound from "../pages/NotFound";

// Unified Layout
import AppLayout from "../components/AppLayout";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Main App Layout */}
      <Route path="/" element={<AppLayout />}>
        {/* Public Home */}
        <Route index element={<Index />} />

        {/* Individual User Routes */}
        <Route path="individual" element={<Navigate to="/individual/dashboard" replace />} />
        <Route path="individual/dashboard" element={<RouteGuard allowedRoles={['individual']}><IndividualDashboard /></RouteGuard>} />
        <Route path="individual/pharmacies" element={<RouteGuard allowedRoles={['individual']}><PharmacyDirectory /></RouteGuard>} />
        <Route path="individual/labs" element={<RouteGuard allowedRoles={['individual']}><LabDirectory /></RouteGuard>} />
        <Route path="appointments" element={<RouteGuard allowedRoles={['individual']}><Appointments /></RouteGuard>} />
        <Route path="health-records" element={<RouteGuard allowedRoles={['individual']}><HealthRecords /></RouteGuard>} />
        <Route path="prescriptions" element={<RouteGuard allowedRoles={['individual']}><Prescriptions /></RouteGuard>} />
        <Route path="browse-products" element={<RouteGuard allowedRoles={['individual', 'retail']}><BrowseProducts /></RouteGuard>} />
        <Route path="my-orders" element={<RouteGuard allowedRoles={['individual']}><MyOrders /></RouteGuard>} />
        <Route path="cart" element={<RouteGuard allowedRoles={['individual', 'retail']}><Cart /></RouteGuard>} />

        {/* Retail Routes */}
        <Route path="retail/dashboard" element={<RouteGuard allowedRoles={['retail']} requireApproval><RetailDashboard /></RouteGuard>} />
        <Route path="retail/pos" element={<RouteGuard allowedRoles={['retail']} requireApproval><RetailPos /></RouteGuard>} />
        <Route path="retail/inventory" element={<RouteGuard allowedRoles={['retail']} requireApproval><RetailInventory /></RouteGuard>} />
        <Route path="retail/adjustments" element={<RouteGuard allowedRoles={['retail']} requireApproval><RetailAdjustment /></RouteGuard>} />
        <Route path="retail/audit-log" element={<RouteGuard allowedRoles={['retail']} requireApproval><RetailAuditLog /></RouteGuard>} />
        <Route path="retail/orders" element={<RouteGuard allowedRoles={['retail']} requireApproval><Orders /></RouteGuard>} />
        <Route path="retail/reports" element={<RouteGuard allowedRoles={['retail']} requireApproval><RetailReporting /></RouteGuard>} />
        <Route path="retail/forecast" element={<RouteGuard allowedRoles={['retail']} requireApproval><RetailForecast /></RouteGuard>} />
        <Route path="retail/staff" element={<RouteGuard allowedRoles={['retail']} requireApproval><PharmacyStaffManagement /></RouteGuard>} />
        <Route path="retail/create-product" element={<RouteGuard allowedRoles={['retail']} requireApproval><CreateProduct /></RouteGuard>} />
        
        {/* Corrected legacy routes and added a general products route for retail */}
        <Route path="inventory-management" element={<Navigate to="/retail/inventory" replace />} />
        <Route path="products" element={<Navigate to="/browse-products" replace />} />

        {/* Wholesale Routes */}
        <Route path="wholesale/dashboard" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleDashboard /></RouteGuard>} />
        <Route path="wholesale/inventory" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleInventory /></RouteGuard>} />
        <Route path="wholesale/adjustments" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleAdjustment /></RouteGuard>} />
        <Route path="wholesale/audit-log" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleAuditLog /></RouteGuard>} />
        <Route path="wholesale/orders" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleOrders /></RouteGuard>} />
        <Route path="wholesale/purchase-orders" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesalePurchaseOrders /></RouteGuard>} />
        <Route path="wholesale/retailers" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleRetailers /></RouteGuard>} />
        <Route path="wholesale/analytics" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleAnalytics /></RouteGuard>} />
        <Route path="wholesale/business-tools" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleBusinessTools /></RouteGuard>} />
        <Route path="wholesale/staff" element={<RouteGuard allowedRoles={['wholesale']} requireApproval><WholesaleStaffManagement /></RouteGuard>} />

        {/* Lab Routes */}
        <Route path="lab/dashboard" element={<RouteGuard allowedRoles={['lab']}><LabDashboard /></RouteGuard>} />
        <Route path="lab/orders" element={<RouteGuard allowedRoles={['lab']}><LabOrders /></RouteGuard>} />
        <Route path="lab/appointments" element={<RouteGuard allowedRoles={['lab']}><LabAppointments /></RouteGuard>} />
        <Route path="lab/results" element={<RouteGuard allowedRoles={['lab']}><LabResults /></RouteGuard>} />

        {/* Admin Routes */}
        <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="admin/dashboard" element={<RouteGuard allowedRoles={['admin']}><AdminDashboard /></RouteGuard>} />
        <Route path="admin/analytics" element={<RouteGuard allowedRoles={['admin']}><AdminAnalytics /></RouteGuard>} />
        <Route path="admin/users" element={<RouteGuard allowedRoles={['admin']}><AdminStaffManagement /></RouteGuard>} />
        <Route path="admin/staff-management" element={<RouteGuard allowedRoles={['admin']}><AdminStaffManagement /></RouteGuard>} />
        <Route path="admin/system-monitoring" element={<RouteGuard allowedRoles={['admin']}><AdminSystemMonitoring /></RouteGuard>} />
        <Route path="admin/audit-logs" element={<RouteGuard allowedRoles={['admin']}><AdminAuditLogs /></RouteGuard>} />

        {/* Common Routes */}
        <Route path="settings" element={<SystemSettings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;