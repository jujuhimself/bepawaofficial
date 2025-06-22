import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Search, Star, Clock, Phone, TestTube, Calendar } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { labService, type Lab, type LabTest } from "@/services/labService";
import { supabase } from "@/integrations/supabase/client";

interface BookingForm {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: string;
  patientGender: 'male' | 'female' | 'other' | '';
  doctorName: string;
  doctorPhone: string;
  doctorEmail: string;
  bookingDate: string;
  bookingTime: string;
  selectedTests: string[];
  specialInstructions: string;
}

const LabBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    patientName: user?.name || "",
    patientPhone: "",
    patientEmail: user?.email || "",
    patientAge: "",
    patientGender: "",
    doctorName: "",
    doctorPhone: "",
    doctorEmail: "",
    bookingDate: "",
    bookingTime: "",
    selectedTests: [],
    specialInstructions: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      fetchLabTests(selectedLab.id);
    }
  }, [selectedLab]);

  const fetchLabs = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const fetchLabTests = async (labId: string) => {
    try {
      const testsData = await labService.getLabTestsByLab(labId);
      setLabTests(testsData);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast({
        title: "Error",
        description: "Failed to load lab tests",
        variant: "destructive",
      });
    }
  };

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTests = labTests.filter(test =>
    selectedCategory === "" || test.category === selectedCategory
  );

  const handleLabSelect = (lab: Lab) => {
    setSelectedLab(lab);
    setBookingForm(prev => ({
      ...prev,
      selectedTests: []
    }));
  };

  const handleTestToggle = (testId: string) => {
    setBookingForm(prev => ({
      ...prev,
      selectedTests: prev.selectedTests.includes(testId)
        ? prev.selectedTests.filter(id => id !== testId)
        : [...prev.selectedTests, testId]
    }));
  };

  const calculateTotal = () => {
    return labTests
      .filter(test => bookingForm.selectedTests.includes(test.id))
      .reduce((total, test) => total + test.price, 0);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLab) {
      toast({
        title: "Error",
        description: "Please select a laboratory",
        variant: "destructive",
      });
      return;
    }

    if (bookingForm.selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive",
      });
      return;
    }

    if (!bookingForm.patientName || !bookingForm.bookingDate || !bookingForm.bookingTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user?.id,
          provider_id: selectedLab.user_id,
          provider_type: 'lab',
          appointment_date: bookingForm.bookingDate,
          appointment_time: bookingForm.bookingTime,
          service_type: bookingForm.selectedTests.join(', '),
          status: 'scheduled',
          notes: bookingForm.specialInstructions
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create lab booking
      const selectedTestNames = labTests
        .filter(test => bookingForm.selectedTests.includes(test.id))
        .map(test => test.test_name);

      await labService.createLabBooking({
        lab_id: selectedLab.id,
        appointment_id: appointment.id,
        patient_name: bookingForm.patientName,
        patient_phone: bookingForm.patientPhone,
        patient_email: bookingForm.patientEmail,
        patient_age: bookingForm.patientAge ? parseInt(bookingForm.patientAge) : undefined,
        patient_gender: bookingForm.patientGender || undefined,
        doctor_name: bookingForm.doctorName,
        doctor_phone: bookingForm.doctorPhone,
        doctor_email: bookingForm.doctorEmail,
        booking_date: bookingForm.bookingDate,
        booking_time: bookingForm.bookingTime,
        test_types: selectedTestNames,
        total_amount: calculateTotal(),
        special_instructions: bookingForm.specialInstructions
      });

      toast({
        title: "Booking Successful",
        description: `Your lab appointment has been scheduled for ${bookingForm.bookingDate} at ${bookingForm.bookingTime}`,
      });

      // Reset form
      setSelectedLab(null);
      setBookingForm({
        patientName: user?.name || "",
        patientPhone: "",
        patientEmail: user?.email || "",
        patientAge: "",
        patientGender: "",
        doctorName: "",
        doctorPhone: "",
        doctorEmail: "",
        bookingDate: "",
        bookingTime: "",
        selectedTests: [],
        specialInstructions: ""
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 8; hour <= 18; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return times;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Book Lab Test"
          description="Find and book laboratory tests from verified facilities"
          badge={{ text: "Healthcare", variant: "outline" }}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lab Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Select Laboratory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search laboratories by name, location, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading laboratories...</p>
                  </div>
                ) : filteredLabs.length === 0 ? (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No laboratories found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLabs.map((lab) => (
                      <Card
                        key={lab.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedLab?.id === lab.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleLabSelect(lab)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-semibold mb-1">{lab.name}</h3>
                              <div className="flex items-center text-gray-600 mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{lab.location}</span>
                              </div>
                              {lab.description && (
                                <p className="text-sm text-gray-600 mb-2">{lab.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center mb-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="ml-1 font-medium">{lab.rating}</span>
                              </div>
                              <Badge variant={lab.is_open ? "default" : "secondary"}>
                                <Clock className="h-3 w-3 mr-1" />
                                {lab.is_open ? "Open" : "Closed"}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {lab.categories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {lab.categories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{lab.categories.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{lab.hours}</span>
                            {lab.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                <span>{lab.phone}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedLab ? (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a laboratory to book your test</p>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">{selectedLab.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{selectedLab.location}</p>
                    </div>

                    {/* Test Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Tests</label>
                      {labTests.length === 0 ? (
                        <p className="text-sm text-gray-500">No tests available for this laboratory</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {filteredTests.map((test) => (
                            <div
                              key={test.id}
                              className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={test.id}
                                  checked={bookingForm.selectedTests.includes(test.id)}
                                  onChange={() => handleTestToggle(test.id)}
                                  className="mr-2"
                                />
                                <label htmlFor={test.id} className="text-sm cursor-pointer">
                                  {test.test_name}
                                </label>
                              </div>
                              <span className="text-sm font-medium">${test.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Category Filter */}
                    {labTests.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Filter by Category</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All categories</SelectItem>
                            {Array.from(new Set(labTests.map(test => test.category))).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Patient Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Patient Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name *</label>
                        <Input
                          value={bookingForm.patientName}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, patientName: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Phone</label>
                          <Input
                            value={bookingForm.patientPhone}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, patientPhone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Age</label>
                          <Input
                            type="number"
                            value={bookingForm.patientAge}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, patientAge: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Gender</label>
                        <Select
                          value={bookingForm.patientGender}
                          onValueChange={(value: 'male' | 'female' | 'other') => 
                            setBookingForm(prev => ({ ...prev, patientGender: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                          type="email"
                          value={bookingForm.patientEmail}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, patientEmail: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Doctor Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Doctor Information (Optional)</h4>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Doctor Name</label>
                        <Input
                          value={bookingForm.doctorName}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, doctorName: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Doctor Phone</label>
                          <Input
                            value={bookingForm.doctorPhone}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, doctorPhone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Doctor Email</label>
                          <Input
                            type="email"
                            value={bookingForm.doctorEmail}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, doctorEmail: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Appointment Details</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Date *</label>
                          <Input
                            type="date"
                            value={bookingForm.bookingDate}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, bookingDate: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Time *</label>
                          <Select
                            value={bookingForm.bookingTime}
                            onValueChange={(value) => setBookingForm(prev => ({ ...prev, bookingTime: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableTimes().map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Special Instructions</label>
                        <Textarea
                          value={bookingForm.specialInstructions}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                          placeholder="Any special instructions or requirements..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Total */}
                    {bookingForm.selectedTests.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Total Amount:</span>
                          <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {bookingForm.selectedTests.length} test(s) selected
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isBooking || bookingForm.selectedTests.length === 0}
                    >
                      {isBooking ? "Booking..." : "Book Appointment"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabBooking; 