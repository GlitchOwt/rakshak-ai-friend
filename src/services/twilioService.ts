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
  private readonly callTriggerWebhook = 'https://hook.eu2.make.com/f2ntahyyoo910b3mqquc1k73aot63cbl';

  constructor() {
    // Using Make.com webhook to trigger ElevenLabs calls
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
      console.log('🚀 Triggering safety call via Make.com webhook...', callData);

      // Prepare payload for Make.com webhook
      const webhookPayload = {
        action: 'trigger_safety_call',
        userPhone: callData.userPhone,
        userName: callData.userName,
        location: callData.location ? {
          latitude: callData.location.latitude,
          longitude: callData.location.longitude,
          googleMapsUrl: `https://maps.google.com/?q=${callData.location.latitude},${callData.location.longitude}`
        } : null,
        emergencyContacts: callData.emergencyContacts,
        timestamp: new Date().toISOString(),
        source: 'rakshak_app'
      };

      console.log('📞 Sending call trigger to Make.com webhook:', webhookPayload);

      // Send to Make.com webhook
      const response = await fetch(this.callTriggerWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseText = await response.text();
      console.log('Make.com webhook response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        throw new Error(`Make.com webhook failed: ${response.status} ${response.statusText}. Response: ${responseText}`);
      }

      // Generate IDs for tracking (Make.com will handle the actual ElevenLabs call)
      const timestamp = Date.now();
      const conversationId = `make_${timestamp}`;
      const callSid = `make_call_${timestamp}`;

      console.log('✅ Make.com webhook triggered successfully. Call should be initiated by Make.com automation.');

      return {
        callSid,
        conversationId,
        status: 'webhook_triggered'
      };
    } catch (error) {
      console.error('❌ Failed to trigger Make.com webhook:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to trigger safety call via Make.com: ${error.message}`);
      } else {
        throw new Error('Failed to trigger safety call via Make.com. Please try again.');
      }
    }
  }

  async testWebhooks(): Promise<void> {
    console.log('🧪 Testing Make.com call trigger webhook...');
    
    try {
      const testData = {
        userPhone: '+918788293663',
        userName: 'Test User',
        location: { latitude: 40.7128, longitude: -74.0060 },
        emergencyContacts: [
          { name: 'Test Contact', phone: '+1234567890', relation: 'friend' }
        ]
      };

      await this.triggerSafetyCall(testData);
      console.log('✅ Make.com call trigger webhook test completed');
      
      // Also test other webhooks
      await makeWebhookService.testEmergencyAlert();
      await makeWebhookService.testSafeArrival();
      
      console.log('✅ All webhook tests completed');
    } catch (error) {
      console.error('❌ Webhook tests failed:', error);
      throw error;
    }
  }

  getServiceStatus(): { [key: string]: boolean } {
    const webhookStatus = makeWebhookService.getWebhookStatus();
    
    return {
      callTriggerWebhook: !!this.callTriggerWebhook,
      emergencyAlert: webhookStatus.emergencyAlert,
      safeArrival: webhookStatus.safeArrival,
      elevenLabsConfigured: true, // Make.com handles ElevenLabs
      elevenLabsOutbound: true // Make.com handles outbound calling
    };
  }

  async getDetailedServiceStatus(): Promise<{
    makeWebhook: any;
    webhooks: any;
    overall: string;
  }> {
    const webhookStatus = makeWebhookService.getWebhookStatus();
    
    let overall = 'ready';
    if (!this.callTriggerWebhook) {
      overall = 'webhook_missing';
    } else if (!webhookStatus.emergencyAlert || !webhookStatus.safeArrival) {
      overall = 'notification_webhooks_missing';
    }
    
    return {
      makeWebhook: {
        configured: !!this.callTriggerWebhook,
        url: this.callTriggerWebhook
      },
      webhooks: webhookStatus,
      overall
    };
  }
}

export const twilioService = TwilioService.getInstance();