'use client';
import { useState } from 'react';
import { projects, samples, alerts, calculateHMPI, getRiskLevel } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FolderOpen, 
  Plus, 
  MapPin, 
  Calendar, 
  TestTube, 
  AlertTriangle,
  Eye,
  BarChart3
} from 'lucide-react';

interface NewProject {
  name: string;
  description: string;
  district: string;
  city: string;
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<NewProject>({
    name: '',
    description: '',
    district: '',
    city: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = () => {
    // In real app, this would make an API call
    console.log('Creating project:', newProject);
    setNewProject({ name: '', description: '', district: '', city: '' });
    setIsDialogOpen(false);
    // Show success message
  };

  const getProjectStats = (projectId: string) => {
    const projectSamples = samples.filter(s => s.projectId === projectId);
    const projectAlerts = alerts.filter(a => a.projectId === projectId && !a.acknowledged);
    const avgHMPI = projectSamples.length > 0 
      ? projectSamples.reduce((sum, s) => sum + calculateHMPI(s), 0) / projectSamples.length 
      : 0;
    
    const riskLevels = projectSamples.map(s => getRiskLevel(calculateHMPI(s)).level);
    const highRiskCount = riskLevels.filter(level => level === 'High Risk' || level === 'Very High Risk').length;

    return {
      sampleCount: projectSamples.length,
      alertCount: projectAlerts.length,
      avgHMPI,
      highRiskCount
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage water quality monitoring projects</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new water quality monitoring project
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Krishna River Study - Vijayawada"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Brief description of the project objectives"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    placeholder="District name"
                    value={newProject.district}
                    onChange={(e) => setNewProject(prev => ({ ...prev, district: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City/State</Label>
                  <Input
                    id="city"
                    placeholder="City or State"
                    value={newProject.city}
                    onChange={(e) => setNewProject(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  disabled={!newProject.name || !newProject.district || !newProject.city}
                >
                  Create Project
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search projects by name, city, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const stats = getProjectStats(project.id);
          
          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.district}, {project.city}
                    </CardDescription>
                  </div>
                  <FolderOpen className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                
                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.sampleCount}</div>
                    <div className="text-xs text-gray-500">Samples</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${stats.alertCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.alertCount}
                    </div>
                    <div className="text-xs text-gray-500">Alerts</div>
                  </div>
                </div>

                {/* HMPI and Risk Info */}
                {stats.sampleCount > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg HMPI:</span>
                      <span className="font-medium">{stats.avgHMPI.toFixed(1)}</span>
                    </div>
                    {stats.highRiskCount > 0 && (
                      <Badge variant="destructive" className="w-full justify-center text-xs">
                        {stats.highRiskCount} High Risk Sample{stats.highRiskCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Project Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {project.createdAt}
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && searchTerm && (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search terms or create a new project.</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
          <CardDescription>Overview of all monitoring projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-blue-700">Total Projects</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{samples.length}</div>
              <div className="text-sm text-green-700">Total Samples</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {new Set(samples.map(s => s.district)).size}
              </div>
              <div className="text-sm text-amber-700">Districts Covered</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => !a.acknowledged).length}
              </div>
              <div className="text-sm text-red-700">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}