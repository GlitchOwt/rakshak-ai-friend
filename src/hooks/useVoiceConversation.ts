
import { useConversation } from '@11labs/react';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';

interface VoiceConversationConfig {
  onTriggerWordDetected?: () => void;
  onSafeArrival?: () => void;
}

export const useVoiceConversation = (config?: VoiceConversationConfig) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice conversation connected');
      setIsCallActive(true);
      toast({
        title: "AI Companion Connected",
        description: "Your safety companion is now listening and ready to chat.",
      });
    },
    onDisconnect: () => {
      console.log('Voice conversation disconnected');
      setIsCallActive(false);
      setConversationId(null);
      toast({
        title: "Call Ended",
        description: "Your AI companion call has ended. Stay safe!",
      });
    },
    onMessage: (message) => {
      console.log('Received message:', message);
      
      // Check for trigger words in user messages
      if (message.source === 'user' && message.message) {
        const triggerWords = ['help', 'scared', 'danger', 'emergency', 'unsafe'];
        const messageText = message.message.toLowerCase();
        
        if (triggerWords.some(word => messageText.includes(word))) {
          console.log('Trigger word detected:', messageText);
          config?.onTriggerWordDetected?.();
        }
        
        // Check for safe arrival phrases
        const safeArrivalPhrases = ['reached home', 'home safe', 'arrived safely', 'reached destination'];
        if (safeArrivalPhrases.some(phrase => messageText.includes(phrase))) {
          console.log('Safe arrival detected:', messageText);
          config?.onSafeArrival?.();
        }
      }
    },
    onError: (error) => {
      console.error('Voice conversation error:', error);
      toast({
        title: "Connection Error",
        description: "There was an issue with your AI companion. Please try again.",
        variant: "destructive",
      });
    }
  });

  const startConversation = useCallback(async (agentId: string) => {
    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const id = await conversation.startSession({ agentId });
      setConversationId(id);
      console.log('Started conversation with ID:', id);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use your AI safety companion.",
        variant: "destructive",
      });
    }
  }, [conversation, toast]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  }, [conversation]);

  return {
    conversation,
    isCallActive,
    conversationId,
    startConversation,
    endConversation,
    setVolume: conversation.setVolume,
    isSpeaking: conversation.isSpeaking,
    status: conversation.status
  };
};
