interface ConversationSession {
  conversationId: string;
  agentId: string;
  callSid?: string;
  isActive: boolean;
  startTime: Date;
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private apiKey: string;
  private agentId: string;
  private activeSessions: Map<string, ConversationSession> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    this.agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
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

  async createConversationSession(callSid: string, userData: {
    name: string;
    location?: { latitude: number; longitude: number } | null;
  }): Promise<string> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          call_sid: callSid,
          user_data: {
            name: userData.name,
            location: userData.location ? 
              `${userData.location.latitude},${userData.location.longitude}` : 
              'unknown'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      const conversationId = data.conversation_id;

      // Store session
      this.activeSessions.set(conversationId, {
        conversationId,
        agentId: this.agentId,
        callSid,
        isActive: true,
        startTime: new Date()
      });

      console.log(`ElevenLabs conversation created: ${conversationId}`);
      return conversationId;
    } catch (error) {
      console.error('Failed to create ElevenLabs conversation:', error);
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

      await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      session.isActive = false;
      console.log(`ElevenLabs conversation ended: ${conversationId}`);
    } catch (error) {
      console.error('Failed to end ElevenLabs conversation:', error);
    }
  }

  getActiveSession(conversationId: string): ConversationSession | undefined {
    return this.activeSessions.get(conversationId);
  }

  getAllActiveSessions(): ConversationSession[] {
    return Array.from(this.activeSessions.values()).filter(session => session.isActive);
  }

  // Generate TwiML for connecting call to ElevenLabs
  generateTwiML(conversationId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! This is your AI safety companion from Rakshak. I'll be chatting with you during your journey to keep you company and ensure you're safe.</Say>
    <Connect>
        <Stream url="wss://api.elevenlabs.io/v1/convai/conversations/${conversationId}/stream">
            <Parameter name="agent_id" value="${this.agentId}"/>
            <Parameter name="conversation_id" value="${conversationId}"/>
        </Stream>
    </Connect>
</Response>`;
  }
}

export const elevenLabsService = ElevenLabsService.getInstance();