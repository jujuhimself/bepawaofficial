import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

export function PrescriptionUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(`${Date.now()}-${file.name}`, file);

      if (uploadError) throw uploadError;

      // Create prescription record
      const { error: dbError } = await supabase
        .from('prescriptions')
        .insert({
          file_path: data?.path,
          status: 'pending',
          uploaded_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Prescription uploaded successfully',
      });

      // Reset form
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload prescription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Prescription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-sm text-gray-500">
            Supported formats: JPG, PNG. Max size: 5MB
          </p>
        </div>

        {preview && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Preview:</p>
            <img
              src={preview}
              alt="Prescription preview"
              className="max-w-sm rounded-lg border"
            />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Prescription'}
        </Button>
      </CardContent>
    </Card>
  );
}
