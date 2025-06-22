import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Star, Clock, Phone, TestTube } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { labService, type Lab } from "@/services/labService";

const LabDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLab, setBookingLab] = useState<Lab | null>(null);
  const [selectedTest, setSelectedTest] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLabs();
  }, []);

  async function fetchLabs() {
    setLoading(true);
    try {
      const labsData = await labService.getLabs();
      setLabs(labsData);
    } catch (error) {
      console.error('Error fetching labs:', error);
      toast({
        title: "Error",
        description: "Failed to load laboratories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function handleBookTest(lab: Lab) {
    setBookingLab(lab);
    setShowBooking(true);
    setSelectedTest("");
    setPatientName("");
    setPatientPhone("");
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingLab || !selectedTest || !patientName) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }
    setBookingLoading(true);
    try {
      await labService.createLabBooking({
        lab_id: bookingLab.id,
        patient_name: patientName,
        patient_phone: patientPhone,
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: "09:00",
        test_types: [selectedTest],
        total_amount: 0, // Will be calculated based on test
        special_instructions: ""
      });
      
      toast({
        title: "Booking Successful",
        description: "Your lab appointment has been scheduled. The lab will contact you soon.",
      });
      setShowBooking(false);
    } catch (error) {
      console.error('Error booking test:', error);
      toast({
        title: "Error",
        description: "Error booking test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader 
          title="Find Laboratories"
          description="Discover nearby laboratories and book your medical tests"
          badge={{ text: "Healthcare", variant: "outline" }}
        />

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by laboratory name, location, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Labs Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading laboratories...</p>
          </div>
        ) : filteredLabs.length === 0 ? (
          <EmptyState
            title="No laboratories found"
            description="Laboratory directory will be populated as labs join the platform. Check back soon for available testing facilities in your area."
            icon={<TestTube className="h-16 w-16" />}
            variant="card"
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => (
              <Card key={lab.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{lab.name}</CardTitle>
                      <p className="text-gray-600 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {lab.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 font-medium">{lab.rating}</span>
                      </div>
                      {lab.distance && (
                        <p className="text-sm text-gray-500">{lab.distance}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={lab.is_open ? "default" : "secondary"}>
                        <Clock className="h-3 w-3 mr-1" />
                        {lab.is_open ? "Open" : "Closed"}
                      </Badge>
                      {lab.hours && (
                        <span className="text-sm text-gray-600">{lab.hours}</span>
                      )}
                    </div>

                    {lab.description && (
                      <p className="text-sm text-gray-600">{lab.description}</p>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-2">Available Tests:</p>
                      <div className="flex flex-wrap gap-1">
                        {lab.tests.slice(0, 3).map((test, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {test}
                          </Badge>
                        ))}
                        {lab.tests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{lab.tests.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Categories:</p>
                      <div className="flex flex-wrap gap-1">
                        {lab.categories.slice(0, 2).map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {lab.categories.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{lab.categories.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" onClick={() => handleBookTest(lab)}>
                        Book Test
                      </Button>
                      {lab.phone && (
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {showBooking && bookingLab && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Book Test at {bookingLab.name}</h2>
              <form onSubmit={submitBooking} className="space-y-3">
                <div>
                  <label className="block font-medium mb-1">Select Test *</label>
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={selectedTest}
                    onChange={e => setSelectedTest(e.target.value)}
                    required
                  >
                    <option value="">Select a test</option>
                    {bookingLab.tests.map((test, idx) => (
                      <option key={idx} value={test}>{test}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Patient Name *</label>
                  <Input
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Patient Phone</label>
                  <Input
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={bookingLoading} className="flex-1">
                    {bookingLoading ? "Booking..." : "Book Test"}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBooking(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabDirectory;
