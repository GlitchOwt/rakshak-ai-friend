import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Shield, AlertTriangle, CheckCircle, Bot, Mic, TestTube, AlertCircle, ExternalLink, Webhook } from "lucide-react";
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
      console.log(`Call triggered via Make.com - SID: ${callSid}, Conversation: ${conversationId}`);
      setCallDuration(0);
      // Simulate connection after 10 seconds (time for Make.com to process and ElevenLabs to call)
      setTimeout(() => setIsConnected(true), 10000);
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

  // Check service status on mount
  useEffect(() => {
    setServiceStatus(twilioService.getServiceStatus());
  }, []);

  // Auto-start call when autoStart prop is true
  useEffect(() => {
    if (autoStart && !hasAutoStarted && !isCallActive && !isInitiating) {
      const servicesReady = serviceStatus.callTriggerWebhook;
      
      if (servicesReady) {
        setHasAutoStarted(true);
        startSafetyCall();
      }
    }
  }, [autoStart, hasAutoStarted, isCallActive, isInitiating, serviceStatus, startSafetyCall]);

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
        description: "Check the browser console for detailed test results. Your Make.com automation should have been triggered!",
        duration: 8000,
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      toast({
        title: "⚠️ Webhook Tests Completed with Issues",
        description: "Some webhook tests failed. Check the browser console for detailed error information.",
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

  if (!isCallActive && !isInitiating) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <Webhook className="h-8 w-8 mr-2" />
            <CardTitle className="text-2xl">AI Safety Companion</CardTitle>
          </div>
          <p className="opacity-90 text-sm">
            {autoStart ? 
              "Triggering your AI safety companion via Make.com automation..." :
              "Start a voice call with your AI safety companion via Make.com automation."
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
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.callTriggerWebhook)}`}></div>
                Make.com Webhook
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.emergencyAlert)}`}></div>
                Emergency Alerts
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.safeArrival)}`}></div>
                Safe Arrival
              </div>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(serviceStatus.elevenLabsConfigured)}`}></div>
                ElevenLabs (via Make)
              </div>
            </div>
          </div>

          {!autoStart && allServicesReady && (
            <Button 
              onClick={startSafetyCall}
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg w-full"
              disabled={isInitiating}
            >
              <Webhook className="h-5 w-5 mr-2" />
              {isInitiating ? 'Triggering Make.com...' : 'Start AI Safety Call'}
            </Button>
          )}

          {autoStart && !allServicesReady && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="font-semibold text-yellow-200">Waiting for Services</span>
              </div>
              <div className="text-xs text-yellow-100">
                <p>Checking Make.com webhook configuration...</p>
              </div>
            </div>
          )}

          {!allServicesReady && !autoStart && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="font-semibold text-yellow-200">Configuration Required</span>
              </div>
              <div className="text-xs text-yellow-100 space-y-1">
                {!serviceStatus.callTriggerWebhook && (
                  <p>• Make.com webhook URL needed for call triggering</p>
                )}
                {!serviceStatus.emergencyAlert && (
                  <p>• Emergency alert webhook URL required</p>
                )}
                {!serviceStatus.safeArrival && (
                  <p>• Safe arrival webhook URL required</p>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-white/10 rounded-lg p-4 text-sm space-y-2">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-4 w-4 mr-2" />
              <span className="font-semibold">How it works:</span>
            </div>
            <div className="space-y-1 text-xs opacity-90">
              <p>• Make.com automation triggers ElevenLabs to call your phone</p>
              <p>• AI agent will start a friendly conversation within 10-15 seconds</p>
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
                {isTestingWebhooks ? 'Testing Make.com Webhooks...' : 'Test Make.com Automation'}
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
          <h3 className="text-xl font-semibold mb-2">Triggering Make.com Automation</h3>
          <p className="opacity-90 mb-4">Make.com is processing your request and will trigger ElevenLabs to call you...</p>
          <div className="bg-white/10 rounded-lg p-3 text-sm space-y-1">
            <p>🔗 Make.com automation triggered</p>
            <p>🤖 ElevenLabs call will be initiated</p>
            <p>📞 Your phone should ring within 10-15 seconds</p>
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
            {isConnected ? 'AI Companion Active' : 'Waiting for Call...'}
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
              Make: {currentConversationId.slice(-6)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-sm">📞 Make.com automation triggered...</p>
            <p className="text-xs opacity-75 mt-1">Answer your phone when ElevenLabs calls</p>
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
          <p>🔗 <strong>Make.com</strong> triggered ElevenLabs automation</p>
          <p>🤖 <strong>ElevenLabs AI</strong> is calling and will chat with you</p>
          <p>🚨 Say <strong>"help"</strong> or <strong>"danger"</strong> for emergency alerts</p>
          <p>✅ Say <strong>"reached home safe"</strong> when you arrive</p>
          <p>💬 Speak naturally - the AI will keep you company!</p>
          <p>📱 <strong>Make.com</strong> handles all WhatsApp notifications</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwilioVoiceInterface;