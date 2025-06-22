import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, File, X, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { labService, type FileUpload } from "@/services/labService";

interface TestResultUploadProps {
  labOrderItemId: string;
  patientName: string;
  testName: string;
  onUploadComplete?: () => void;
}

const TestResultUpload = ({ labOrderItemId, patientName, testName, onUploadComplete }: TestResultUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultText, setResultText] = useState("");
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'text/plain', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or text file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (uploadType === 'file' && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (uploadType === 'text' && !resultText.trim()) {
      toast({
        title: "No result text",
        description: "Please enter the test result",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      if (uploadType === 'file' && selectedFile) {
        const fileUpload = await labService.uploadFile(
          selectedFile,
          'lab_result',
          labOrderItemId,
          'lab_order_items',
          `Test result for ${testName} - ${patientName}`
        );

        setUploadedFiles(prev => [fileUpload, ...prev]);
        
        toast({
          title: "File uploaded successfully",
          description: "Test result file has been uploaded",
        });
      } else if (uploadType === 'text' && resultText.trim()) {
        await labService.updateLabOrderItemResult(labOrderItemId, resultText);
        
        toast({
          title: "Result uploaded successfully",
          description: "Test result has been saved",
        });
      }

      setSelectedFile(null);
      setResultText("");
      setUploadType('file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadDialogOpen(false);
      
      onUploadComplete?.();

    } catch (error) {
      console.error('Error uploading result:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload test result. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await labService.deleteFileUpload(fileId);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      toast({
        title: "File deleted",
        description: "File has been removed",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <File className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Test Result Upload
            </span>
            <Button onClick={() => setUploadDialogOpen(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Result
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Patient:</span> {patientName}
              </div>
              <div>
                <span className="font-medium">Test:</span> {testName}
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Uploaded Files</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.file_type)}
                        <div>
                          <p className="font-medium text-sm">{file.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedFiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No files uploaded yet</p>
                <p className="text-sm">Click "Upload Result" to add test results</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Test Result</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Type</label>
              <Select value={uploadType} onValueChange={(value: 'file' | 'text') => setUploadType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Upload File (PDF/Text)</SelectItem>
                  <SelectItem value="text">Enter Text Result</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadType === 'file' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select File</label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.csv"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, TXT, CSV (Max 5MB)
                </p>
                {selectedFile && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                )}
              </div>
            )}

            {uploadType === 'text' && (
              <div>
                <label className="block text-sm font-medium mb-2">Test Result</label>
                <Textarea
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Enter the test result details..."
                  rows={6}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || (uploadType === 'file' && !selectedFile) || (uploadType === 'text' && !resultText.trim())}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestResultUpload; 