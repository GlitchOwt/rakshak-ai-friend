
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Scale, FileText, Phone } from "lucide-react";

interface LegalChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const LegalChatbot = ({ isOpen, onClose }: LegalChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm here to help you with legal guidance and support. You can ask me about filing complaints, understanding your rights, or getting legal resources. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const quickActions = [
    { text: "How to file a police complaint?", icon: FileText },
    { text: "Women's rights and protection laws", icon: Scale },
    { text: "Legal aid and free lawyer services", icon: Phone },
  ];

  const predefinedResponses: { [key: string]: string } = {
    "how to file a police complaint": "To file a police complaint:\n\n1. Visit the nearest police station\n2. Provide all details of the incident\n3. Ensure your complaint is registered with an FIR number\n4. Keep a copy of the FIR\n5. If police refuse, you can approach higher authorities\n\nYou can also file online complaints through your state police website.",
    
    "women's rights": "Key women's rights and protection laws in India:\n\n• Protection of Women from Domestic Violence Act, 2005\n• Sexual Harassment of Women at Workplace Act, 2013\n• Dowry Prohibition Act, 1961\n• Immoral Traffic Prevention Act, 1956\n• Indian Penal Code Sections 354, 375, 376 (sexual offenses)\n\nThese laws provide protection and legal recourse.",
    
    "legal aid": "Free legal aid services available:\n\n• District Legal Services Authority (DLSA)\n• State Legal Services Authority (SLSA)\n• National Legal Services Authority (NALSA)\n• Lok Adalats for quick resolution\n• Women's helpline: 181\n• Legal Aid Helpline: 15100\n\nEligible women can get free legal representation and advice."
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Generate bot response
    setTimeout(() => {
      const lowercaseInput = inputMessage.toLowerCase();
      let response = "I understand your concern. For specific legal advice, I recommend consulting with a qualified lawyer. However, I can provide general information about legal processes and rights.";

      // Check for keywords in predefined responses
      for (const [key, value] of Object.entries(predefinedResponses)) {
        if (lowercaseInput.includes(key)) {
          response = value;
          break;
        }
      }

      // Additional contextual responses
      if (lowercaseInput.includes("harassment") || lowercaseInput.includes("assault")) {
        response = "I'm sorry you're going through this. For harassment or assault cases:\n\n1. Preserve all evidence (messages, photos, etc.)\n2. File a police complaint immediately\n3. Seek medical attention if needed\n4. Contact women's helpline: 181\n5. Consider approaching a women's rights organization\n\nRemember, it's not your fault, and help is available.";
      } else if (lowercaseInput.includes("workplace")) {
        response = "For workplace issues:\n\n• Sexual Harassment of Women at Workplace Act, 2013 protects you\n• Every workplace must have an Internal Complaints Committee\n• You can file a complaint with your company's ICC\n• If no ICC exists, approach Local Complaints Committee\n• Maintain documentation of all incidents";
      }

      const botMessage: Message = {
        id: messages.length + 2,
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);

    setInputMessage("");
  };

  const handleQuickAction = (text: string) => {
    setInputMessage(text);
    sendMessage();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-0 bg-white/95 backdrop-blur-sm h-[80vh] flex flex-col">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Scale className="h-6 w-6 text-purple-600 mr-2" />
            <DialogTitle className="text-xl">
              Legal Support Assistant
            </DialogTitle>
          </div>
          <p className="text-gray-600 text-sm">
            Get guidance on legal procedures and rights
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`max-w-[80%] ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p className={`text-xs mt-2 ${
                        message.isUser ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.text)}
                  className="text-xs"
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.text}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask about legal procedures..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalChatbot;
