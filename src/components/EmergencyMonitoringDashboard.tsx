
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Clock, Users, Settings } from 'lucide-react';
import { emergencyAlertService } from '@/services/emergencyAlertService';
import { makeWebhookService } from '@/services/makeWebhookService';
import { useToast } from '@/hooks/use-toast';

const EmergencyMonitoringDashboard = () => {
  const { toast } = useToast();
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [config, setConfig] = useState(emergencyAlertService.getConfig());
  const [webhookStatus, setWebhookStatus] = useState(makeWebhookService.getWebhookStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      const sessions = emergencyAlertService.getActiveSessions();
      setActiveSessions(sessions);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleTestEmergencyAlert = async () => {
    try {
      await makeWebhookService.testEmergencyAlert();
      toast({
        title: "Test Alert Sent",
        description: "Emergency alert webhook test completed successfully",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Emergency alert webhook test failed. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleTestSafeArrival = async () => {
    try {
      await makeWebhookService.testSafeArrival();
      toast({
        title: "Test Notification Sent",
        description: "Safe arrival webhook test completed successfully",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Safe arrival webhook test failed. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (startTime: number): string => {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency Monitoring Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Active Sessions</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{activeSessions.length}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Trigger Words</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{config.triggerWords.length}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Cooldown</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{config.cooldownPeriod / 60000}m</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Webhook Status</h3>
            <div className="flex gap-2">
              <Badge variant={webhookStatus.emergencyAlert ? "secondary" : "destructive"}>
                Emergency Alert: {webhookStatus.emergencyAlert ? "✓ Configured" : "✗ Missing"}
              </Badge>
              <Badge variant={webhookStatus.safeArrival ? "secondary" : "destructive"}>
                Safe Arrival: {webhookStatus.safeArrival ? "✓ Configured" : "✗ Missing"}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Test Webhooks</h3>
            <div className="flex gap-2">
              <Button onClick={handleTestEmergencyAlert} variant="outline" size="sm">
                Test Emergency Alert
              </Button>
              <Button onClick={handleTestSafeArrival} variant="outline" size="sm">
                Test Safe Arrival
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Monitoring Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.callSid} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{session.userName}</h4>
                      <p className="text-sm text-gray-600">{session.userPhone}</p>
                      <p className="text-sm text-gray-500">Call: {session.callSid.slice(-8)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {session.alertCount} alerts sent
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {session.emergencyContacts?.length || 0} contacts
                      </p>
                    </div>
                  </div>
                  
                  {session.transcript && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <strong>Latest:</strong> {session.transcript.slice(-100)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Trigger Words</h4>
              <div className="flex flex-wrap gap-2">
                {config.triggerWords.map((word) => (
                  <Badge key={word} variant="destructive">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Safe Words</h4>
              <div className="flex flex-wrap gap-2">
                {config.safeWords.map((word) => (
                  <Badge key={word} variant="secondary">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyMonitoringDashboard;
