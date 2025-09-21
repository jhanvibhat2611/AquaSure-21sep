'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { alerts, samples, projects, calculateHMPI, getRiskLevel } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  Bell,
  XCircle,
  Info
} from 'lucide-react';

interface AlertWithDetails {
  id: string;
  projectId: string;
  sampleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  createdAt: string;
  project?: typeof projects[0];
  sample?: typeof samples[0] & { hmpi: number; riskLevel: { level: string; color: string } };
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);

  // Enhance alerts with project and sample details
  const alertsWithDetails: AlertWithDetails[] = alerts.map(alert => {
    const project = projects.find(p => p.id === alert.projectId);
    const sample = samples.find(s => s.sampleId === alert.sampleId);
    const enhancedSample = sample ? {
      ...sample,
      hmpi: calculateHMPI(sample),
      riskLevel: getRiskLevel(calculateHMPI(sample))
    } : undefined;

    return {
      ...alert,
      acknowledged: acknowledgedAlerts.includes(alert.id) || alert.acknowledged,
      project,
      sample: enhancedSample
    };
  });

  // Filter alerts based on selection
  const filteredAlerts = alertsWithDetails.filter(alert => {
    switch (filter) {
      case 'unacknowledged':
        return !alert.acknowledged;
      case 'acknowledged':
        return alert.acknowledged;
      case 'high':
        return alert.severity === 'high';
      case 'medium':
        return alert.severity === 'medium';
      case 'low':
        return alert.severity === 'low';
      default:
        return true;
    }
  });

  // Statistics
  const stats = {
    total: alertsWithDetails.length,
    unacknowledged: alertsWithDetails.filter(a => !a.acknowledged).length,
    high: alertsWithDetails.filter(a => a.severity === 'high').length,
    medium: alertsWithDetails.filter(a => a.severity === 'medium').length,
    low: alertsWithDetails.filter(a => a.severity === 'low').length
  };

  const handleAcknowledge = (alertId: string) => {
    if (user?.role === 'researcher') {
      return; // Researchers cannot acknowledge alerts
    }
    
    setAcknowledgedAlerts(prev => [...prev, alertId]);
  };

  const handleAcknowledgeAll = () => {
    if (user?.role === 'researcher') {
      return;
    }

    const unacknowledgedIds = filteredAlerts
      .filter(alert => !alert.acknowledged)
      .map(alert => alert.id);
    
    setAcknowledgedAlerts(prev => [...prev, ...unacknowledgedIds]);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const canAcknowledge = user?.role !== 'researcher';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600">
            Monitor and manage water quality alerts
            {!canAcknowledge && ' (View-only access)'}
          </p>
        </div>
        
        {canAcknowledge && filteredAlerts.some(a => !a.acknowledged) && (
          <Button onClick={handleAcknowledgeAll}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Acknowledge All
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unacknowledged}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Info className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Priority</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter alerts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Notice */}
      {!canAcknowledge && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            As a researcher, you have view-only access to alerts. You cannot acknowledge or modify alert status.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`${getSeverityColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-75' : ''
              } transition-all hover:shadow-md`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <CardTitle className="text-lg">
                        Alert: {alert.sampleId}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {alert.project?.name.split(' - ')[1]} • {new Date(alert.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={alert.severity === 'high' ? 'destructive' : 
                               alert.severity === 'medium' ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {alert.severity} Priority
                    </Badge>
                    
                    {alert.acknowledged ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Acknowledged
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-4">{alert.message}</p>
                
                {alert.sample && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white bg-opacity-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Sample Details</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Metal:</strong> {alert.sample.metal}</div>
                        <div><strong>Concentration:</strong> {alert.sample.Si} mg/L</div>
                        <div><strong>Location:</strong> {alert.sample.district}, {alert.sample.city}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Analysis Results</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>HMPI:</strong> {alert.sample.hmpi.toFixed(2)}</div>
                        <div>
                          <strong>Risk Level:</strong>
                          <Badge 
                            variant="outline" 
                            className="ml-1"
                            style={{ 
                              borderColor: alert.sample.riskLevel.color,
                              color: alert.sample.riskLevel.color 
                            }}
                          >
                            {alert.sample.riskLevel.level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Recommended Action</h4>
                      <div className="text-sm">
                        {alert.severity === 'high' && (
                          <div className="text-red-700">
                            • Immediate water restriction<br/>
                            • Emergency testing protocol<br/>
                            • Notify authorities
                          </div>
                        )}
                        {alert.severity === 'medium' && (
                          <div className="text-yellow-700">
                            • Increased monitoring<br/>
                            • Follow-up sampling<br/>
                            • Review treatment options
                          </div>
                        )}
                        {alert.severity === 'low' && (
                          <div className="text-blue-700">
                            • Continue monitoring<br/>
                            • Document findings<br/>
                            • Schedule next review
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {canAcknowledge && !alert.acknowledged && (
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Acknowledge
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No alerts found' : `No ${filter} alerts`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'All water quality parameters are within acceptable limits.'
                  : 'Try adjusting your filter to see more alerts.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alert Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Response Guidelines</CardTitle>
          <CardDescription>Standard procedures for handling different alert levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h4 className="font-medium text-red-700">High Priority Alerts</h4>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Immediate water usage restriction</li>
                <li>• Emergency sampling protocol</li>
                <li>• Notify regulatory authorities</li>
                <li>• Public health warning if needed</li>
                <li>• Response time: Within 2 hours</li>
              </ul>
            </div>
            
            <div className="p-4 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-5 w-5 text-yellow-500" />
                <h4 className="font-medium text-yellow-700">Medium Priority Alerts</h4>
              </div>
              <ul className="text-sm text-yellow-600 space-y-1">
                <li>• Increased monitoring frequency</li>
                <li>• Additional sample collection</li>
                <li>• Review treatment protocols</li>
                <li>• Update risk assessment</li>
                <li>• Response time: Within 24 hours</li>
              </ul>
            </div>
            
            <div className="p-4 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium text-blue-700">Low Priority Alerts</h4>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Continue routine monitoring</li>
                <li>• Document findings</li>
                <li>• Schedule follow-up review</li>
                <li>• Maintain data records</li>
                <li>• Response time: Within 1 week</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}