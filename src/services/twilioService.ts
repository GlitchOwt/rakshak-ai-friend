import { elevenLabsService } from './elevenLabsService';

interface CallData {
  userPhone: string;
  userName: string;
  location: { latitude: number; longitude: number } | null;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
}

export class TwilioService {
  private static instance: TwilioService;

  constructor() {
    // No longer need Twilio credentials since we're using ElevenLabs outbound calling
  }

  static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  async triggerSafetyCall(callData: CallData): Promise<{
    callSid: string;
    conversationId: string;
    status: string;
  }> {
    try {
      console.log('🚀 Triggering safety call via ElevenLabs outbound calling...', callData);

      // Directly initiate ElevenLabs outbound call
      const conversationId = await elevenLabsService.initiateOutboundCall(
        callData.userPhone,
        {
          name: callData.userName,
          location: callData.location
        }
      );

      return {
        callSid: `el_${conversationId}`, // Use conversation ID as call SID
        conversationId,
        status: 'initiated'
      };
    } catch (error) {
      console.error('❌ Failed to trigger safety call:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to initiate safety call: ${error.message}`);
      } else {
        throw new Error('Failed to initiate safety call. Please try again.');
      }
    }
  }

  async testElevenLabsOutbound(): Promise<void> {
    console.log('🧪 Testing ElevenLabs outbound calling...');
    
    try {
      const conversationId = await elevenLabsService.testOutboundCall();
      console.log('✅ ElevenLabs outbound call test passed:', conversationId);
      
      // Wait a moment then end the test call
      setTimeout(async () => {
        try {
          await elevenLabsService.endConversation(conversationId);
          console.log('✅ Test call ended successfully');
        } catch (error) {
          console.warn('Failed to end test call:', error);
        }
      }, 10000); // End after 10 seconds
      
    } catch (error) {
      console.error('❌ ElevenLabs outbound call test failed:', error);
      throw error;
    }
  }

  getServiceStatus(): { [key: string]: boolean } {
    return {
      elevenLabsConfigured: elevenLabsService.isConfigured(),
      elevenLabsOutbound: !!(elevenLabsService.getAgentId() && elevenLabsService.getPhoneNumberId()),
      emergencyAlert: true, // Assume webhooks are configured
      safeArrival: true
    };
  }
}

export const twilioService = TwilioService.getInstance();