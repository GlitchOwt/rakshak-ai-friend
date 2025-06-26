
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SOSButton = () => {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendSOS = async () => {
    setSending(true);
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
          
          // Get user data
          const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
          const emergencyContacts = userData.emergencyContacts || [];
          
          if (emergencyContacts.length === 0) {
            toast({
              title: "No Emergency Contacts",
              description: "Please add emergency contacts first",
              variant: "destructive",
            });
            setSending(false);
            return;
          }
          
          // Simulate sending SOS messages
          setTimeout(() => {
            setSending(false);
            toast({
              title: "SOS Alert Sent!",
              description: `Emergency message sent to ${emergencyContacts.length} contacts with your location`,
              duration: 5000,
            });
            
            // Log for demo purposes
            console.log(`SOS sent to contacts:`, emergencyContacts);
            console.log(`Message: ${userData.name || 'User'} needs help. Here is the location: ${locationUrl}`);
          }, 2000);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Send SOS without location
          const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
          const emergencyContacts = userData.emergencyContacts || [];
          
          setTimeout(() => {
            setSending(false);
            toast({
              title: "SOS Alert Sent!",
              description: `Emergency message sent to ${emergencyContacts.length} contacts`,
              duration: 5000,
            });
          }, 2000);
        }
      );
    } else {
      // Geolocation not supported
      const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
      const emergencyContacts = userData.emergencyContacts || [];
      
      setTimeout(() => {
        setSending(false);
        toast({
          title: "SOS Alert Sent!",
          description: `Emergency message sent to ${emergencyContacts.length} contacts`,
          duration: 5000,
        });
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Button
          onClick={sendSOS}
          disabled={sending}
          className="w-32 h-32 rounded-full bg-rakshak-red hover:bg-rakshak-red/90 text-white shadow-2xl border-4 border-rakshak-white relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute inset-0 bg-rakshak-red/80 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            {sending ? (
              <>
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm font-heading">SENDING</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-8 w-8 mb-2" />
                <span className="text-lg font-heading">SOS</span>
              </>
            )}
          </div>
        </Button>
        
        {/* Ripple effect */}
        {!sending && (
          <div className="absolute inset-0 rounded-full border-4 border-rakshak-red/30 animate-ping"></div>
        )}
      </div>
      
      <div className="text-center max-w-xs">
        <h3 className="font-heading text-rakshak-indigo mb-2">Emergency SOS</h3>
        <p className="text-sm text-rakshak-indigo/70 mb-2 font-body">
          Tap to instantly alert your emergency contacts with your location
        </p>
        <div className="flex items-center justify-center text-xs text-rakshak-teal font-body">
          <MapPin className="h-3 w-3 mr-1" />
          Location sharing enabled
        </div>
      </div>
    </div>
  );
};

export default SOSButton;
