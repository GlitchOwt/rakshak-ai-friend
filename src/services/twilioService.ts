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

      // Directly initiate ElevenLabs outbound call
      const conversationId = await elevenLabsService.initiateOutboundCall(
        callData.userPhone,
        {
          name: callData.userName,
          location: callData.location
        }
      );

      // Optionally notify Make.com about the call initiation for logging/tracking
      try {
        await makeWebhookService.logCallInitiation({
          userPhone: callData.userPhone,
          userName: callData.userName,
          location: callData.location,
          emergencyContacts: callData.emergencyContacts,
          conversationId,
          method: 'elevenlabs_outbound'
        });
      } catch (webhookError) {
        console.warn('Failed to log call initiation to Make.com:', webhookError);
        // Don't fail the call if logging fails
      }

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

  async testWebhooks(): Promise<void> {
    console.log('🧪 Testing all Make.com webhooks...');
    
    const results = {
      emergencyAlert: false,
      safeArrival: false
    };

    // Test Emergency Alert Webhook
    try {
      await makeWebhookService.testEmergencyAlert();
      results.emergencyAlert = true;
      console.log('✅ Emergency alert webhook test passed');
    } catch (error) {
      console.error('❌ Emergency alert webhook test failed:', error);
    }

    // Test Safe Arrival Webhook
    try {
      await makeWebhookService.testSafeArrival();
      results.safeArrival = true;
      console.log('✅ Safe arrival webhook test passed');
    } catch (error) {
      console.error('❌ Safe arrival webhook test failed:', error);
    }

    console.log('🧪 Webhook test results:', results);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`📊 Test Summary: ${passedTests}/${totalTests} webhooks working correctly`);
    
    if (passedTests === 0) {
      throw new Error('All webhook tests failed. Please check your Make.com configuration and webhook URLs.');
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
    const webhookStatus = makeWebhookService.getWebhookStatus();
    
    return {
      elevenLabsConfigured: elevenLabsService.isConfigured(),
      elevenLabsOutbound: !!(elevenLabsService.getAgentId() && elevenLabsService.getPhoneNumberId()),
      ...webhookStatus
    };
  }
}

export const twilioService = TwilioService.getInstance();