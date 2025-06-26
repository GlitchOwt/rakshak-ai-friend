
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { useToast } from "@/hooks/use-toast";

interface VoiceCallInterfaceProps {
  agentId?: string;
  onTriggerWordDetected: () => void;
  onSafeArrival: () => void;
  onCallEnd: () => void;
}

const VoiceCallInterface = ({ 
  agentId = "default-agent-id", 
  onTriggerWordDetected, 
  onSafeArrival,
  onCallEnd 
}: VoiceCallInterfaceProps) => {
  const { toast } = useToast();
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const { 
    isCallActive, 
    startConversation, 
    endConversation, 
    setVolume: setCallVolume,
    isSpeaking,
    status 
  } = useVoiceConversation({
    onTriggerWordDetected,
    onSafeArrival
  });

  const handleStartCall = async () => {
    try {
      await startConversation(agentId);
    } catch (error) {
      toast({
        title: "Call Failed",
        description: "Unable to start your AI companion. Please check your internet connection.",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = async () => {
    await endConversation();
    onCallEnd();
  };

  const handleVolumeToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setCallVolume({ volume: newMuted ? 0 : volume });
  };

  if (!isCallActive) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6 text-center">
          <Phone className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start AI Companion</h3>
          <p className="mb-4 opacity-90">
            Your AI safety companion will start a friendly conversation to keep you company
          </p>
          <Button 
            onClick={handleStartCall}
            className="bg-white text-purple-600 hover:bg-gray-100"
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Connecting...' : 'Start Call'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-teal-500 text-white">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className={`w-4 h-4 rounded-full mr-2 ${isSpeaking ? 'bg-yellow-300 animate-pulse' : 'bg-green-300'}`}></div>
            <h3 className="text-xl font-semibold">
              {isSpeaking ? 'AI is speaking...' : 'AI is listening'}
            </h3>
          </div>
          <p className="opacity-90">Your safety companion is active</p>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleVolumeToggle}
            variant="outline"
            size="icon"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={handleEndCall}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 px-6"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        </div>

        {!isMuted && (
          <div className="mt-4">
            <label className="text-sm opacity-75 block mb-2">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolume(newVolume);
                setCallVolume({ volume: newVolume });
              }}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceCallInterface;
