import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { twilioService } from '@/services/twilioService';
import { callMonitoringService } from '@/services/callMonitoringService';
import { elevenLabsService } from '@/services/elevenLabsService';

interface VoiceCallConfig {
  onCallStarted?: (callSid: string, conversationId: string) => void;
  onCallEnded?: () => void;
  onEmergencyTriggered?: (triggerWord: string) => void;
  onSafeArrival?: (safeWord: string) => void;
}

export const useTwilioVoiceCall = (config?: VoiceCallConfig) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);

  // Listen for emergency and safe arrival events
  useEffect(() => {
    const handleEmergencyTriggered = (event: CustomEvent) => {
      const { triggerWord } = event.detail;
      config?.onEmergencyTriggered?.(triggerWord);
    };

    const handleSafeArrival = (event: CustomEvent) => {
      const { safePhrase } = event.detail;
      config?.onSafeArrival?.(safePhrase);
    };

    window.addEventListener('emergencyTriggered', handleEmergencyTriggered as EventListener);
    window.addEventListener('safeArrival', handleSafeArrival as EventListener);

    return () => {
      window.removeEventListener('emergencyTriggered', handleEmergencyTriggered as EventListener);
      window.removeEventListener('safeArrival', handleSafeArrival as EventListener);
    };
  }, [config]);

  const startSafetyCall = useCallback(async () => {
    setIsInitiating(true);
    
    try {
      // Get user data
      const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
      
      if (!userData.phone) {
        throw new Error('Phone number not found. Please update your profile.');
      }

      // Check if ElevenLabs is properly configured
      if (!elevenLabsService.isConfigured()) {
        throw new Error('ElevenLabs service is not properly configured. Please check your API key and Agent ID.');
      }

      // Get current location
      let location: { latitude: number; longitude: number } | null = null;
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (geoError) {
        console.warn('Could not get location:', geoError);
        // Continue without location
      }

      // Trigger the call via ElevenLabs outbound calling
      const callData = {
        userPhone: userData.phone,
        userName: userData.name || 'User',
        location,
        emergencyContacts: userData.emergencyContacts || []
      };

      const response = await twilioService.triggerSafetyCall(callData);
      
      if (response.callSid && response.conversationId) {
        setCurrentCallSid(response.callSid);
        setCurrentConversationId(response.conversationId);
        setIsCallActive(true);
        
        // Register the call for monitoring
        callMonitoringService.registerCall({
          callSid: response.callSid,
          userName: callData.userName,
          userPhone: callData.userPhone,
          location: callData.location,
          emergencyContacts: callData.emergencyContacts,
          conversationId: response.conversationId
        });

        config?.onCallStarted?.(response.callSid, response.conversationId);
        
        toast({
          title: "🤖 AI Safety Companion Activated",
          description: "You should receive a call within 10 seconds. Your AI companion will start a friendly conversation and monitor for your safety.",
          duration: 8000,
        });

        // Simulate call connection after 5 seconds
        setTimeout(() => {
          toast({
            title: "📞 Call Connected",
            description: "Your AI safety companion is now talking with you. Speak naturally!",
            duration: 5000,
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to start safety call:', error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Unable to start safety call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitiating(false);
    }
  }, [config, toast]);

  const endCall = useCallback(async () => {
    if (currentCallSid) {
      callMonitoringService.endCall(currentCallSid);
    }
    
    if (currentConversationId) {
      try {
        await elevenLabsService.endConversation(currentConversationId);
      } catch (error) {
        console.warn('Failed to end ElevenLabs conversation:', error);
      }
      setCurrentConversationId(null);
    }
    
    setCurrentCallSid(null);
    setIsCallActive(false);
    config?.onCallEnded?.();
    
    toast({
      title: "Call Ended",
      description: "Your safety call has ended. Thank you for using Rakshak.ai!",
    });
  }, [currentCallSid, currentConversationId, config, toast]);

  // Simulate transcript processing (in real implementation, this would come from ElevenLabs webhook)
  const simulateTranscriptProcessing = useCallback((transcript: string) => {
    if (currentCallSid) {
      callMonitoringService.processTranscript(currentCallSid, transcript);
    }
  }, [currentCallSid]);

  return {
    isCallActive,
    currentCallSid,
    currentConversationId,
    isInitiating,
    startSafetyCall,
    endCall,
    simulateTranscriptProcessing // For testing purposes
  };
};