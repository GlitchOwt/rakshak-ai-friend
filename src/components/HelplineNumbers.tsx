
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HelplineNumbersProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelplineNumbers = ({ isOpen, onClose }: HelplineNumbersProps) => {
  const { toast } = useToast();

  const helplines = [
    {
      category: "Emergency Services",
      numbers: [
        { name: "Police Emergency", number: "100", description: "For immediate police assistance" },
        { name: "Women Helpline", number: "181", description: "24/7 women's helpline" },
        { name: "Emergency Services", number: "112", description: "Unified emergency helpline" },
      ]
    },
    {
      category: "Women's Safety",
      numbers: [
        { name: "National Commission for Women", number: "011-26944880", description: "Women's rights and complaints" },
        { name: "Domestic Violence Helpline", number: "181", description: "Support for domestic violence" },
        { name: "Women in Distress", number: "1091", description: "Women in distress helpline" },
      ]
    },
    {
      category: "Legal & Medical",
      numbers: [
        { name: "Legal Aid", number: "15100", description: "Free legal advice" },
        { name: "Medical Emergency", number: "108", description: "Ambulance and medical emergency" },
        { name: "Mental Health Helpline", number: "9152987821", description: "Mental health support" },
      ]
    }
  ];

  const makeCall = (number: string, name: string) => {
    // For demo purposes, we'll show a toast instead of actually making a call
    toast({
      title: "Calling " + name,
      description: `Dialing ${number}...`,
      duration: 3000,
    });
    
    // In a real app, you would use:
    // window.location.href = `tel:${number}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-0 bg-white/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-purple-600 mr-2" />
            <DialogTitle className="text-xl">
              Emergency Helplines
            </DialogTitle>
          </div>
          <p className="text-gray-600 text-sm">
            Important numbers for emergency assistance
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {helplines.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-purple-700">
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.numbers.map((helpline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{helpline.name}</h4>
                      <p className="text-sm text-gray-600">{helpline.description}</p>
                      <p className="text-lg font-bold text-purple-600 mt-1">{helpline.number}</p>
                    </div>
                    <Button
                      onClick={() => makeCall(helpline.number, helpline.name)}
                      className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Additional Resources</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• National Crime Records Bureau (NCRB)</li>
                    <li>• State Women's Commission</li>
                    <li>• District Legal Services Authority</li>
                    <li>• One Stop Centre (Sakhi Centre)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default HelplineNumbers;
