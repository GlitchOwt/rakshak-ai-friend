
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Edit, Plus, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

const EmergencyContactsModal = ({ isOpen, onClose }: EmergencyContactsModalProps) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContact, setEditContact] = useState<EmergencyContact>({ name: "", phone: "", relation: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
      setContacts(userData.emergencyContacts || []);
    }
  }, [isOpen]);

  const saveContacts = (newContacts: EmergencyContact[]) => {
    const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
    userData.emergencyContacts = newContacts;
    localStorage.setItem('rakshak_user', JSON.stringify(userData));
    setContacts(newContacts);
  };

  const addContact = () => {
    if (contacts.length >= 3) {
      toast({
        title: "Maximum Contacts",
        description: "You can only have up to 3 emergency contacts",
        variant: "destructive",
      });
      return;
    }
    setEditingIndex(contacts.length);
    setEditContact({ name: "", phone: "", relation: "" });
  };

  const editContactHandler = (index: number) => {
    setEditingIndex(index);
    setEditContact(contacts[index]);
  };

  const saveContact = () => {
    if (!editContact.name.trim() || !editContact.phone.trim() || !editContact.relation.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in all contact fields",
        variant: "destructive",
      });
      return;
    }

    const newContacts = [...contacts];
    if (editingIndex !== null) {
      if (editingIndex < contacts.length) {
        newContacts[editingIndex] = editContact;
      } else {
        newContacts.push(editContact);
      }
      saveContacts(newContacts);
      setEditingIndex(null);
      setEditContact({ name: "", phone: "", relation: "" });
      
      toast({
        title: "Contact Saved",
        description: "Emergency contact has been updated successfully",
      });
    }
  };

  const deleteContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    saveContacts(newContacts);
    toast({
      title: "Contact Deleted",
      description: "Emergency contact has been removed",
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditContact({ name: "", phone: "", relation: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-purple-600 mr-2" />
            <DialogTitle className="text-xl">
              Emergency Contacts
            </DialogTitle>
          </div>
          <p className="text-gray-600 text-sm">
            Manage your emergency contacts (Max 3)
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Name"
                      value={editContact.name}
                      onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                    />
                    <Input
                      placeholder="Phone Number"
                      value={editContact.phone}
                      onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                    />
                    <Select 
                      value={editContact.relation} 
                      onValueChange={(value) => setEditContact({ ...editContact, relation: value })}
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
                    <div className="flex gap-2">
                      <Button onClick={saveContact} size="sm" className="flex-1">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm" className="flex-1">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                        <p className="text-gray-600">{contact.phone}</p>
                        <p className="text-sm text-gray-500 capitalize">{contact.relation}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editContactHandler(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContact(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {editingIndex === contacts.length && (
            <Card className="border border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Name"
                    value={editContact.name}
                    onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone Number"
                    value={editContact.phone}
                    onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                  />
                  <Select 
                    value={editContact.relation} 
                    onValueChange={(value) => setEditContact({ ...editContact, relation: value })}
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
                  <div className="flex gap-2">
                    <Button onClick={saveContact} size="sm" className="flex-1">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" size="sm" className="flex-1">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contacts.length < 3 && editingIndex === null && (
            <Button
              onClick={addContact}
              variant="outline"
              className="w-full border-dashed border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Emergency Contact
            </Button>
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyContactsModal;
