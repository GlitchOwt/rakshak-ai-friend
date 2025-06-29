interface ConversationSession {
  conversationId: string;
  agentId: string;
  phoneNumberId: string;
  targetPhone: string;
  isActive: boolean;
  startTime: Date;
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private apiKey: string;
  private agentId: string;
  private phoneNumberId: string;
  private activeSessions: Map<string, ConversationSession> = new Map();

  constructor() {
    this.apiKey = 'sk_79f1280e3a472f43b502191436d1b08d6a2bf839e1508e01';
    this.agentId = 'agent_01jyr8s453eq2ad62stq1ntew8';
    this.phoneNumberId = 'phnum_01jyxfy5bhfra81edb674mse3w';
  }

  static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  getAgentId(): string {
    return this.agentId;
  }

  getPhoneNumberId(): string {
    return this.phoneNumberId;
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.agentId && this.phoneNumberId);
  }

  async initiateOutboundCall(targetPhone: string, userData: {
    name: string;
    location?: { latitude: number; longitude: number } | null;
  }): Promise<string> {
    try {
      console.log('🤖 Initiating ElevenLabs outbound call...', {
        agentId: this.agentId,
        phoneNumberId: this.phoneNumberId,
        targetPhone,
        userData
      });

      // Use the exact format from the curl command you provided
      const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          agent_phone_number_id: this.phoneNumberId,
          to_number: targetPhone
        }),
      });

      const responseText = await response.text();
      console.log('ElevenLabs outbound call API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      if (!response.ok) {
        let errorMessage = `ElevenLabs outbound call API error: ${response.status} ${response.statusText}`;
        
        if (response.status === 401) {
          errorMessage += '. Invalid API key.';
        } else if (response.status === 403) {
          errorMessage += '. Voice calling may be disabled for this account or insufficient permissions.';
        } else if (response.status === 404) {
          errorMessage += '. Agent or phone number not found.';
        } else if (response.status === 400) {
          errorMessage += '. Invalid request format or phone number.';
        } else if (response.status === 422) {
          errorMessage += '. Invalid request parameters.';
        }
        
        errorMessage += ` Response: ${responseText}`;
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // If response is not JSON, create a mock conversation ID
        console.warn('Non-JSON response from ElevenLabs, creating mock conversation ID');
        const conversationId = `el_outbound_${Date.now()}`;
        
        // Store session
        this.activeSessions.set(conversationId, {
          conversationId,
          agentId: this.agentId,
          phoneNumberId: this.phoneNumberId,
          targetPhone,
          isActive: true,
          startTime: new Date()
        });

        console.log(`✅ ElevenLabs outbound call initiated (mock ID): ${conversationId}`);
        return conversationId;
      }

      const conversationId = data.conversation_id || `el_outbound_${Date.now()}`;

      // Store session
      this.activeSessions.set(conversationId, {
        conversationId,
        agentId: this.agentId,
        phoneNumberId: this.phoneNumberId,
        targetPhone,
        isActive: true,
        startTime: new Date()
      });

      console.log(`✅ ElevenLabs outbound call initiated: ${conversationId}`);
      return conversationId;
    } catch (error) {
      console.error('❌ Failed to initiate ElevenLabs outbound call:', error);
      throw error;
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(conversationId);
      if (!session) {
        console.warn(`No active session found: ${conversationId}`);
        return;
      }

      // For outbound calls, we might not have a direct way to end them
      // The call will end naturally when the user hangs up
      session.isActive = false;
      this.activeSessions.delete(conversationId);
      console.log(`✅ ElevenLabs conversation session ended: ${conversationId}`);
    } catch (error) {
      console.error('❌ Failed to end ElevenLabs conversation:', error);
    }
  }

  getActiveSession(conversationId: string): ConversationSession | undefined {
    return this.activeSessions.get(conversationId);
  }

  getAllActiveSessions(): ConversationSession[] {
    return Array.from(this.activeSessions.values()).filter(session => session.isActive);
  }

  // Test the outbound call functionality with the hardcoded phone number
  async testOutboundCall(): Promise<string> {
    const targetPhone = '+918788293663'; // The phone number from your example
    
    return await this.initiateOutboundCall(targetPhone, {
      name: 'Test User',
      location: { latitude: 40.7128, longitude: -74.0060 }
    });
  }
}

export const elevenLabsService = ElevenLabsService.getInstance();