import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Shield, AlertTriangle, CheckCircle, Bot, Mic } from "lucide-react";
import { useTwilioVoiceCall } from "@/hooks/useTwilioVoiceCall";
import { useToast } from "@/hooks/use-toast";

interface TwilioVoiceInterfaceProps {
  onEmergencyTriggered?: () => void;
  onSafeArrival?: () => void;
  onCallEnd?: () => void;
}

const TwilioVoiceInterface = ({ 
  onEmergencyTriggered, 
  onSafeArrival,
  onCallEnd 
}: TwilioVoiceInterfaceProps) => {
  const { toast } = useToast();
  const [callDuration, setCallDuration] = useState(0);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [safeArrivalConfirmed, setSafeArrivalConfirmed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const { 
    isCallActive, 
    currentCallSid, 
    currentConversationId,
    isInitiating,
    startSafetyCall, 
    endCall,
    simulateTranscriptProcessing 
  } = useTwilioVoiceCall({
    onCallStarted: (callSid, conversationId) => {
      console.log(`Call started - SID: ${callSid}, Conversation: ${conversationId}`);
      setCallDuration(0);
      // Simulate connection after 5 seconds
      setTimeout(() => setIsConnected(true), 5000);
    },
    onCallEnded: () => {
      setCallDuration(0);
      setEmergencyTriggered(false);
      setSafeArrivalConfirmed(false);
      setIsConnected(false);
      onCallEnd?.();
    },
    onEmergencyTriggered: (triggerWord) => {
      setEmergencyTriggered(true);
      onEmergencyTriggered?.();
      toast({
        title: "🚨 Emergency Alert Sent",
        description: `Trigger word "${triggerWord}" detected. Emergency contacts have been notified with your location.`,
        variant: "destructive",
        duration: 10000,
      });
    },
    onSafeArrival: (safeWord) => {
      setSafeArrivalConfirmed(true);
      onSafeArrival?.();
      toast({
        title: "✅ Safe Arrival Confirmed",
        description: `Safe word "${safeWord}" detected. Your emergency contacts have been notified you're safe.`,
        duration: 8000,
      });
    }
  });

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive && isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, isConnected]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestTriggerWord = () => {
    // For testing purposes - simulate trigger word detection
    simulateTranscriptProcessing("I need help, this is dangerous");
  };

  const handleTestSafeWord = () => {
    // For testing purposes - simulate safe word detection
    simulateTranscriptProcessing("I reached home safe");
  };

  if (!isCallActive && !isInitiating) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <Bot className="h-8 w-8 mr-2" />
            <CardTitle className="text-2xl">AI Safety Companion</CardTitle>
          </div>
          <p className="opacity-90 text-sm">
            Start a voice call with your AI safety companion powered by ElevenLabs. 
            The AI will chat with you naturally and monitor for emergency situations.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button 
            onClick={startSafetyCall}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg w-full"
            disabled={isInitiating}
          >
            <Phone className="h-5 w-5 mr-2" />
            {isInitiating ? 'Connecting to AI...' : 'Start AI Safety Call'}
          </Button>
          
          <div className="bg-white/10 rounded-lg p-4 text-sm space-y-2">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-4 w-4 mr-2" />
              <span className="font-semibold">How it works:</span>
            </div>
            <div className="space-y-1 text-xs opacity-90">
              <p>• Your phone will ring within 10 seconds</p>
              <p>• ElevenLabs AI will start a friendly conversation</p>
              <p>• Say "help" or "danger" if you need emergency assistance</p>
              <p>• Say "reached home safe" when you arrive safely</p>
              <p>• Emergency contacts will be automatically notified</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isInitiating) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Connecting to AI Companion</h3>
          <p className="opacity-90 mb-4">Setting up ElevenLabs conversation...</p>
          <div className="bg-white/10 rounded-lg p-3 text-sm">
            <p>Your phone should ring any moment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-teal-500 text-white">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-3">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-300 animate-pulse' : 'bg-yellow-300 animate-pulse'}`}></div>
          <CardTitle className="text-xl">
            {isConnected ? 'AI Companion Active' : 'Connecting...'}
          </CardTitle>
        </div>
        <div className="flex justify-center space-x-2 flex-wrap">
          {isConnected && (
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Mic className="h-3 w-3 mr-1" />
              {formatDuration(callDuration)}
            </Badge>
          )}
          {currentCallSid && (
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              Call: {currentCallSid.slice(-6)}
            </Badge>
          )}
          {currentConversationId && (
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              AI: {currentConversationId.slice(-6)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-sm">📞 Waiting for call connection...</p>
            <p className="text-xs opacity-75 mt-1">Answer your phone to start talking with AI</p>
          </div>
        )}

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg ${emergencyTriggered ? 'bg-red-500/30' : 'bg-white/10'}`}>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm">Emergency</span>
            </div>
            <p className="text-xs opacity-75 mt-1">
              {emergencyTriggered ? 'Alert Sent!' : 'Monitoring...'}
            </p>
          </div>
          
          <div className={`p-3 rounded-lg ${safeArrivalConfirmed ? 'bg-green-500/30' : 'bg-white/10'}`}>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Safe Arrival</span>
            </div>
            <p className="text-xs opacity-75 mt-1">
              {safeArrivalConfirmed ? 'Confirmed!' : 'Listening...'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={endCall}
            variant="destructive"
            className="w-full bg-red-500 hover:bg-red-600 py-3"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End AI Safety Call
          </Button>
          
          {/* Test Buttons (for development) */}
          {process.env.NODE_ENV === 'development' && isConnected && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleTestTriggerWord}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Test Emergency
              </Button>
              <Button
                onClick={handleTestSafeWord}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Test Safe Word
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs opacity-75 text-center space-y-1 bg-white/5 rounded-lg p-3">
          <p>🤖 <strong>ElevenLabs AI</strong> is listening and chatting with you</p>
          <p>🚨 Say <strong>"help"</strong> or <strong>"danger"</strong> for emergency alerts</p>
          <p>✅ Say <strong>"reached home safe"</strong> when you arrive</p>
          <p>💬 Speak naturally - the AI will keep you company!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwilioVoiceInterface;