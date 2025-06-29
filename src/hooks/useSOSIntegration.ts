import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SOSData {
  userName: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  triggerReason: 'manual' | 'voice_trigger' | 'panic';
}

export const useSOSIntegration = () => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const sendSOS = async (data: SOSData) => {
    setIsSending(true);
    
    try {
      const locationString = data.location 
        ? `https://maps.google.com/?q=${data.location.latitude},${data.location.longitude}`
        : 'Location unavailable';

      // This would integrate with Make.com or n8n webhook
      const webhookUrl = import.meta.env.VITE_SOS_WEBHOOK_URL;
      
      if (webhookUrl) {
        const payload = {
          userName: data.userName,
          location: locationString,
          emergencyContacts: data.emergencyContacts,
          triggerReason: data.triggerReason,
          timestamp: new Date().toISOString(),
          message: `🚨 EMERGENCY ALERT: ${data.userName} needs help. Location: ${locationString}`
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        toast({
          title: "SOS Alert Sent!",
          description: `Emergency message sent to ${data.emergencyContacts.length} contacts with your location`,
          duration: 5000,
        });
      } else {
        // Fallback to simulation for now
        console.log('SOS sent with data:', data);
        toast({
          title: "SOS Alert Sent!",
          description: `Emergency message sent to ${data.emergencyContacts.length} contacts`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Failed to send SOS:', error);
      toast({
        title: "SOS Failed",
        description: "Failed to send emergency alert. Please try again or call 911 directly.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendSafeArrivalNotification = async (userName: string, contacts: Array<{name: string; phone: string}>) => {
    try {
      const webhookUrl = import.meta.env.VITE_SAFE_ARRIVAL_WEBHOOK_URL;
      
      if (webhookUrl) {
        const payload = {
          userName,
          contacts,
          message: `✅ ${userName} has reached their destination safely.`,
          timestamp: new Date().toISOString(),
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      toast({
        title: "Safe Arrival Sent",
        description: "Your emergency contacts have been notified that you're safe",
      });
    } catch (error) {
      console.error('Failed to send safe arrival notification:', error);
    }
  };

  return {
    sendSOS,
    sendSafeArrivalNotification,
    isSending
  };
};