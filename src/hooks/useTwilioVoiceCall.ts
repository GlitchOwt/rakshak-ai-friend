import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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

  const startSafetyCall = useCallback(async () => {
    setIsInitiating(true);
    
    try {
      // Get user data
      const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
      
      if (!userData.phone) {
        throw new Error('Phone number not found. Please update your profile.');
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
      }

      // Prepare data for Make.com webhook
      const webhookData = {
        userPhone: userData.phone,
        userName: userData.name || 'User',
        userEmail: userData.email || '',
        location,
        emergencyContacts: userData.emergencyContacts || [],
        timestamp: new Date().toISOString()
      };

      console.log('🚀 Triggering Make.com webhook with data:', webhookData);

      // Trigger your Make.com webhook
      const webhookUrl = 'https://hook.eu2.make.com/f2ntahyyoo910b3mqquc1k73aot63cbl';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Make.com webhook triggered successfully');

      // Generate mock IDs for UI tracking
      const callSid = `make_${Date.now()}`;
      const conversationId = `conv_${Date.now()}`;

      setCurrentCallSid(callSid);
      setCurrentConversationId(conversationId);
      setIsCallActive(true);

      config?.onCallStarted?.(callSid, conversationId);
      
      toast({
        title: "🤖 AI Safety Companion Activated",
        description: "Your Make.com automation has been triggered. ElevenLabs will call you shortly!",
        duration: 8000,
      });

      // Simulate call connection status
      setTimeout(() => {
        if (isCallActive) {
          toast({
            title: "📞 Waiting for Call",
            description: "Your phone should ring any moment from ElevenLabs...",
            duration: 5000,
          });
        }
      }, 5000);

    } catch (error) {
      console.error('Failed to trigger webhook:', error);
      toast({
        title: "Webhook Failed",
        description: error instanceof Error ? error.message : "Unable to trigger Make.com webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitiating(false);
    }
  }, [config, toast, isCallActive]);

  const endCall = useCallback(async () => {
    setCurrentCallSid(null);
    setCurrentConversationId(null);
    setIsCallActive(false);
    config?.onCallEnded?.();
    
    toast({
      title: "Call Ended",
      description: "Your safety call session has ended. Thank you for using Rakshak.ai!",
    });
  }, [config, toast]);

  // Simulate transcript processing (for testing emergency/safe word detection)
  const simulateTranscriptProcessing = useCallback((transcript: string) => {
    const triggerWords = ['help', 'danger', 'stop', 'emergency', 'scared', 'unsafe'];
    const safeWords = ['reached home', 'home safe', 'arrived safely', 'reached destination'];

    const lowerTranscript = transcript.toLowerCase();

    // Check for emergency trigger words
    const detectedTriggerWord = triggerWords.find(word => lowerTranscript.includes(word));
    if (detectedTriggerWord) {
      config?.onEmergencyTriggered?.(detectedTriggerWord);
      return;
    }

    // Check for safe arrival words
    const detectedSafeWord = safeWords.find(phrase => lowerTranscript.includes(phrase));
    if (detectedSafeWord) {
      config?.onSafeArrival?.(detectedSafeWord);
      return;
    }
  }, [config]);

  return {
    isCallActive,
    currentCallSid,
    currentConversationId,
    isInitiating,
    startSafetyCall,
    endCall,
    simulateTranscriptProcessing
  };
};