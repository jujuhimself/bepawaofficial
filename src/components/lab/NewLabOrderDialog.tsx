import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";
import { labService, LabTest } from "../../services/labService";

interface NewLabOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const NewLabOrderDialog = ({ isOpen, onClose, onOrderCreated }: NewLabOrderDialogProps) => {
  const { toast } = useToast();
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      labService.getLabTests().then(setLabTests);
    }
  }, [isOpen]);

  const handleTestSelection = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const calculateTotal = () => {
    return selectedTests.reduce((total, testId) => {
      const test = labTests.find(t => t.id === testId);
      return total + (test?.price || 0);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!patientName || !doctorName || selectedTests.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one test.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await labService.createLabOrder({
        patient_name: patientName,
        patient_phone: patientPhone,
        doctor_name: doctorName,
        test_ids: selectedTests,
        total_amount: calculateTotal(),
      });
      toast({
        title: "Order Created",
        description: "The new lab order has been successfully created.",
      });
      onOrderCreated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lab order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Lab Order</DialogTitle>
          <DialogDescription>Fill in the details below to create a new lab order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patientName" className="text-right">Patient Name</Label>
            <Input id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patientPhone" className="text-right">Patient Phone</Label>
            <Input id="patientPhone" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="doctorName" className="text-right">Referring Doctor</Label>
            <Input id="doctorName" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="col-span-3" />
          </div>
          <div>
            <Label>Lab Tests</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
              {labTests.map(test => (
                <div key={test.id} className="flex items-center space-x-2">
                  <input type="checkbox" id={test.id} checked={selectedTests.includes(test.id)} onChange={() => handleTestSelection(test.id)} />
                  <label htmlFor={test.id} className="flex-1">{test.name} - ${test.price.toFixed(2)}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right font-bold">
            Total: ${calculateTotal().toFixed(2)}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating Order..." : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};