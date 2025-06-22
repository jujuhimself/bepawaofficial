import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PrescriptionUpload } from "../components/PrescriptionUpload";
import PageHeader from "../components/PageHeader";

const Prescriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'individual') {
    navigate('/login');
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Prescriptions"
          description="Upload and manage your medical prescriptions"
          badge={{ text: "Health Records", variant: "outline" }}
        />
        <PrescriptionUpload />
      </div>
    </div>
  );
};

export default Prescriptions;
