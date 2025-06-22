import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { MapPin, Search } from "lucide-react";
import PharmacyCard from "../components/PharmacyCard";
import PharmacyStockDialog from "../components/PharmacyStockDialog";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { supabase } from "../integrations/supabase/client";
import LoadingState from "../components/LoadingState";

const fetchPharmacies = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, business_name, region, city, is_approved, address, phone')
    .eq('role', 'retail')
    .eq('is_approved', true);
  if (error) throw new Error(error.message);
  return data || [];
};

const PharmacyDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);

  const { data: pharmacies, isLoading, isError } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: fetchPharmacies,
  });

  const filteredPharmacies = (pharmacies || []).filter(pharmacy =>
    (pharmacy.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pharmacy.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pharmacy.region || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingState />;
  if (isError) return <EmptyState title="Error" description="Could not fetch pharmacies." icon={<MapPin className="h-16 w-16" />} />;
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Find Pharmacies"
          description="Discover nearby pharmacies and order medicines"
        />
        
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by name, city, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
        
        {filteredPharmacies.length === 0 ? (
          <EmptyState
            title="No pharmacies found"
            description="No pharmacies match your search. Check back soon!"
            icon={<MapPin className="h-16 w-16" />}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.id}
                pharmacy={{
                  id: pharmacy.id,
                  name: pharmacy.business_name,
                  location: `${pharmacy.city}, ${pharmacy.region}`,
                  rating: 4.5, // placeholder
                  isOpen: true, // placeholder
                  phone: pharmacy.phone,
                  address: pharmacy.address,
                }}
                onViewStock={() => setSelectedPharmacy(pharmacy)}
              />
            ))}
          </div>
        )}
        
        <PharmacyStockDialog
          open={!!selectedPharmacy}
          onOpenChange={() => setSelectedPharmacy(null)}
          pharmacyName={selectedPharmacy?.business_name}
          pharmacyId={selectedPharmacy?.id}
        />
      </div>
    </div>
  );
};

export default PharmacyDirectory;
