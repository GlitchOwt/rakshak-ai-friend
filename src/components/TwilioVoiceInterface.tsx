import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Shield, AlertTriangle, CheckCircle, Bot, Mic, TestTube, AlertCircle } from "lucide-react";
import { useTwilioVoiceCall } from "@/hooks/useTwilioVoiceCall";
import { useToast } from "@/hooks/use-toast";
import { twilioService } from "@/services/twilioService";

interface TwilioVoiceInterfaceProps {
  autoStart?: boolean;
  onEmergencyTriggered?: () => void;
  onSafeArrival?: () => void;
  onCallEnd?: () => void;
}

const TwilioVoiceInterface = ({ 
  autoStart = false,
  onEmergencyTriggered, 
  onSafeArrival,
  onCallEnd 
}: TwilioVoiceInterfaceProps) => {
  const { toast } = useToast();
  const [callDuration, setCallDuration] = useState(0);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [safeArrivalConfirmed, setSafeArrivalConfirmed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<{ [key: string]: boolean }>({});
  const [isTestingWebhooks, setIsTestingWebhooks] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

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
      setHasAutoStarted(false);
      onCallEnd?.();
    },
    onEmergencyTriggered: (triggerWord) => {
      setEmergencyTriggered(true);
      onEmergencyTriggered?.();
      toast({
        title: "🚨 Emergency Alert Sent",
        description: `Trigger word "${triggerWord}" detected. Emergency contacts have been notified with your location via Make.com automation.`,
        variant: "destructive",
        duration: 10000,
      });
    },
    onSafeArrival: (safeWord) => {
      setSafeArrivalConfirmed(true);
      onSafeArrival?.();
      toast({
        title: "✅ Safe Arrival Confirmed",
        description: `Safe word "${safeWord}" detected. Your emergency contacts have been notified you're safe via Make.com automation.`,
        duration: 8000,
      });
    }
  });

  // Auto-start call when autoStart prop is true
  useEffect(() => {
    if (autoStart && !hasAutoStarted && !isCallActive && !isInitiating) {
      const criticalServicesReady = serviceStatus.elevenLabsConfigured && serviceStatus.triggerCall;
      
      if (criticalServicesReady) {
        setHasAutoStarted(true);
        startSafetyCall();
      } else {
        // If services aren't ready, check again in 1 second
        const timer = setTimeout(() => {
          setServiceStatus(twilioService.getServiceStatus());
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [autoStart, hasAutoStarted, isCallActive, isInitiating, serviceStatus, startSafetyCall]);

  // Check service status on mount
  useEffect(() => {
    setServiceStatus(twilioService.getServiceStatus());
  }, []);

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

  const handleTestWebhooks = async () => {
    setIsTestingWebhooks(true);
    try {
      await twilioService.testWebhooks();
      toast({
        title: "🧪 Webhook Tests Completed",
        description: "Check the browser console for detailed test results. Some tests may have failed - this is normal if Make.com scenarios aren't fully configured.",
        duration: 8000,
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      toast({
        title: "⚠️ Webhook Tests Completed with Issues",
        description: "Some webhook tests failed. Check the browser console for detailed error information. This is expected if Make.com scenarios aren't configured yet.",
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsTestingWebhooks(false);
    }
  };

  // Service status indicator
  const getStatusColor = (status: boolean) => status ? 'bg-green-500' : 'bg-red-500';
  const allServicesReady = Object.values(serviceStatus).every(status => status);
  const criticalServicesReady = serviceStatus.elevenLabsConfigured && serviceStatus.triggerCall;

  if (!isCallActive && !isInitiating) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <Bot className="h-8 w-8 mr-2" />
            <CardTitle className="text-2xl">AI Safety Companion</CardTitle>
          </div>
          <p className="opacity-90 text-sm">
            {autoStart ? 
              "Your AI safety companion is starting automatically..." :
              "Start a voice call with your AI safety companion powered by ElevenLabs."
            }
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* Service Status */}
          <div className="bg-white/10 rounded-lg p-3 text-xs">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-4 w-4 mr-2" />
              <span className="font-semibold">Service Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.elevenLabsConfigured)}`}></div>
                ElevenLabs
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.twilioConfigured)}`}></div>
                Twilio
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.triggerCall)}`}></div>
                Call Trigger
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.emergencyAlert)}`}></div>
                Emergency
              </div>
            </div>
          </div>

          {!autoStart && (
            <Button 
              onClick={startSafetyCall}
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg w-full"
              disabled={isInitiating || !criticalServicesReady}
            >
              <Phone className="h-5 w-5 mr-2" />
              {isInitiating ? 'Connecting to AI...' : 'Start AI Safety Call'}
            </Button>
          )}

          {autoStart && !criticalServicesReady && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="font-semibold text-yellow-200">Waiting for Services</span>
              </div>
              <div className="text-xs text-yellow-100">
                <p>Checking service configuration...</p>
              </div>
            </div>
          )}

          {!criticalServicesReady && !autoStart && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="font-semibold text-yellow-200">Configuration Required</span>
              </div>
              <div className="text-xs text-yellow-100 space-y-1">
                {!serviceStatus.elevenLabsConfigured && (
                  <p>• ElevenLabs API key and Agent ID needed</p>
                )}
                {!serviceStatus.triggerCall && (
                  <p>• Make.com call trigger webhook URL required</p>
                )}
                <p className="mt-2 opacity-75">Check your environment variables (.env file)</p>
              </div>
            </div>
          )}
          
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
              <p>• Emergency contacts will be automatically notified via WhatsApp</p>
            </div>
          </div>

          {/* Development Test Buttons */}
          {process.env.NODE_ENV === 'development' && !autoStart && (
            <div className="space-y-2">
              <Button
                onClick={handleTestWebhooks}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 w-full"
                disabled={isTestingWebhooks}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingWebhooks ? 'Testing Webhooks...' : 'Test Make.com Webhooks'}
              </Button>
            </div>
          )}
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
          <p className="opacity-90 mb-4">Setting up ElevenLabs conversation and triggering Twilio call via Make.com...</p>
          <div className="bg-white/10 rounded-lg p-3 text-sm space-y-1">
            <p>📞 Your phone should ring any moment...</p>
            <p>🤖 ElevenLabs agent is ready to chat</p>
            <p>🔗 Make.com automation is processing</p>
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
          <p>🔗 <strong>Make.com</strong> handles all WhatsApp notifications</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwilioVoiceInterface;