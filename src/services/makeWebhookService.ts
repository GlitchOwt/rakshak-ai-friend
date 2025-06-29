interface WebhookPayload {
  action: string;
  [key: string]: any;
}

interface CallInitiationPayload extends WebhookPayload {
  action: 'call_initiated';
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
  conversationId: string;
  method: string;
  timestamp: string;
}

interface EmergencyAlertPayload extends WebhookPayload {
  action: 'emergency_alert';
  userName: string;
  userPhone: string;
  location: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  triggerWord: string;
  fullTranscript: string;
  callSid: string;
  conversationId: string;
  timestamp: string;
  message: string;
}

interface SafeArrivalPayload extends WebhookPayload {
  action: 'safe_arrival';
  userName: string;
  userPhone: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  safePhrase: string;
  fullTranscript: string;
  callSid: string;
  conversationId: string;
  timestamp: string;
  message: string;
}

export class MakeWebhookService {
  private static instance: MakeWebhookService;
  
  private readonly webhookUrls = {
    triggerCall: import.meta.env.VITE_TRIGGER_CALL_WEBHOOK_URL,
    emergencyAlert: import.meta.env.VITE_EMERGENCY_ALERT_WEBHOOK_URL,
    safeArrival: import.meta.env.VITE_SAFE_ARRIVAL_WEBHOOK_URL,
  };

  constructor() {
    this.validateWebhookUrls();
  }

  static getInstance(): MakeWebhookService {
    if (!MakeWebhookService.instance) {
      MakeWebhookService.instance = new MakeWebhookService();
    }
    return MakeWebhookService.instance;
  }

  private validateWebhookUrls(): void {
    const missing = Object.entries(this.webhookUrls)
      .filter(([_, url]) => !url)
      .map(([key, _]) => key);

    if (missing.length > 0) {
      console.warn(`Missing webhook URLs: ${missing.join(', ')}`);
    }
  }

  private async parseWebhookResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    const responseText = await response.text();
    
    console.log(`Webhook response (${response.status}):`, {
      contentType,
      body: responseText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Handle different response types
    if (contentType?.includes('application/json')) {
      try {
        return JSON.parse(responseText);
      } catch (error) {
        console.warn('Failed to parse JSON response:', responseText);
        return { status: 'success', rawResponse: responseText };
      }
    } else {
      // Handle plain text responses (like "Accepted")
      if (responseText.toLowerCase().includes('accepted') || 
          responseText.toLowerCase().includes('success') ||
          response.ok) {
        return { 
          status: 'success', 
          message: responseText,
          rawResponse: responseText 
        };
      } else {
        return { 
          status: 'error', 
          message: responseText,
          rawResponse: responseText 
        };
      }
    }
  }

  async logCallInitiation(data: Omit<CallInitiationPayload, 'action' | 'timestamp'>): Promise<void> {
    const payload: CallInitiationPayload = {
      ...data,
      action: 'call_initiated',
      timestamp: new Date().toISOString(),
    };

    try {
      console.log('📞 Logging call initiation to Make.com...', payload);
      
      if (!this.webhookUrls.triggerCall) {
        console.warn('Call trigger webhook URL not configured, skipping logging');
        return;
      }

      const response = await fetch(this.webhookUrls.triggerCall, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await this.parseWebhookResponse(response);

      if (!response.ok) {
        console.warn(`Call initiation logging failed: ${response.status} ${response.statusText}. Response: ${JSON.stringify(result)}`);
      } else {
        console.log('✅ Call initiation logged successfully:', result);
      }
    } catch (error) {
      console.warn('Failed to log call initiation:', error);
      // Don't throw error for logging failures
    }
  }

  async sendEmergencyAlert(data: Omit<EmergencyAlertPayload, 'action' | 'timestamp'>): Promise<void> {
    const payload: EmergencyAlertPayload = {
      ...data,
      action: 'emergency_alert',
      timestamp: new Date().toISOString(),
    };

    try {
      console.log('🚨 Sending emergency alert via Make.com...', payload);
      
      if (!this.webhookUrls.emergencyAlert) {
        throw new Error('Emergency alert webhook URL not configured. Please set VITE_EMERGENCY_ALERT_WEBHOOK_URL in your environment variables.');
      }
      
      const response = await fetch(this.webhookUrls.emergencyAlert, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await this.parseWebhookResponse(response);

      if (!response.ok) {
        throw new Error(`Emergency alert webhook failed: ${response.status} ${response.statusText}. Response: ${JSON.stringify(result)}`);
      }

      console.log('✅ Emergency alert sent successfully:', result);
    } catch (error) {
      console.error('❌ Failed to send emergency alert:', error);
      throw error;
    }
  }

  async sendSafeArrivalNotification(data: Omit<SafeArrivalPayload, 'action' | 'timestamp'>): Promise<void> {
    const payload: SafeArrivalPayload = {
      ...data,
      action: 'safe_arrival',
      timestamp: new Date().toISOString(),
    };

    try {
      console.log('✅ Sending safe arrival notification via Make.com...', payload);
      
      if (!this.webhookUrls.safeArrival) {
        throw new Error('Safe arrival webhook URL not configured. Please set VITE_SAFE_ARRIVAL_WEBHOOK_URL in your environment variables.');
      }
      
      const response = await fetch(this.webhookUrls.safeArrival, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await this.parseWebhookResponse(response);

      if (!response.ok) {
        throw new Error(`Safe arrival webhook failed: ${response.status} ${response.statusText}. Response: ${JSON.stringify(result)}`);
      }

      console.log('✅ Safe arrival notification sent successfully:', result);
    } catch (error) {
      console.error('❌ Failed to send safe arrival notification:', error);
      throw error;
    }
  }

  // Test methods for development
  async testEmergencyAlert(): Promise<void> {
    const testData = {
      userName: 'Test User',
      userPhone: '+918788293663',
      location: 'https://maps.google.com/?q=40.7128,-74.0060',
      emergencyContacts: [
        { name: 'Emergency Contact', phone: '+1234567891', relation: 'friend' }
      ],
      triggerWord: 'help',
      fullTranscript: 'I need help, this is a test emergency',
      callSid: 'test_call_123',
      conversationId: 'test_conv_123',
      message: '🚨 TEST EMERGENCY ALERT: Test User may be in danger...',
    };

    try {
      await this.sendEmergencyAlert(testData);
      console.log('✅ Emergency alert webhook test passed');
    } catch (error) {
      console.error('❌ Emergency alert webhook test failed:', error);
      throw error;
    }
  }

  async testSafeArrival(): Promise<void> {
    const testData = {
      userName: 'Test User',
      userPhone: '+918788293663',
      emergencyContacts: [
        { name: 'Emergency Contact', phone: '+1234567891', relation: 'friend' }
      ],
      safePhrase: 'reached home safe',
      fullTranscript: 'I reached home safe, everything is good',
      callSid: 'test_call_123',
      conversationId: 'test_conv_123',
      message: '✅ TEST: Test User has safely reached her destination...',
    };

    try {
      await this.sendSafeArrivalNotification(testData);
      console.log('✅ Safe arrival webhook test passed');
    } catch (error) {
      console.error('❌ Safe arrival webhook test failed:', error);
      throw error;
    }
  }

  // Get webhook status
  getWebhookStatus(): { [key: string]: boolean } {
    return {
      emergencyAlert: !!this.webhookUrls.emergencyAlert,
      safeArrival: !!this.webhookUrls.safeArrival,
    };
  }
}

export const makeWebhookService = MakeWebhookService.getInstance();