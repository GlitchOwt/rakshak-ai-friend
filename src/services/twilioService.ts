import { elevenLabsService } from './elevenLabsService';
import { makeWebhookService } from './makeWebhookService';

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

      // Check ElevenLabs account status first
      const elevenLabsStatus = await elevenLabsService.getDetailedStatus();
      
      if (!elevenLabsStatus.accountStatus.hasOutboundCalling) {
        throw new Error(`ElevenLabs outbound calling not available: ${elevenLabsStatus.accountStatus.error || 'Upgrade to a paid plan required'}`);
      }

      // Directly initiate ElevenLabs outbound call
      const conversationId = await elevenLabsService.initiateOutboundCall(
        callData.userPhone,
        {
          name: callData.userName,
          location: callData.location
        }
      );

      const callSid = `el_${conversationId}`;

      // Log call initiation to Make.com for tracking
      try {
        await makeWebhookService.logCallInitiation({
          userPhone: callData.userPhone,
          userName: callData.userName,
          location: callData.location,
          emergencyContacts: callData.emergencyContacts,
          conversationId: conversationId,
          method: 'elevenlabs_outbound'
        });
      } catch (logError) {
        console.warn('Failed to log call initiation:', logError);
        // Don't fail the call if logging fails
      }

      return {
        callSid,
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
      // Check account status first
      const status = await elevenLabsService.getDetailedStatus();
      
      if (!status.accountStatus.hasOutboundCalling) {
        throw new Error(`ElevenLabs outbound calling not available: ${status.accountStatus.error || 'Upgrade required'}`);
      }

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

  async testWebhooks(): Promise<void> {
    console.log('🧪 Testing Make.com webhooks...');
    
    try {
      // Test emergency alert webhook
      await makeWebhookService.testEmergencyAlert();
      
      // Test safe arrival webhook
      await makeWebhookService.testSafeArrival();
      
      console.log('✅ All webhook tests completed');
    } catch (error) {
      console.error('❌ Webhook tests failed:', error);
      throw error;
    }
  }

  getServiceStatus(): { [key: string]: boolean } {
    const elevenLabsConfigured = elevenLabsService.isConfigured();
    const webhookStatus = makeWebhookService.getWebhookStatus();
    
    return {
      elevenLabsConfigured,
      elevenLabsOutbound: !!(elevenLabsService.getAgentId() && elevenLabsService.getPhoneNumberId()),
      emergencyAlert: webhookStatus.emergencyAlert,
      safeArrival: webhookStatus.safeArrival
    };
  }

  async getDetailedServiceStatus(): Promise<{
    elevenlabs: any;
    webhooks: any;
    overall: string;
  }> {
    const elevenLabsStatus = await elevenLabsService.getDetailedStatus();
    const webhookStatus = makeWebhookService.getWebhookStatus();
    
    let overall = 'ready';
    if (!elevenLabsStatus.accountStatus.hasOutboundCalling) {
      overall = 'upgrade_required';
    } else if (!elevenLabsStatus.configured) {
      overall = 'configuration_required';
    } else if (!webhookStatus.emergencyAlert || !webhookStatus.safeArrival) {
      overall = 'webhooks_missing';
    }
    
    return {
      elevenlabs: elevenLabsStatus,
      webhooks: webhookStatus,
      overall
    };
  }
}

export const twilioService = TwilioService.getInstance();