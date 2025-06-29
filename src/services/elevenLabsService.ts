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
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    this.agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
    this.phoneNumberId = import.meta.env.VITE_ELEVENLABS_PHONE_NUMBER_ID || '';
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
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured. Please set VITE_ELEVENLABS_API_KEY in your environment variables.');
      }

      if (!this.agentId) {
        throw new Error('ElevenLabs Agent ID not configured. Please set VITE_ELEVENLABS_AGENT_ID in your environment variables.');
      }

      if (!this.phoneNumberId) {
        throw new Error('ElevenLabs Phone Number ID not configured. Please set VITE_ELEVENLABS_PHONE_NUMBER_ID in your environment variables.');
      }

      console.log('🤖 Initiating ElevenLabs outbound call...', {
        agentId: this.agentId,
        phoneNumberId: this.phoneNumberId,
        targetPhone,
        userData
      });

      // Use the correct ElevenLabs Twilio outbound call API endpoint
      const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          agent_phone_number_id: this.phoneNumberId,
          to_number: targetPhone,
          // Optional: Add custom variables for the conversation
          custom_llm_extra_body: {
            user_name: userData.name,
            user_location: userData.location ? 
              `${userData.location.latitude},${userData.location.longitude}` : 
              'unknown'
          }
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
          errorMessage += '. Invalid API key. Please check your VITE_ELEVENLABS_API_KEY.';
        } else if (response.status === 404) {
          errorMessage += '. Agent or phone number not found. Please check your VITE_ELEVENLABS_AGENT_ID and VITE_ELEVENLABS_PHONE_NUMBER_ID.';
        } else if (response.status === 400) {
          errorMessage += '. Invalid request. Please check the phone number format and agent configuration.';
        } else if (response.status === 422) {
          errorMessage += '. Invalid request format. Please check the agent and phone number configuration.';
        }
        
        errorMessage += ` Response: ${responseText}`;
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Failed to parse ElevenLabs response: ${responseText}`);
      }

      const conversationId = data.conversation_id;

      if (!conversationId) {
        throw new Error(`No conversation ID returned from ElevenLabs. Response: ${JSON.stringify(data)}`);
      }

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

      if (!this.apiKey) {
        console.warn('ElevenLabs API key not configured, cannot end conversation');
        return;
      }

      // End the conversation
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to end ElevenLabs conversation: ${response.status} ${response.statusText}`);
      }

      session.isActive = false;
      this.activeSessions.delete(conversationId);
      console.log(`✅ ElevenLabs conversation ended: ${conversationId}`);
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

  // Get conversation status
  async getConversationStatus(conversationId: string): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversation status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get conversation status:', error);
      throw error;
    }
  }

  // Test the outbound call functionality
  async testOutboundCall(): Promise<string> {
    const targetPhone = import.meta.env.VITE_TARGET_PHONE_NUMBER || '+918788293663';
    
    return await this.initiateOutboundCall(targetPhone, {
      name: 'Test User',
      location: { latitude: 40.7128, longitude: -74.0060 }
    });
  }

  // Create a simple conversation (for testing without outbound call)
  async createSimpleConversation(): Promise<string> {
    try {
      if (!this.apiKey || !this.agentId) {
        throw new Error('ElevenLabs API key and Agent ID are required');
      }

      const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.conversation_id;
    } catch (error) {
      console.error('Failed to create simple conversation:', error);
      throw error;
    }
  }
}

export const elevenLabsService = ElevenLabsService.getInstance();