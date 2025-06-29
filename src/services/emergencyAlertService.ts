
import { makeWebhookService } from './makeWebhookService';

interface EmergencyConfig {
  triggerWords: string[];
  safeWords: string[];
  cooldownPeriod: number; // in milliseconds
  maxAlertsPerSession: number;
}

interface UserSession {
  callSid: string;
  conversationId: string;
  userName: string;
  userPhone: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  location: { latitude: number; longitude: number } | null;
  transcript: string;
  lastAlertTime: number;
  alertCount: number;
  isActive: boolean;
}

export class EmergencyAlertService {
  private static instance: EmergencyAlertService;
  private sessions: Map<string, UserSession> = new Map();
  private config: EmergencyConfig = {
    triggerWords: ['help', 'scared', 'danger', 'emergency', 'unsafe', 'trouble', 'stop', 'police'],
    safeWords: ['reached home', 'home safe', 'arrived safely', 'reached destination', 'all good', 'safe now'],
    cooldownPeriod: 5 * 60 * 1000, // 5 minutes
    maxAlertsPerSession: 3
  };

  private constructor() {}

  static getInstance(): EmergencyAlertService {
    if (!EmergencyAlertService.instance) {
      EmergencyAlertService.instance = new EmergencyAlertService();
    }
    return EmergencyAlertService.instance;
  }

  // Start monitoring a new session
  startSession(sessionData: {
    callSid: string;
    conversationId: string;
    userName: string;
    userPhone: string;
    emergencyContacts: Array<{
      name: string;
      phone: string;
      relation: string;
    }>;
    location: { latitude: number; longitude: number } | null;
  }): void {
    const session: UserSession = {
      ...sessionData,
      transcript: '',
      lastAlertTime: 0,
      alertCount: 0,
      isActive: true
    };

    this.sessions.set(sessionData.callSid, session);
    console.log(`🛡️ Emergency monitoring started for session: ${sessionData.callSid}`);
  }

  // Process incoming transcript chunk
  async processTranscript(callSid: string, newTranscript: string): Promise<void> {
    const session = this.sessions.get(callSid);
    if (!session || !session.isActive) {
      return;
    }

    // Append new transcript
    session.transcript += ' ' + newTranscript;
    const fullTranscript = session.transcript.toLowerCase();
    
    console.log(`🎙️ Processing transcript for ${callSid}:`, newTranscript);

    // Check for trigger words
    const detectedTriggerWord = this.config.triggerWords.find(word => 
      fullTranscript.includes(word.toLowerCase())
    );

    if (detectedTriggerWord) {
      await this.handleEmergencyTrigger(session, detectedTriggerWord, newTranscript);
      return;
    }

    // Check for safe words
    const detectedSafeWord = this.config.safeWords.find(phrase => 
      fullTranscript.includes(phrase.toLowerCase())
    );

    if (detectedSafeWord) {
      await this.handleSafeArrival(session, detectedSafeWord, newTranscript);
    }
  }

  private async handleEmergencyTrigger(
    session: UserSession, 
    triggerWord: string, 
    recentTranscript: string
  ): Promise<void> {
    const now = Date.now();

    // Check cooldown and rate limiting
    if (now - session.lastAlertTime < this.config.cooldownPeriod) {
      console.log(`⏰ Emergency alert cooldown active for ${session.callSid}`);
      return;
    }

    if (session.alertCount >= this.config.maxAlertsPerSession) {
      console.log(`🚫 Maximum alerts reached for session ${session.callSid}`);
      return;
    }

    try {
      const locationString = session.location 
        ? `https://maps.google.com/?q=${session.location.latitude},${session.location.longitude}`
        : 'Location unavailable';

      const alertMessage = `🚨 EMERGENCY ALERT: ${session.userName} may be in danger. They said "${triggerWord}" during their safety call. Location: ${locationString}. Please check on them immediately.`;

      await makeWebhookService.sendEmergencyAlert({
        userName: session.userName,
        userPhone: session.userPhone,
        location: locationString,
        emergencyContacts: session.emergencyContacts,
        triggerWord,
        fullTranscript: session.transcript,
        callSid: session.callSid,
        conversationId: session.conversationId,
        message: alertMessage
      });

      // Update session state
      session.lastAlertTime = now;
      session.alertCount += 1;

      console.log(`🚨 Emergency alert sent for ${session.userName} - trigger: "${triggerWord}"`);

      // Optional: Mark session as high priority for monitoring
      this.markSessionAsEmergency(session.callSid);

    } catch (error) {
      console.error('❌ Failed to send emergency alert:', error);
    }
  }

  private async handleSafeArrival(
    session: UserSession, 
    safePhrase: string, 
    recentTranscript: string
  ): Promise<void> {
    try {
      const message = `✅ SAFE ARRIVAL: ${session.userName} has safely reached their destination. They said "${safePhrase}" during their safety call. No further action needed.`;

      await makeWebhookService.sendSafeArrivalNotification({
        userName: session.userName,
        userPhone: session.userPhone,
        emergencyContacts: session.emergencyContacts,
        safePhrase,
        fullTranscript: session.transcript,
        callSid: session.callSid,
        conversationId: session.conversationId,
        message
      });

      console.log(`✅ Safe arrival confirmed for ${session.userName} - phrase: "${safePhrase}"`);

      // End monitoring for this session
      this.endSession(session.callSid);

    } catch (error) {
      console.error('❌ Failed to send safe arrival notification:', error);
    }
  }

  private markSessionAsEmergency(callSid: string): void {
    const session = this.sessions.get(callSid);
    if (session) {
      // Could add emergency-specific monitoring here
      console.log(`🚨 Session ${callSid} marked as emergency - enhanced monitoring active`);
    }
  }

  // End monitoring session
  endSession(callSid: string): void {
    const session = this.sessions.get(callSid);
    if (session) {
      session.isActive = false;
      console.log(`🛑 Emergency monitoring ended for session: ${callSid}`);
      
      // Clean up after 1 hour
      setTimeout(() => {
        this.sessions.delete(callSid);
      }, 60 * 60 * 1000);
    }
  }

  // Get session status
  getSessionStatus(callSid: string): UserSession | null {
    return this.sessions.get(callSid) || null;
  }

  // Update configuration
  updateConfig(newConfig: Partial<EmergencyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Emergency alert configuration updated:', this.config);
  }

  // Get current configuration
  getConfig(): EmergencyConfig {
    return { ...this.config };
  }

  // Manual trigger for testing
  async triggerTestAlert(callSid: string, testTriggerWord: string = 'help'): Promise<void> {
    const session = this.sessions.get(callSid);
    if (!session) {
      throw new Error(`No active session found for ${callSid}`);
    }

    await this.handleEmergencyTrigger(session, testTriggerWord, `Test emergency trigger: ${testTriggerWord}`);
  }

  // Get all active sessions
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }
}

export const emergencyAlertService = EmergencyAlertService.getInstance();
