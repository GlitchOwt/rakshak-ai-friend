import { makeWebhookService } from './makeWebhookService';

interface CallSession {
  callSid: string;
  userName: string;
  userPhone: string;
  location: { latitude: number; longitude: number } | null;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  conversationId: string;
  isActive: boolean;
  startTime: Date;
  transcripts: string[];
}

export class CallMonitoringService {
  private static instance: CallMonitoringService;
  private activeCalls: Map<string, CallSession> = new Map();
  
  // Trigger words for emergency detection
  private readonly triggerWords = [
    'help', 'danger', 'emergency', 'scared', 'unsafe', 'stop', 'police'
  ];
  
  // Safe arrival phrases
  private readonly safeArrivalPhrases = [
    'reached home', 'home safe', 'arrived safely', 'reached destination', 
    'safe now', 'all good', 'made it home', 'arrived safe'
  ];

  constructor() {
    // Private constructor for singleton
  }

  static getInstance(): CallMonitoringService {
    if (!CallMonitoringService.instance) {
      CallMonitoringService.instance = new CallMonitoringService();
    }
    return CallMonitoringService.instance;
  }

  registerCall(callData: {
    callSid: string;
    userName: string;
    userPhone: string;
    location: { latitude: number; longitude: number } | null;
    emergencyContacts: Array<{
      name: string;
      phone: string;
      relation: string;
    }>;
    conversationId: string;
  }): void {
    const session: CallSession = {
      ...callData,
      isActive: true,
      startTime: new Date(),
      transcripts: []
    };

    this.activeCalls.set(callData.callSid, session);
    console.log(`Call session registered: ${callData.callSid}`);
  }

  processTranscript(callSid: string, transcript: string): void {
    const session = this.activeCalls.get(callSid);
    if (!session) {
      console.warn(`No active session found for call: ${callSid}`);
      return;
    }

    // Add transcript to session
    session.transcripts.push(transcript);
    console.log(`Processing transcript for ${callSid}: "${transcript}"`);

    const lowerTranscript = transcript.toLowerCase();

    // Check for trigger words (emergency)
    const detectedTriggerWord = this.triggerWords.find(word => 
      lowerTranscript.includes(word)
    );

    if (detectedTriggerWord) {
      console.log(`🚨 TRIGGER WORD DETECTED: "${detectedTriggerWord}" in call ${callSid}`);
      this.handleEmergencyTrigger(session, detectedTriggerWord, transcript);
      
      // Dispatch custom event for UI
      window.dispatchEvent(new CustomEvent('emergencyTriggered', {
        detail: { triggerWord: detectedTriggerWord, callSid }
      }));
      return;
    }

    // Check for safe arrival phrases
    const detectedSafePhrase = this.safeArrivalPhrases.find(phrase => 
      lowerTranscript.includes(phrase)
    );

    if (detectedSafePhrase) {
      console.log(`✅ SAFE ARRIVAL DETECTED: "${detectedSafePhrase}" in call ${callSid}`);
      this.handleSafeArrival(session, detectedSafePhrase, transcript);
      
      // Dispatch custom event for UI
      window.dispatchEvent(new CustomEvent('safeArrival', {
        detail: { safePhrase: detectedSafePhrase, callSid }
      }));
      return;
    }
  }

  private async handleEmergencyTrigger(
    session: CallSession, 
    triggerWord: string, 
    fullTranscript: string
  ): Promise<void> {
    try {
      const locationString = session.location 
        ? `https://maps.google.com/?q=${session.location.latitude},${session.location.longitude}`
        : 'Location unavailable';

      await makeWebhookService.sendEmergencyAlert({
        userName: session.userName,
        userPhone: session.userPhone,
        location: locationString,
        emergencyContacts: session.emergencyContacts,
        triggerWord,
        fullTranscript,
        callSid: session.callSid,
        conversationId: session.conversationId,
        message: `🚨 EMERGENCY ALERT: ${session.userName} may be in danger. Trigger word: "${triggerWord}". Location: ${locationString}`
      });

      console.log(`✅ Emergency alert sent successfully for call ${session.callSid}`);
    } catch (error) {
      console.error(`❌ Failed to send emergency alert for call ${session.callSid}:`, error);
    }
  }

  private async handleSafeArrival(
    session: CallSession, 
    safePhrase: string, 
    fullTranscript: string
  ): Promise<void> {
    try {
      await makeWebhookService.sendSafeArrivalNotification({
        userName: session.userName,
        userPhone: session.userPhone,
        emergencyContacts: session.emergencyContacts,
        safePhrase,
        fullTranscript,
        callSid: session.callSid,
        conversationId: session.conversationId,
        message: `✅ ${session.userName} has safely reached her destination. Safe phrase: "${safePhrase}"`
      });

      console.log(`✅ Safe arrival notification sent for call ${session.callSid}`);
    } catch (error) {
      console.error(`❌ Failed to send safe arrival notification for call ${session.callSid}:`, error);
    }
  }

  endCall(callSid: string): void {
    const session = this.activeCalls.get(callSid);
    if (session) {
      session.isActive = false;
      this.activeCalls.delete(callSid);
      console.log(`Call session ended: ${callSid}`);
    }
  }

  getActiveCall(callSid: string): CallSession | undefined {
    return this.activeCalls.get(callSid);
  }

  getAllActiveCalls(): CallSession[] {
    return Array.from(this.activeCalls.values()).filter(session => session.isActive);
  }

  getCallTranscripts(callSid: string): string[] {
    const session = this.activeCalls.get(callSid);
    return session ? session.transcripts : [];
  }
}

export const callMonitoringService = CallMonitoringService.getInstance();