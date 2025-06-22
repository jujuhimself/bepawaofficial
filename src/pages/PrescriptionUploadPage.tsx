import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PrescriptionUpload } from '../components/PrescriptionUpload';
import PageHeader from '../components/PageHeader';

const PrescriptionUploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'individual') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'individual') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Upload Prescription"
          description="Upload your prescription for processing and medication orders"
          badge={{ text: "Patient Portal", variant: "outline" }}
        />
        
        <div className="max-w-2xl mx-auto">
          <PrescriptionUpload />
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUploadPage; 