import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TestTube, Calendar, User, Search, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { labService } from "@/services/labService";

interface LabOrderItem {
  id: string;
  lab_order_id: string;
  test_name: string;
  status: 'pending' | 'processing' | 'completed';
  result?: string;
  result_date?: string;
  test_price: number;
  patient_name: string;
  order_date: string;
}

const LabResults = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<LabOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabOrderItem | null>(null);
  const [resultText, setResultText] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_order_items')
        .select(`
          *,
          lab_order:lab_orders(patient_name, order_date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const typedResults: LabOrderItem[] = (data || []).map(item => ({
        id: item.id,
        lab_order_id: item.lab_order_id,
        test_name: item.test_name,
        status: item.status as 'pending' | 'processing' | 'completed',
        result: item.result || undefined,
        result_date: item.result_date || undefined,
        test_price: item.test_price,
        patient_name: (item.lab_order as any)?.patient_name || 'Unknown Patient',
        order_date: (item.lab_order as any)?.order_date || ''
      }));

      setResults(typedResults);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load test results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResults = results.filter(result =>
    result.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenResultDialog = (result: LabOrderItem) => {
    setSelectedResult(result);
    setResultText(result.result || "");
    setResultDialogOpen(true);
  };

  const handleResultChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setResultText(e.target.value);

  const handleUploadResult = async () => {
    if (!selectedResult || !resultText) return;
    setUploading(true);
    try {
      await labService.updateLabOrderItemResult(selectedResult.id, resultText);
      toast({ title: "Result Uploaded", description: "Test result updated successfully." });
      setResultDialogOpen(false);
      fetchResults();
    } catch (e) {
      toast({ title: "Error", description: "Failed to upload result", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div>Loading results...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Test Results"
          description="Manage and view laboratory test results"
          badge={{ text: "Lab Portal", variant: "outline" }}
        />
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Result
          </Button>
        </div>

        {filteredResults.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No results match your search." : "No test results available."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredResults.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{result.test_name}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-1" />
                        <span>{result.patient_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Ordered: {new Date(result.order_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                      <div className="text-sm text-gray-500 mt-1">
                        ${result.test_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {result.result && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <h4 className="text-sm font-medium mb-1">Result</h4>
                      <p className="text-sm text-gray-700">{result.result}</p>
                      {result.result_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Result Date: {new Date(result.result_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {result.status !== 'completed' && (
                      <Button variant="outline" size="sm" onClick={() => handleOpenResultDialog(result)}>
                        Update Result
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Test Result</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <Textarea value={resultText} onChange={handleResultChange} placeholder="Enter result details..." rows={6} />
            </div>
            <DialogFooter>
              <Button onClick={handleUploadResult} disabled={uploading || !resultText}>
                {uploading ? "Uploading..." : "Upload Result"}
              </Button>
              <Button variant="outline" onClick={() => setResultDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LabResults;
