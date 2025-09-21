'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { policies, projects, samples, calculateHMPI, standards } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Plus, 
  Edit, 
  Save, 
  History, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface NewPolicy {
  name: string;
  metal: string;
  threshold: number;
}

export default function PoliciesPage() {
  const { user } = useAuth();
  const [newPolicy, setNewPolicy] = useState<NewPolicy>({
    name: '',
    metal: '',
    threshold: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [projectThresholds, setProjectThresholds] = useState<Record<string, number>>(
    projects.reduce((acc, project) => {
      acc[project.id] = project.policyMakerThresholds.HMPI;
      return acc;
    }, {} as Record<string, number>)
  );

  // Only policy makers can access this page
  if (user?.role !== 'policy-maker') {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only Policy Makers can access policy management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleCreatePolicy = () => {
    // In real app, this would make an API call
    console.log('Creating policy:', newPolicy);
    setNewPolicy({ name: '', metal: '', threshold: 0 });
    setIsDialogOpen(false);
  };

  const handleSaveProjectThreshold = (projectId: string) => {
    // In real app, this would make an API call
    console.log('Updating project threshold:', projectId, projectThresholds[projectId]);
    setEditingProject(null);
  };

  const handleThresholdChange = (projectId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setProjectThresholds(prev => ({
      ...prev,
      [projectId]: numValue
    }));
  };

  // Calculate impact of current thresholds
  const getThresholdImpact = (threshold: number) => {
    const affectedSamples = samples.filter(sample => calculateHMPI(sample) > threshold);
    return {
      affectedCount: affectedSamples.length,
      totalSamples: samples.length,
      affectedPercent: (affectedSamples.length / samples.length * 100).toFixed(1)
    };
  };

  // Get compliance statistics
  const getComplianceStats = () => {
    const totalSamples = samples.length;
    let whoCompliant = 0;
    let bbiCompliant = 0;
    let policyCompliant = 0;

    samples.forEach(sample => {
      const whoLimit = standards.WHO[sample.metal as keyof typeof standards.WHO];
      const bbiLimit = standards.BBI[sample.metal as keyof typeof standards.BBI];
      const project = projects.find(p => p.id === sample.projectId);
      const hmpi = calculateHMPI(sample);

      if (sample.Si <= whoLimit) whoCompliant++;
      if (sample.Si <= bbiLimit) bbiCompliant++;
      if (project && hmpi <= project.policyMakerThresholds.HMPI) policyCompliant++;
    });

    return {
      whoCompliance: (whoCompliant / totalSamples * 100).toFixed(1),
      bbiCompliance: (bbiCompliant / totalSamples * 100).toFixed(1),
      policyCompliance: (policyCompliant / totalSamples * 100).toFixed(1)
    };
  };

  const complianceStats = getComplianceStats();
  const availableMetals = [...new Set(samples.map(s => s.metal))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-gray-600">Set and manage environmental policy thresholds</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>
                Define a new environmental policy threshold
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="policy-name">Policy Name</Label>
                <Input
                  id="policy-name"
                  placeholder="e.g., Enhanced Lead Control Policy"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="policy-metal">Metal Type</Label>
                <Select
                  value={newPolicy.metal}
                  onValueChange={(value) => setNewPolicy(prev => ({ ...prev, metal: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetals.map(metal => (
                      <SelectItem key={metal} value={metal}>
                        {metal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="policy-threshold">Threshold (mg/L)</Label>
                <Input
                  id="policy-threshold"
                  type="number"
                  step="0.001"
                  placeholder="0.010"
                  value={newPolicy.threshold}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePolicy}
                  disabled={!newPolicy.name || !newPolicy.metal || newPolicy.threshold <= 0}
                >
                  Create Policy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WHO Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{complianceStats.whoCompliance}%</div>
            <p className="text-xs text-muted-foreground">Samples meeting WHO standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BBI Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{complianceStats.bbiCompliance}%</div>
            <p className="text-xs text-muted-foreground">Samples meeting BBI standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Compliance</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{complianceStats.policyCompliance}%</div>
            <p className="text-xs text-muted-foreground">Samples meeting policy thresholds</p>
          </CardContent>
        </Card>
      </div>

      {/* Project-Specific Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Project-Specific HMPI Thresholds
          </CardTitle>
          <CardDescription>
            Set custom pollution index thresholds for each monitoring project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map(project => {
            const currentThreshold = projectThresholds[project.id];
            const impact = getThresholdImpact(currentThreshold);
            const projectSamples = samples.filter(s => s.projectId === project.id);
            const isEditing = editingProject === project.id;

            return (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.district}, {project.city}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProject(project.id)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProject(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveProjectThreshold(project.id)}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">HMPI Threshold</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={currentThreshold}
                        onChange={(e) => handleThresholdChange(project.id, e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-lg font-bold mt-1">{currentThreshold}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm">Project Samples</Label>
                    <div className="text-lg font-bold mt-1">{projectSamples.length}</div>
                    <p className="text-xs text-gray-500">Total samples collected</p>
                  </div>

                  <div>
                    <Label className="text-sm">Impact Assessment</Label>
                    <div className="mt-1">
                      {impact.affectedCount > 0 ? (
                        <div className="text-red-600">
                          <div className="font-bold">{impact.affectedCount} samples</div>
                          <p className="text-xs">exceed threshold ({impact.affectedPercent}%)</p>
                        </div>
                      ) : (
                        <div className="text-green-600">
                          <div className="font-bold">Compliant</div>
                          <p className="text-xs">All samples within limits</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <Alert className="mt-3">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Lowering the threshold will increase the number of samples classified as high risk. 
                      Consider the environmental and economic impact before making changes.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Current Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Active Metal-Specific Policies</CardTitle>
          <CardDescription>Current policies and metal concentration limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map(policy => (
              <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{policy.name}</h4>
                  <p className="text-sm text-gray-500">
                    {policy.metal} limit: {policy.threshold} mg/L
                  </p>
                  <p className="text-xs text-gray-400">
                    Created by {policy.createdBy} on {policy.createdAt}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Active</Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <History className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Standards Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Reference Standards</CardTitle>
          <CardDescription>International and national standards for comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                WHO Standards
              </h4>
              <div className="space-y-2">
                {Object.entries(standards.WHO).map(([metal, limit]) => (
                  <div key={metal} className="flex justify-between p-2 bg-green-50 rounded">
                    <span>{metal}</span>
                    <span className="font-medium">{limit} mg/L</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                BBI Standards
              </h4>
              <div className="space-y-2">
                {Object.entries(standards.BBI).map(([metal, limit]) => (
                  <div key={metal} className="flex justify-between p-2 bg-blue-50 rounded">
                    <span>{metal}</span>
                    <span className="font-medium">{limit} mg/L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Impact Summary</CardTitle>
          <CardDescription>Effects of current policy settings on water quality assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">Total Samples Analyzed</h5>
                <div className="text-2xl font-bold text-blue-600">{samples.length}</div>
                <p className="text-sm text-blue-600">Across all projects and metals</p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <h5 className="font-medium text-red-800 mb-2">Policy Violations</h5>
                <div className="text-2xl font-bold text-red-600">
                  {samples.length - parseInt((parseFloat(complianceStats.policyCompliance) / 100 * samples.length).toFixed(0))}
                </div>
                <p className="text-sm text-red-600">Samples exceeding thresholds</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-800 mb-2">Compliant Samples</h5>
                <div className="text-2xl font-bold text-green-600">
                  {parseInt((parseFloat(complianceStats.policyCompliance) / 100 * samples.length).toFixed(0))}
                </div>
                <p className="text-sm text-green-600">Within acceptable limits</p>
              </div>
            </div>

            <Separator />

            <div className="prose max-w-none">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1">
                <li>• Regularly review and update policy thresholds based on latest scientific evidence</li>
                <li>• Consider regional variations in environmental conditions when setting limits</li>
                <li>• Implement graduated response protocols for different risk levels</li>
                <li>• Monitor compliance trends and adjust policies proactively</li>
                <li>• Ensure alignment with international standards while addressing local needs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}