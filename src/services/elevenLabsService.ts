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
    // Updated with your new credentials
    this.apiKey = 'sk_d68f8c8c8e655648ae78055611a31f2c16290a7a490970f1';
    this.agentId = 'agent_01jyc7qxw6esd8br6t2j1bkxjk';
    this.phoneNumberId = 'phnum_01jyca45f1ffh8554a51pga36b';
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

  async checkAccountStatus(): Promise<{
    hasOutboundCalling: boolean;
    accountType: string;
    error?: string;
  }> {
    try {
      // First, let's check if the agent exists and is accessible
      const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${this.agentId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!agentResponse.ok) {
        return {
          hasOutboundCalling: false,
          accountType: 'unknown',
          error: `Agent not accessible: ${agentResponse.status} ${agentResponse.statusText}`
        };
      }

      // Try to get account info
      const accountResponse = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        console.log('ElevenLabs account info:', accountData);
        
        return {
          hasOutboundCalling: accountData.subscription?.tier !== 'free',
          accountType: accountData.subscription?.tier || 'free',
          error: accountData.subscription?.tier === 'free' ? 
            'Outbound calling requires a paid ElevenLabs subscription' : undefined
        };
      }

      return {
        hasOutboundCalling: false,
        accountType: 'unknown',
        error: 'Could not determine account status'
      };
    } catch (error) {
      return {
        hasOutboundCalling: false,
        accountType: 'unknown',
        error: `Account check failed: ${error}`
      };
    }
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

      // First check account status
      const accountStatus = await this.checkAccountStatus();
      console.log('ElevenLabs account status:', accountStatus);

      if (!accountStatus.hasOutboundCalling) {
        console.warn('⚠️ ElevenLabs outbound calling not available:', accountStatus.error);
        
        // Create a mock conversation ID for testing
        const conversationId = `mock_outbound_${Date.now()}`;
        
        this.activeSessions.set(conversationId, {
          conversationId,
          agentId: this.agentId,
          phoneNumberId: this.phoneNumberId,
          targetPhone,
          isActive: true,
          startTime: new Date()
        });

        // Show helpful error message
        throw new Error(`ElevenLabs outbound calling is not available for your account. ${accountStatus.error || 'Please upgrade to a paid plan to enable voice calling.'}`);
      }

      // Use the exact format from your curl command
      const requestPayload = {
        agent_id: this.agentId,
        agent_phone_number_id: this.phoneNumberId,
        to_number: targetPhone
      };

      console.log('📞 Making ElevenLabs outbound call request:', requestPayload);

      const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await response.text();
      console.log('ElevenLabs outbound call API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      if (!response.ok) {
        let errorMessage = `ElevenLabs outbound call failed: ${response.status} ${response.statusText}`;
        
        if (response.status === 401) {
          errorMessage = 'Invalid ElevenLabs API key. Please check your credentials.';
        } else if (response.status === 403) {
          errorMessage = 'Voice calling is disabled for your ElevenLabs account. Please upgrade to a paid plan to enable outbound calling.';
        } else if (response.status === 404) {
          errorMessage = 'ElevenLabs agent or phone number not found. Please check your agent ID and phone number ID.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid request format or phone number. Please check the phone number format.';
        } else if (response.status === 422) {
          errorMessage = 'Invalid request parameters. Please check your agent configuration.';
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

  // Test the outbound call functionality with your phone number
  async testOutboundCall(): Promise<string> {
    const targetPhone = '+918788293663'; // Your phone number
    
    return await this.initiateOutboundCall(targetPhone, {
      name: 'Test User',
      location: { latitude: 40.7128, longitude: -74.0060 }
    });
  }

  // Get detailed service status
  async getDetailedStatus(): Promise<{
    configured: boolean;
    accountStatus: any;
    recommendations: string[];
  }> {
    const accountStatus = await this.checkAccountStatus();
    const recommendations: string[] = [];

    if (!accountStatus.hasOutboundCalling) {
      recommendations.push('Upgrade to a paid ElevenLabs plan to enable outbound calling');
      recommendations.push('Alternatively, use the ElevenLabs web interface for testing: https://elevenlabs.io/app/talk-to?agent_id=' + this.agentId);
    }

    if (accountStatus.error) {
      recommendations.push('Check your ElevenLabs API key and agent configuration');
    }

    return {
      configured: this.isConfigured(),
      accountStatus,
      recommendations
    };
  }
}

export const elevenLabsService = ElevenLabsService.getInstance();