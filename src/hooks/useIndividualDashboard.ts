import { useQuery } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";

// Returns summarized stats and lists for the individual dashboard
export function useIndividualDashboard() {
  const { user } = useAuth();

  const userId = user?.id;

  // Fetch all orders for the user
  const ordersQuery = useQuery({
    queryKey: ["individual-orders", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userId,
  });

  // Fetch all prescriptions for the user
  const prescriptionsQuery = useQuery({
    queryKey: ["individual-prescriptions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!userId,
  });

  // Wishlist - not implemented in Supabase, show 0, prompt in the UI
  // const wishlistQuery = useQuery(...)

  // Gather computed stats
  const isLoading =
    ordersQuery.isLoading || prescriptionsQuery.isLoading;
  const isError =
    ordersQuery.isError || prescriptionsQuery.isError;

  let stats = {
    totalOrders: 0,
    pendingOrders: 0,
    savedItems: 0, // TODO: Fetch from Supabase if/when wishlist is implemented
    activePrescriptions: 0,
  };

  let recentOrders: any[] = [];
  let orders: any[] = Array.isArray(ordersQuery.data) ? ordersQuery.data : [];

  if (!isLoading && !isError) {
    stats.totalOrders = orders.length;
    stats.pendingOrders = orders.filter((order) => order.status === "pending").length;
    // savedItems stays 0 for now
    const prescriptions = prescriptionsQuery.data || [];
    stats.activePrescriptions = prescriptions.filter(
      (p: any) => p.status === "pending" || p.status === "processed"
    ).length;
    recentOrders = orders.slice(0, 5);
  }

  return {
    isLoading,
    isError,
    stats,
    recentOrders,
  };
}
