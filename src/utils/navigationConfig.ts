import React from "react";
import { 
  Home, 
  Settings, 
  FileText, 
  Package, 
  BarChart3, 
  Truck, 
  Users, 
  Wrench, 
  ShoppingCart, 
  TestTube, 
  Building, 
  CreditCard, 
  Calculator,
  Calendar,
  Heart,
  Shield,
  Activity,
  Database,
  UserCheck,
  Eye,
  TrendingUp,
  ClipboardList,
  Plus
} from "lucide-react";

export interface NavigationItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

export interface NavigationGroup {
  name: string;
  items: NavigationItem[];
}

export class NavigationMenuConfig {
  private role: string;

  constructor(role: string) {
    this.role = role;
  }

  private getNavigationItems(): Record<string, NavigationItem[]> {
    return {
      admin: [
        { label: "Dashboard", icon: React.createElement(Home, { className: "w-4 h-4" }), href: "/admin" },
        { label: "Analytics", icon: React.createElement(BarChart3, { className: "w-4 h-4" }), href: "/admin/analytics" },
        { label: "User Management", icon: React.createElement(Users, { className: "w-4 h-4" }), href: "/admin/users" },
        { label: "Staff Management", icon: React.createElement(UserCheck, { className: "w-4 h-4" }), href: "/admin/staff-management" },
        { label: "System Monitoring", icon: React.createElement(Activity, { className: "w-4 h-4" }), href: "/admin/system-monitoring" },
        { label: "Audit Logs", icon: React.createElement(Eye, { className: "w-4 h-4" }), href: "/admin/audit-logs" },
        { label: "Business Tools", icon: React.createElement(Wrench, { className: "w-4 h-4" }), href: "/business-tools" },
        { label: "Settings", icon: React.createElement(Settings, { className: "w-4 h-4" }), href: "/settings" },
      ],
      individual: [
        { label: "Dashboard", icon: React.createElement(Home, { className: "w-4 h-4" }), href: "/individual" },
        { label: "Find Pharmacies", icon: React.createElement(Building, { className: "w-4 h-4" }), href: "/individual/pharmacies" },
        { label: "Find Labs", icon: React.createElement(TestTube, { className: "w-4 h-4" }), href: "/individual/labs" },
        { label: "My Prescriptions", icon: React.createElement(FileText, { className: "w-4 h-4" }), href: "/prescriptions" },
        { label: "Appointments", icon: React.createElement(Calendar, { className: "w-4 h-4" }), href: "/appointments" },
        { label: "Health Records", icon: React.createElement(Heart, { className: "w-4 h-4" }), href: "/health-records" },
        { label: "Settings", icon: React.createElement(Settings, { className: "w-4 h-4" }), href: "/settings" },
      ],
      retail: [
        { label: "Dashboard", icon: React.createElement(Home, { className: "w-4 h-4" }), href: "/retail/dashboard" },
        { label: "POS", icon: React.createElement(Calculator, { className: "w-4 h-4" }), href: "/retail/pos" },
        { label: "Inventory", icon: React.createElement(Package, { className: "w-4 h-4" }), href: "/retail/inventory" },
        { label: "Create Product", icon: React.createElement(Plus, { className: "w-4 h-4" }), href: "/retail/create-product" },
        { label: "Inventory Adjustments", icon: React.createElement(TrendingUp, { className: "w-4 h-4" }), href: "/retail/adjustments" },
        { label: "Orders", icon: React.createElement(FileText, { className: "w-4 h-4" }), href: "/retail/orders" },
        { label: "Reports", icon: React.createElement(BarChart3, { className: "w-4 h-4" }), href: "/retail/reports" },
        { label: "Audit Log", icon: React.createElement(Eye, { className: "w-4 h-4" }), href: "/retail/audit-log" },
        { label: "Browse Products", icon: React.createElement(Package, { className: "w-4 h-4" }), href: "/browse-products" },
        { label: "Cart", icon: React.createElement(ShoppingCart, { className: "w-4 h-4" }), href: "/cart" },
        { label: "Staff Management", icon: React.createElement(UserCheck, { className: "w-4 h-4" }), href: "/retail/staff" },
        { label: "Settings", icon: React.createElement(Settings, { className: "w-4 h-4" }), href: "/settings" },
      ],
      wholesale: [
        { label: "Dashboard", icon: React.createElement(Home, { className: "w-4 h-4" }), href: "/wholesale/dashboard" },
        { label: "Inventory", icon: React.createElement(Package, { className: "w-4 h-4" }), href: "/wholesale/inventory" },
        { label: "Inventory Adjustments", icon: React.createElement(TrendingUp, { className: "w-4 h-4" }), href: "/wholesale/adjustments" },
        { label: "Orders", icon: React.createElement(FileText, { className: "w-4 h-4" }), href: "/wholesale/orders" },
        { label: "Retailers", icon: React.createElement(Users, { className: "w-4 h-4" }), href: "/wholesale/retailers" },
        { label: "Analytics", icon: React.createElement(BarChart3, { className: "w-4 h-4" }), href: "/wholesale/analytics" },
        { label: "Business Tools", icon: React.createElement(Wrench, { className: "w-4 h-4" }), href: "/wholesale/business-tools" },
        { label: "Audit Log", icon: React.createElement(Eye, { className: "w-4 h-4" }), href: "/wholesale/audit-log" },
        { label: "Staff Management", icon: React.createElement(UserCheck, { className: "w-4 h-4" }), href: "/wholesale/staff" },
        { label: "Settings", icon: React.createElement(Settings, { className: "w-4 h-4" }), href: "/settings" },
      ],
      lab: [
        { label: "Dashboard", icon: React.createElement(Home, { className: "w-4 h-4" }), href: "/lab/dashboard" },
        { label: "Test Catalog", icon: React.createElement(TestTube, { className: "w-4 h-4" }), href: "/lab/test-catalog" },
        { label: "Lab Orders", icon: React.createElement(FileText, { className: "w-4 h-4" }), href: "/lab/orders" },
        { label: "Appointments", icon: React.createElement(Calendar, { className: "w-4 h-4" }), href: "/lab/appointments" },
        { label: "Results Management", icon: React.createElement(Database, { className: "w-4 h-4" }), href: "/lab/results" },
        { label: "Quality Control", icon: React.createElement(Shield, { className: "w-4 h-4" }), href: "/lab/quality-control" },
        { label: "Settings", icon: React.createElement(Settings, { className: "w-4 h-4" }), href: "/settings" },
      ],
    };
  }

  private groupItemsByCategory(items: NavigationItem[]): NavigationGroup[] {
    const groups: NavigationGroup[] = [];

    const groupMapping: Record<string, string> = {
      "Dashboard": "General",
      "Analytics": "General",
      "System Monitoring": "Administration",
      "User Management": "Administration", 
      "Audit Logs": "Administration",
      "Audit Log": "Administration",
      "Inventory": "Inventory",
      "Inventory Adjustments": "Inventory",
      "Browse Products": "Inventory",
      "Reports": "Inventory",
      "POS": "Point of Sale",
      "Orders": "Orders",
      "Retailers": "Customers",
      "Find Pharmacies": "Directory",
      "Find Labs": "Directory",
      "My Prescriptions": "Health",
      "Appointments": "Health",
      "Health Records": "Health",
      "Test Catalog": "Lab Services",
      "Results Management": "Lab Services",
      "Quality Control": "Lab Services",
      "Settings": "Account",
      "Staff Management": "Administration",
    };

    const groupedItems: Record<string, NavigationItem[]> = {};

    items.forEach(item => {
      const groupName = groupMapping[item.label] || "Other";
      if (!groupedItems[groupName]) {
        groupedItems[groupName] = [];
      }
      groupedItems[groupName].push(item);
    });

    const groupOrder = [
      "General", 
      "Point of Sale",
      "Inventory", 
      "Orders", 
      "Customers",
      "Directory", 
      "Health", 
      "Lab Services", 
      "Administration",
      "Account", 
      "Other"
    ];
    
    groupOrder.forEach(groupName => {
      if (groupedItems[groupName]) {
        groups.push({
          name: groupName,
          items: groupedItems[groupName]
        });
      }
    });

    return groups;
  }

  getMenuGroups(): NavigationGroup[] {
    const allItems = this.getNavigationItems();
    const roleItems = allItems[this.role] || allItems['retail'];
    return this.groupItemsByCategory(roleItems);
  }

  getMenuItems(): NavigationItem[] {
    const allItems = this.getNavigationItems();
    return allItems[this.role] || allItems['retail'];
  }
}
