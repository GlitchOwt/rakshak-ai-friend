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
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    this.authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    this.fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';
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
      // First, create ElevenLabs conversation session
      const conversationId = await elevenLabsService.createConversationSession(
        `temp_call_${Date.now()}`, // Temporary call ID
        {
          name: callData.userName,
          location: callData.location
        }
      );

      // Then trigger the call via Make.com webhook
      const result = await makeWebhookService.triggerSafetyCall({
        ...callData,
        agentId: elevenLabsService.getAgentId(),
        conversationId
      });

      return result;
    } catch (error) {
      console.error('Failed to trigger safety call:', error);
      
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
      triggerCall: false,
      emergencyAlert: false,
      safeArrival: false
    };

    // Test Call Trigger Webhook
    try {
      await makeWebhookService.testTriggerCall();
      results.triggerCall = true;
      console.log('✅ Call trigger webhook test passed');
    } catch (error) {
      console.error('❌ Call trigger webhook test failed:', error);
    }

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

  getServiceStatus(): { [key: string]: boolean } {
    const webhookStatus = makeWebhookService.getWebhookStatus();
    
    return {
      elevenLabsConfigured: elevenLabsService.isConfigured(),
      twilioConfigured: !!(this.accountSid && this.authToken && this.fromNumber),
      ...webhookStatus
    };
  }
}

export const twilioService = TwilioService.getInstance();