import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useIndividualDashboard } from "../hooks/useIndividualDashboard";
import IndividualStatsCards from "../components/individual/IndividualStatsCards";
import IndividualQuickActions from "../components/individual/IndividualQuickActions";
import NearbyPharmacies from "../components/individual/NearbyPharmacies";
import HealthSummary from "../components/individual/HealthSummary";
import PageHeader from "../components/PageHeader";
import { supabase } from "../integrations/supabase/client";
import { useNotificationSubscription } from "../hooks/useNotifications";

const IndividualDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isLoading, isError, stats, recentOrders } = useIndividualDashboard();
  const [nearbyPharmacies, setNearbyPharmacies] = useState<any[]>([]);
  const [allPharmacies, setAllPharmacies] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");

  // Enable notification subscription for individuals
  useNotificationSubscription();

  useEffect(() => {
    async function fetchPharmacies() {
      // Fetch all approved retail pharmacies
      const { data, error } = await supabase
        .from('profiles')
        .select('id, business_name, region, city, is_approved')
        .eq('role', 'retail')
        .eq('is_approved', true);
      if (!error && Array.isArray(data)) {
        setAllPharmacies(data);
        // Extract unique regions/cities
        const uniqueRegions = Array.from(new Set(data.map((p: any) => p.region || p.city).filter(Boolean)));
        setRegions(uniqueRegions);
        // Default: show all or filter by first region
        setNearbyPharmacies(
          data.map((p: any) => ({
            id: p.id,
            name: p.business_name || "Pharmacy",
            distance: "N/A",
            rating: 4.5,
            open: true,
            region: p.region,
            city: p.city,
          }))
        );
      }
    }
    fetchPharmacies();
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      setNearbyPharmacies(
        allPharmacies.map((p: any) => ({
          id: p.id,
          name: p.business_name || "Pharmacy",
          distance: "N/A",
          rating: 4.5,
          open: true,
          region: p.region,
          city: p.city,
        }))
      );
    } else {
      setNearbyPharmacies(
        allPharmacies
          .filter((p: any) => p.region === selectedRegion || p.city === selectedRegion)
          .map((p: any) => ({
            id: p.id,
            name: p.business_name || "Pharmacy",
            distance: "N/A",
            rating: 4.5,
            open: true,
            region: p.region,
            city: p.city,
          }))
      );
    }
  }, [selectedRegion, allPharmacies]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return (
      <div className="p-4 text-red-600">
        Failed to load dashboard data. Please try again later.
      </div>
    );
  }

  if (!user) {
    // This case should theoretically be handled by RouteGuard, but as a fallback:
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title={`Welcome back, ${user?.name}`}
          description="Find nearby pharmacies and order your medicines"
          badge={{ text: "Patient Portal", variant: "outline" }}
        />
        <IndividualStatsCards stats={stats} />
        <IndividualQuickActions />
        <div className="mb-4 flex gap-4 items-center">
          <label className="text-sm font-medium">Filter by Region/City:</label>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <NearbyPharmacies pharmacies={nearbyPharmacies} />
          <HealthSummary totalOrders={stats.totalOrders} recentOrders={recentOrders} />
        </div>
      </div>
    </div>
  );
};

export default IndividualDashboard;
