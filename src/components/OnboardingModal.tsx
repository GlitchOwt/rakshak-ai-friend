import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", relation: "" }
  ]);
  const { toast } = useToast();

  const addEmergencyContact = () => {
    if (emergencyContacts.length < 3) {
      setEmergencyContacts([...emergencyContacts, { name: "", phone: "", relation: "" }]);
    }
  };

  const removeEmergencyContact = (index: number) => {
    if (emergencyContacts.length > 1) {
      setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
    }
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = emergencyContacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setEmergencyContacts(updated);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !address.trim()) {
        toast({
          title: "Required Fields",
          description: "Please fill in your name and address",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    }
  };

  const handleComplete = () => {
    const validContacts = emergencyContacts.filter(contact => 
      contact.name.trim() && contact.phone.trim() && contact.relation.trim()
    );

    if (validContacts.length === 0) {
      toast({
        title: "Emergency Contacts Required",
        description: "Please add at least one emergency contact",
        variant: "destructive",
      });
      return;
    }

    // Get existing user data and update with fresh form data
    const existingUserData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
    const updatedUserData = {
      ...existingUserData,
      name: name.trim(),
      address: address.trim(),
      emergencyContacts: validContacts
    };
    
    localStorage.setItem('rakshak_user', JSON.stringify(updatedUserData));

    console.log('✅ Fresh user data saved:', updatedUserData);

    toast({
      title: "Profile Complete!",
      description: `Added ${validContacts.length} emergency contacts successfully`,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-purple-600 mr-2" />
            <DialogTitle className="text-xl">
              Complete Your Safety Profile
            </DialogTitle>
          </div>
          <p className="text-gray-600 text-sm">
            Let's set up your safety information
          </p>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Step 1: Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Home Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter your home address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            <Button 
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Next: Emergency Contacts
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Step 2: Emergency Contacts
                  <span className="text-sm text-gray-500 font-normal">(Max 3)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Contact {index + 1}</h4>
                      {emergencyContacts.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmergencyContact(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Phone Number"
                        value={contact.phone}
                        onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                      />
                      <Select 
                        value={contact.relation} 
                        onValueChange={(value) => updateEmergencyContact(index, 'relation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="relative">Relative</SelectItem>
                          <SelectItem value="colleague">Colleague</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                
                {emergencyContacts.length < 3 && (
                  <Button
                    variant="outline"
                    onClick={addEmergencyContact}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Contact
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;