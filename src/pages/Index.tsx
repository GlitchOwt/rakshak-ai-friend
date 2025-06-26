
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Phone, Users, MessageCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import OnboardingModal from "@/components/OnboardingModal";
import EmergencyContactsModal from "@/components/EmergencyContactsModal";
import LegalChatbot from "@/components/LegalChatbot";
import SOSButton from "@/components/SOSButton";
import HelplineNumbers from "@/components/HelplineNumbers";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showLegalChat, setShowLegalChat] = useState(false);
  const [showHelplines, setShowHelplines] = useState(false);
  const [travelingAlone, setTravelingAlone] = useState<boolean | null>(null);
  const [callInitiated, setCallInitiated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const userData = localStorage.getItem('rakshak_user');
    if (userData) {
      setIsAuthenticated(true);
    } else {
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    if (travelingAlone === true && !callInitiated) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            initiateCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [travelingAlone, callInitiated]);

  const initiateCall = () => {
    setCallInitiated(true);
    toast({
      title: "AI Companion Activated",
      description: "Your safety companion is now active and ready to chat.",
      duration: 3000,
    });
  };

  const handleAuthSuccess = (userData: any) => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    
    // Check if this is a new user (no emergency contacts)
    if (!userData.emergencyContacts || userData.emergencyContacts.length === 0) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    toast({
      title: "Welcome to Rakshak.ai",
      description: "Your safety companion is ready to help you feel secure.",
      duration: 4000,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 flex items-center justify-center p-4">
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Rakshak.ai
            </h1>
          </div>
          <p className="text-gray-600 text-sm">Your trusted safety companion</p>
        </div>

        {travelingAlone === null && (
          <Card className="mb-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-gray-800 mb-2">
                Are you traveling alone?
              </CardTitle>
              <CardDescription className="text-gray-600">
                Let us know so we can provide the best assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button 
                onClick={() => setTravelingAlone(true)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg rounded-xl shadow-lg"
              >
                Yes
              </Button>
              <Button 
                onClick={() => setTravelingAlone(false)}
                variant="outline"
                className="flex-1 py-6 text-lg rounded-xl border-2 border-gray-300 hover:border-purple-300"
              >
                No
              </Button>
            </CardContent>
          </Card>
        )}

        {travelingAlone === true && (
          <div className="space-y-6">
            {!callInitiated ? (
              <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardContent className="text-center p-6">
                  <h3 className="text-xl font-semibold mb-2">Initiating AI Companion</h3>
                  <p className="mb-4">Your safety call will begin in {countdown} seconds</p>
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-green-50 border-green-200">
                <CardContent className="text-center p-6">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse mx-auto mb-3"></div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">AI Companion Active</h3>
                  <p className="text-green-700">Your safety companion is listening and ready to help</p>
                  <Button 
                    onClick={() => setCallInitiated(false)}
                    variant="outline"
                    className="mt-4 border-green-300 text-green-700 hover:bg-green-100"
                  >
                    End Conversation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {travelingAlone === false && (
          <div className="mb-6">
            <SOSButton />
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card 
            className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setShowContactsModal(true)}
          >
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">Emergency</h3>
              <p className="text-sm text-gray-600">Contacts</p>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setShowLegalChat(true)}
          >
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">Legal</h3>
              <p className="text-sm text-gray-600">Support</p>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setShowHelplines(true)}
          >
            <CardContent className="p-6 text-center">
              <Phone className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">Emergency</h3>
              <p className="text-sm text-gray-600">Helplines</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">Location</h3>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action */}
        <Button 
          onClick={() => setTravelingAlone(null)}
          variant="ghost"
          className="w-full text-gray-600 hover:text-purple-600"
        >
          Change Travel Status
        </Button>
      </div>

      {/* Modals */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={handleOnboardingComplete}
      />
      
      <EmergencyContactsModal 
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />

      <LegalChatbot 
        isOpen={showLegalChat}
        onClose={() => setShowLegalChat(false)}
      />

      <HelplineNumbers 
        isOpen={showHelplines}
        onClose={() => setShowHelplines(false)}
      />
    </div>
  );
};

export default Index;
