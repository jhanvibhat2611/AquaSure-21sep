'use client';
import { useState, useEffect } from 'react';
import { getProjects, getSamples, getAlerts, createProject } from '@/utils/supabase';
import type { Project, Sample, Alert } from '@/utils/supabase';
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
  location_district: string;
  location_city: string;
  location_state: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<NewProject>({
    name: '',
    description: '',
    location_district: '',
    location_city: '',
    location_state: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, samplesData, alertsData] = await Promise.all([
        getProjects(),
        getSamples(),
        getAlerts()
      ]);
      
      setProjects(projectsData);
      setSamples(samplesData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location_district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      await createProject(newProject);
      setNewProject({ 
        name: '', 
        description: '', 
        location_district: '', 
        location_city: '',
        location_state: ''
      });
      setIsDialogOpen(false);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getProjectStats = (projectId: string) => {
    const projectSamples = samples.filter(s => s.project_id === projectId);
    const projectAlerts = alerts.filter(a => 
      projectSamples.some(s => s.id === a.sample_id) && a.status === 'active'
    );
    const avgHMPI = projectSamples.length > 0 
      ? projectSamples.reduce((sum, s) => sum + s.hmpi_value, 0) / projectSamples.length 
      : 0;
    
    const riskLevels = projectSamples.map(s => s.risk_level);
    const highRiskCount = riskLevels.filter(level => level === 'High Risk' || level === 'Very High Risk').length;

    return {
      sampleCount: projectSamples.length,
      alertCount: projectAlerts.length,
      avgHMPI,
      highRiskCount
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
                  <Label htmlFor="location_district">District</Label>
                  <Input
                    id="location_district"
                    placeholder="District name"
                    value={newProject.location_district}
                    onChange={(e) => setNewProject(prev => ({ ...prev, location_district: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location_city">City</Label>
                  <Input
                    id="location_city"
                    placeholder="City name"
                    value={newProject.location_city}
                    onChange={(e) => setNewProject(prev => ({ ...prev, location_city: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location_state">State</Label>
                <Input
                  id="location_state"
                  placeholder="State name"
                  value={newProject.location_state}
                  onChange={(e) => setNewProject(prev => ({ ...prev, location_state: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProject.name || !newProject.location_district || !newProject.location_city || !newProject.location_state}
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
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
                      {project.location_district}, {project.location_city}
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
                    {new Date(project.created_at).toLocaleDateString()}
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
                {new Set(projects.map(p => p.location_district)).size}
              </div>
              <div className="text-sm text-amber-700">Districts Covered</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-red-700">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}