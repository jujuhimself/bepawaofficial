import React from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import PageHeader from "../components/PageHeader";
import EnhancedInventoryManager from "../components/inventory/EnhancedInventoryManager";

const WholesaleInventory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user || user.role !== 'wholesale') {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Wholesale Inventory Management"
          description="Manage your wholesale product inventory with advanced features"
        />
        
        <EnhancedInventoryManager />
      </div>
    </div>
  );
};

export default WholesaleInventory;