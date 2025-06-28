import { elevenLabsService } from './elevenLabsService';

interface CallTriggerData {
  userPhone: string;
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
}

interface TwilioCallResponse {
  callSid: string;
  conversationId: string;
  status: string;
  message: string;
}

export class TwilioService {
  private static instance: TwilioService;
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_TRIGGER_CALL_WEBHOOK_URL || '';
  }

  static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  async triggerSafetyCall(data: CallTriggerData): Promise<TwilioCallResponse> {
    try {
      // First, create ElevenLabs conversation session
      const tempCallSid = `temp_${Date.now()}`;
      const conversationId = await elevenLabsService.createConversationSession(tempCallSid, {
        name: data.userName,
        location: data.location
      });

      // Prepare payload for Make.com webhook
      const payload = {
        action: 'trigger_call',
        userPhone: data.userPhone,
        userName: data.userName,
        location: data.location,
        emergencyContacts: data.emergencyContacts,
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        conversationId: conversationId,
        timestamp: new Date().toISOString(),
        twilioConfig: {
          accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
          authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
          fromNumber: import.meta.env.VITE_TWILIO_PHONE_NUMBER
        },
        twimlUrl: `${window.location.origin}/api/twiml/${conversationId}` // This would be your TwiML endpoint
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        callSid: result.callSid || `call_${Date.now()}`,
        conversationId: conversationId,
        status: 'initiated',
        message: 'Safety call initiated successfully'
      };
    } catch (error) {
      console.error('Failed to trigger safety call:', error);
      throw new Error('Failed to initiate safety call. Please try again.');
    }
  }

  async sendEmergencyAlert(data: {
    userName: string;
    location: { latitude: number; longitude: number } | null;
    emergencyContacts: Array<{ name: string; phone: string; relation: string }>;
    triggerWord: string;
    callSid?: string;
    conversationId?: string;
  }): Promise<void> {
    try {
      const locationString = data.location 
        ? `https://maps.google.com/?q=${data.location.latitude},${data.location.longitude}`
        : 'Location unavailable';

      const payload = {
        action: 'emergency_alert',
        userName: data.userName,
        location: locationString,
        emergencyContacts: data.emergencyContacts,
        triggerWord: data.triggerWord,
        callSid: data.callSid,
        conversationId: data.conversationId,
        timestamp: new Date().toISOString(),
        message: `🚨 EMERGENCY ALERT: ${data.userName} may be in danger. Trigger word detected: "${data.triggerWord}". Last known location: ${locationString}. Please check immediately.`
      };

      const webhookUrl = import.meta.env.VITE_EMERGENCY_ALERT_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('Emergency alert webhook URL not configured');
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      throw error;
    }
  }

  async sendSafeArrivalNotification(data: {
    userName: string;
    emergencyContacts: Array<{ name: string; phone: string; relation: string }>;
    safeWord: string;
    callSid?: string;
    conversationId?: string;
  }): Promise<void> {
    try {
      const payload = {
        action: 'safe_arrival',
        userName: data.userName,
        emergencyContacts: data.emergencyContacts,
        safeWord: data.safeWord,
        callSid: data.callSid,
        conversationId: data.conversationId,
        timestamp: new Date().toISOString(),
        message: `✅ ${data.userName} has safely reached her destination. Safe word detected: "${data.safeWord}".`
      };

      const webhookUrl = import.meta.env.VITE_SAFE_ARRIVAL_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('Safe arrival webhook URL not configured');
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send safe arrival notification:', error);
      throw error;
    }
  }

  // Generate TwiML response for Twilio webhook
  generateTwiMLResponse(conversationId: string): string {
    return elevenLabsService.generateTwiML(conversationId);
  }
}

export const twilioService = TwilioService.getInstance();