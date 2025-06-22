import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  Search, 
  Phone, 
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  Package,
  Plus,
  Eye,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Retailer {
  id: string;
  pharmacyName: string;
  email: string;
  phone: string;
  location: string;
  region: string;
  isApproved: boolean;
  registrationDate: string;
  lastOrder: string;
  totalOrders: number;
  totalSpent: number;
  creditLimit: number;
  creditUsed: number;
  paymentTerm: string;
}

const WholesaleRetailers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [activeTab, setActiveTab] = useState("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRetailer, setNewRetailer] = useState({
    pharmacyName: '',
    email: '',
    phone: '',
    location: '',
    region: '',
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'wholesale') {
      navigate('/login');
      return;
    }
    async function fetchRetailers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, business_name, email, phone, address, region, is_approved, created_at')
        .eq('role', 'retail');
      if (!error && data) {
        setRetailers(data.map((r: any) => ({
          id: r.id,
          pharmacyName: r.business_name,
          email: r.email || '',
          phone: r.phone || '',
          location: r.address || '',
          region: r.region || '',
          isApproved: !!r.is_approved,
          registrationDate: r.created_at ? r.created_at.split('T')[0] : '',
          lastOrder: '',
          totalOrders: 0,
          totalSpent: 0,
          creditLimit: 0,
          creditUsed: 0,
          paymentTerm: ''
        })));
      } else {
        setRetailers([]);
      }
    }
    fetchRetailers();
  }, [user, navigate]);

  const filteredRetailers = retailers.filter(retailer => {
    const matchesSearch = retailer.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === "all" || retailer.region === selectedRegion;
    const matchesTab = activeTab === "all" || (activeTab === 'active' ? retailer.isApproved : !retailer.isApproved);
    return matchesSearch && matchesRegion && matchesTab;
  });

  const regions = ["all", ...Array.from(new Set(retailers.map(r => r.region)))];
  
  const getStatusColor = (isApproved: boolean) => {
    return isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const handleSendMessage = (retailerId: string) => {
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the retailer.",
    });
  };

  const handleUpdateStatus = (retailerId: string, newStatus: boolean) => {
    setRetailers(prev => prev.map(retailer => 
      retailer.id === retailerId ? { ...retailer, isApproved: newStatus } : retailer
    ));
    
    toast({
      title: "Status Updated",
      description: `Retailer status changed to ${newStatus ? 'Active' : 'Pending'}`,
    });
  };

  const stats = {
    totalRetailers: retailers.length,
    activeRetailers: retailers.filter(r => r.isApproved).length,
    pendingApprovals: retailers.filter(r => !r.isApproved).length,
    totalRevenue: retailers.reduce((sum, r) => sum + r.totalSpent, 0),
    totalCreditUsed: retailers.reduce((sum, r) => sum + r.creditUsed, 0)
  };

  const handleAddRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const { error } = await supabase.from('profiles').insert({
        business_name: newRetailer.pharmacyName,
        email: newRetailer.email,
        phone: newRetailer.phone,
        address: newRetailer.location,
        region: newRetailer.region,
        role: 'retail',
        is_approved: false,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: 'Retailer Added', description: 'Retailer added successfully.' });
      setShowAddModal(false);
      setNewRetailer({ pharmacyName: '', email: '', phone: '', location: '', region: '' });
      // Refresh list
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, business_name, email, phone, address, region, is_approved, created_at')
        .eq('role', 'retail');
      if (!fetchError && data) {
        setRetailers(data.map((r: any) => ({
          id: r.id,
          pharmacyName: r.business_name,
          email: r.email || '',
          phone: r.phone || '',
          location: r.address || '',
          region: r.region || '',
          isApproved: !!r.is_approved,
          registrationDate: r.created_at ? r.created_at.split('T')[0] : '',
          lastOrder: '',
          totalOrders: 0,
          totalSpent: 0,
          creditLimit: 0,
          creditUsed: 0,
          paymentTerm: ''
        })));
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add retailer', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Retailer Management</h1>
            <p className="text-gray-600 text-lg">Manage your pharmacy retailer network</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Retailer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Retailers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRetailers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeRetailers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingApprovals}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">TZS {(stats.totalRevenue / 1000000).toFixed(1)}M</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Credit Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">TZS {(stats.totalCreditUsed / 1000000).toFixed(1)}M</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search retailers by name or contact person..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region === 'all' ? 'All Regions' : region}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retailers Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Retailers</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {retailers.length === 0 ? (
              <div className="text-gray-500">No retailers found.</div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredRetailers.map((retailer) => (
                  <Card key={retailer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Building className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{retailer.pharmacyName}</h3>
                            <Badge className={getStatusColor(retailer.isApproved)}>
                              {retailer.isApproved ? 'Active' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{retailer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{retailer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{retailer.location}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{retailer.totalOrders}</div>
                          <div className="text-xs text-gray-500">Total Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            TZS {(retailer.totalSpent / 1000000).toFixed(1)}M
                          </div>
                          <div className="text-xs text-gray-500">Total Spent</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Credit Used</span>
                          <span>TZS {retailer.creditUsed.toLocaleString()} / {retailer.creditLimit.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(retailer.creditUsed / retailer.creditLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSendMessage(retailer.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        {retailer.isApproved === false && (
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStatus(retailer.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Retailer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRetailer} className="space-y-4">
              <Input placeholder="Pharmacy Name" value={newRetailer.pharmacyName} onChange={e => setNewRetailer({ ...newRetailer, pharmacyName: e.target.value })} required />
              <Input placeholder="Email" type="email" value={newRetailer.email} onChange={e => setNewRetailer({ ...newRetailer, email: e.target.value })} required />
              <Input placeholder="Phone" value={newRetailer.phone} onChange={e => setNewRetailer({ ...newRetailer, phone: e.target.value })} required />
              <Input placeholder="Location/Address" value={newRetailer.location} onChange={e => setNewRetailer({ ...newRetailer, location: e.target.value })} required />
              <Input placeholder="Region" value={newRetailer.region} onChange={e => setNewRetailer({ ...newRetailer, region: e.target.value })} required />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Retailer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WholesaleRetailers;
