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
import TwilioVoiceInterface from "@/components/TwilioVoiceInterface";
import { useSOSIntegration } from "@/hooks/useSOSIntegration";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showLegalChat, setShowLegalChat] = useState(false);
  const [showHelplines, setShowHelplines] = useState(false);
  const [travelingAlone, setTravelingAlone] = useState<boolean | null>(null);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [autoStartCall, setAutoStartCall] = useState(false);
  const [userDataComplete, setUserDataComplete] = useState(false);
  const { toast } = useToast();
  const { sendSOS, sendSafeArrivalNotification } = useSOSIntegration();

  useEffect(() => {
    // Check if user is already authenticated
    const userData = localStorage.getItem('rakshak_user');
    if (userData) {
      setIsAuthenticated(true);
      // Check if user data is complete (has emergency contacts)
      const parsedData = JSON.parse(userData);
      if (parsedData.emergencyContacts && parsedData.emergencyContacts.length > 0) {
        setUserDataComplete(true);
      }
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const handleTriggerWordDetected = async () => {
    const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await sendSOS({
            userName: userData.name || 'User',
            location: { latitude, longitude },
            emergencyContacts: userData.emergencyContacts || [],
            triggerReason: 'voice_trigger'
          });
        },
        async () => {
          await sendSOS({
            userName: userData.name || 'User',
            location: null,
            emergencyContacts: userData.emergencyContacts || [],
            triggerReason: 'voice_trigger'
          });
        }
      );
    }
  };

  const handleSafeArrival = async () => {
    const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
    await sendSafeArrivalNotification(
      userData.name || 'User',
      userData.emergencyContacts || []
    );
  };

  const handleCallEnd = () => {
    setShowVoiceCall(false);
    setAutoStartCall(false);
    setShowFeedback(true);
    
    // Auto-hide feedback after 10 seconds
    setTimeout(() => setShowFeedback(false), 10000);
  };

  const handleStartVoiceCompanion = () => {
    // Check if user data is complete first
    if (!userDataComplete) {
      toast({
        title: "Complete Your Profile",
        description: "Please add your emergency contacts before starting the AI companion.",
        variant: "destructive",
      });
      setShowOnboarding(true);
      return;
    }

    setTravelingAlone(true);
    setShowVoiceCall(true);
    setAutoStartCall(true);
    
    toast({
      title: "🤖 AI Companion Activating",
      description: "Your Make.com automation will trigger ElevenLabs to call you within 10-30 seconds!",
      duration: 8000,
    });
  };

  const handleAuthSuccess = (userData: any) => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    
    // Check if this is a new user (no emergency contacts)
    if (!userData.emergencyContacts || userData.emergencyContacts.length === 0) {
      setShowOnboarding(true);
      setUserDataComplete(false);
    } else {
      setUserDataComplete(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setUserDataComplete(true);
    toast({
      title: "Profile Complete!",
      description: "Your safety companion is ready. You can now start the AI companion when traveling alone.",
      duration: 4000,
    });
  };

  const handleContactsUpdated = () => {
    // Check if user now has emergency contacts
    const userData = JSON.parse(localStorage.getItem('rakshak_user') || '{}');
    if (userData.emergencyContacts && userData.emergencyContacts.length > 0) {
      setUserDataComplete(true);
    }
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

        {/* Profile Completion Status */}
        {!userDataComplete && (
          <Card className="mb-6 border-0 shadow-xl bg-yellow-50 border-yellow-200">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg text-yellow-800 mb-2">
                Complete Your Safety Profile
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Add your emergency contacts to use the AI safety companion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowOnboarding(true)}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Add Emergency Contacts
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Travel Status Question - Only show if profile is complete */}
        {userDataComplete && travelingAlone === null && (
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
                onClick={handleStartVoiceCompanion}
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

        {/* Voice Call Interface - Auto-initiated */}
        {showVoiceCall && (
          <div className="mb-6">
            <TwilioVoiceInterface
              autoStart={autoStartCall}
              onEmergencyTriggered={handleTriggerWordDetected}
              onSafeArrival={handleSafeArrival}
              onCallEnd={handleCallEnd}
            />
          </div>
        )}

        {/* Post-Call Feedback */}
        {showFeedback && (
          <Card className="mb-6 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">How was your experience?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="text-2xl hover:scale-110 transition-transform"
                    onClick={() => {
                      toast({
                        title: "Thank you!",
                        description: "Your feedback helps us improve Rakshak.ai",
                      });
                      setShowFeedback(false);
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowFeedback(false)}
                className="text-sm text-gray-500"
              >
                Skip
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SOS Button for non-alone users */}
        {travelingAlone === false && (
          <div className="mb-6">
            <SOSButton />
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card 
            className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => {
              setShowContactsModal(true);
            }}
          >
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">Emergency</h3>
              <p className="text-sm text-gray-600">Contacts</p>
              {!userDataComplete && (
                <Badge variant="destructive" className="text-xs mt-2">Required</Badge>
              )}
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
          onClick={() => {
            setTravelingAlone(null);
            setShowVoiceCall(false);
            setAutoStartCall(false);
            setShowFeedback(false);
          }}
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
        onClose={() => {
          setShowContactsModal(false);
          handleContactsUpdated();
        }}
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