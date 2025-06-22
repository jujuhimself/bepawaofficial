import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { labService } from "@/services/labService";
import { useToast } from "@/hooks/use-toast";

export interface TestResult {
  id: string;
  patientName: string;
  testType: string;
  completedDate: string;
  status: string;
  values: { [key: string]: string };
}
interface LabResultsListProps {
  testResults: TestResult[];
  getStatusColor: (status: string) => string;
}

const LabResultsList = ({ testResults, getStatusColor }: LabResultsListProps) => {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [resultValues, setResultValues] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  function handleUpload(result: any) {
    setUploadResult(result);
    setResultValues({});
    setShowUpload(true);
  }

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadResult) return;
    setUploading(true);
    try {
      await labService.updateLabOrderItemResult(uploadResult.id, JSON.stringify(resultValues));
      toast({ title: "Result Uploaded", description: "Test result updated successfully." });
      setShowUpload(false);
      // TODO: Refresh results if needed
    } catch (error) {
      toast({ title: "Error", description: "Error uploading result. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center">
            <FileText className="h-6 w-6 mr-2 text-purple-600" />
            Recent Test Results
          </CardTitle>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testResults.length === 0 ? (
            <div className="text-center text-gray-400">No test results available.</div>
          ) : testResults.map((result) => (
            <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{result.patientName}</h4>
                  <p className="text-gray-600">{result.testType}</p>
                  <p className="text-sm text-gray-500">Completed: {result.completedDate}</p>
                </div>
                <Badge className={getStatusColor(result.status)}>
                  {result.status}
                </Badge>
              </div>
              <div className="space-y-1">
                {Object.entries(result.values).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                {result.status === 'ready' && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Send Results
                  </Button>
                )}
                {result.status !== 'completed' && (
                  <Button size="sm" variant="secondary" onClick={() => handleUpload(result)}>
                    Upload Result
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Upload Result Modal (placeholder) */}
        {showUpload && uploadResult && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Upload Result for {uploadResult.testType}</h2>
              <form onSubmit={submitUpload} className="space-y-3">
                <div>
                  <label className="block font-medium mb-1">Result Values (key:value, e.g. Glucose: 90)</label>
                  <textarea
                    className="border rounded w-full p-2"
                    rows={4}
                    placeholder="e.g. Glucose: 90\nCholesterol: 180"
                    value={Object.entries(resultValues).map(([k, v]) => `${k}: ${v}`).join("\n")}
                    onChange={e => {
                      const lines = e.target.value.split("\n");
                      const values: { [key: string]: string } = {};
                      lines.forEach(line => {
                        const [k, v] = line.split(":").map(s => s.trim());
                        if (k && v) values[k] = v;
                      });
                      setResultValues(values);
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={uploading} className="flex-1">{uploading ? "Uploading..." : "Upload Result"}</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUpload(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LabResultsList;
