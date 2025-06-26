
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin } from "lucide-react";
import { useSOSIntegration } from "@/hooks/useSOSIntegration";

const SOSButton = () => {
  const { sendSOS, isSending } = useSOSIntegration();

  const handleSOS = async () => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
          
          await sendSOS({
            userName: userData.name || 'User',
            location: { latitude, longitude },
            emergencyContacts: userData.emergencyContacts || [],
            triggerReason: 'manual'
          });
        },
        async () => {
          // Send SOS without location if geolocation fails
          const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
          
          await sendSOS({
            userName: userData.name || 'User',
            location: null,
            emergencyContacts: userData.emergencyContacts || [],
            triggerReason: 'manual'
          });
        }
      );
    } else {
      // Geolocation not supported
      const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
      
      await sendSOS({
        userName: userData.name || 'User',
        location: null,
        emergencyContacts: userData.emergencyContacts || [],
        triggerReason: 'manual'
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Button
          onClick={handleSOS}
          disabled={isSending}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl border-4 border-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            {isSending ? (
              <>
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm font-bold">SENDING</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-8 w-8 mb-2" />
                <span className="text-lg font-bold">SOS</span>
              </>
            )}
          </div>
        </Button>
        
        {/* Ripple effect */}
        {!isSending && (
          <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
        )}
      </div>
      
      <div className="text-center max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-2">Emergency SOS</h3>
        <p className="text-sm text-gray-600 mb-2">
          Tap to instantly alert your emergency contacts with your location
        </p>
        <div className="flex items-center justify-center text-xs text-gray-500">
          <MapPin className="h-3 w-3 mr-1" />
          Location sharing enabled
        </div>
      </div>
    </div>
  );
};

export default SOSButton;
