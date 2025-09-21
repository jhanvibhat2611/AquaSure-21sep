'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { projects, samples, calculateHMPI, getRiskLevel } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Filter, Eye, BarChart3 } from 'lucide-react';

// Dynamic import for Leaflet to avoid SSR issues
const MapVisualization = dynamic(() => import('@/components/MapVisualization'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  )
});

interface MapSample {
  id: string;
  sampleId: string;
  projectId: string;
  projectName: string;
  metal: string;
  Si: number;
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  date: string;
  hmpi: number;
  riskLevel: { level: string; color: string };
}

export default function VisualizationPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [mapSamples, setMapSamples] = useState<MapSample[]>([]);

  useEffect(() => {
    // Process samples for map display
    const processedSamples: MapSample[] = samples.map(sample => {
      const hmpi = calculateHMPI(sample);
      const riskLevel = getRiskLevel(hmpi);
      const project = projects.find(p => p.id === sample.projectId);
      
      return {
        ...sample,
        projectName: project?.name || 'Unknown Project',
        hmpi,
        riskLevel
      };
    });

    setMapSamples(processedSamples);
  }, []);

  // Filter samples based on selections
  const filteredSamples = mapSamples.filter(sample => {
    if (selectedProject !== 'all' && sample.projectId !== selectedProject) return false;
    if (selectedRiskLevel !== 'all' && sample.riskLevel.level !== selectedRiskLevel) return false;
    return true;
  });

  // Statistics for the filtered data
  const stats = {
    totalSamples: filteredSamples.length,
    uniqueLocations: new Set(filteredSamples.map(s => `${s.district}-${s.city}`)).size,
    averageHMPI: filteredSamples.length > 0 
      ? filteredSamples.reduce((sum, s) => sum + s.hmpi, 0) / filteredSamples.length 
      : 0,
    highRiskCount: filteredSamples.filter(s => 
      s.riskLevel.level === 'High Risk' || s.riskLevel.level === 'Very High Risk'
    ).length
  };

  // Risk level distribution
  const riskDistribution = filteredSamples.reduce((acc, sample) => {
    const level = sample.riskLevel.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskLevels = [
    'Safe',
    'Low Risk', 
    'Moderate Risk',
    'High Risk',
    'Very High Risk'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Map Visualization</h1>
        <p className="text-gray-600">Interactive map showing water quality sample locations and risk levels</p>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name.split(' - ')[1] || project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    {riskLevels.map(level => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Map Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Samples:</span>
              <span className="font-medium">{stats.totalSamples}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Locations:</span>
              <span className="font-medium">{stats.uniqueLocations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg HMPI:</span>
              <span className="font-medium">{stats.averageHMPI.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">High Risk:</span>
              <span className="font-medium text-red-600">{stats.highRiskCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {riskLevels.map(level => {
              const count = riskDistribution[level] || 0;
              const sample = mapSamples.find(s => s.riskLevel.level === level);
              return (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: sample?.riskLevel.color || '#666' }}
                    />
                    <span className="text-xs">{level}</span>
                  </div>
                  <span className="font-medium text-sm">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Sample Locations Map
          </CardTitle>
          <CardDescription>
            Interactive map showing {filteredSamples.length} sample location{filteredSamples.length !== 1 ? 's' : ''} with risk level indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] rounded-lg overflow-hidden border">
            <MapVisualization samples={filteredSamples} />
          </div>
        </CardContent>
      </Card>

      {/* Sample Details */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Details</CardTitle>
          <CardDescription>
            Detailed view of samples shown on the map ({filteredSamples.length} samples)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSamples.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSamples.map((sample) => (
                <div key={sample.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{sample.sampleId}</h4>
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: sample.riskLevel.color,
                        color: sample.riskLevel.color 
                      }}
                    >
                      {sample.riskLevel.level}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Project:</strong> {sample.projectName.split(' - ')[1]}</p>
                    <p><strong>Location:</strong> {sample.district}, {sample.city}</p>
                    <p><strong>Metal:</strong> {sample.metal}</p>
                    <p><strong>Concentration:</strong> {sample.Si} mg/L</p>
                    <p><strong>HMPI:</strong> <span className="font-bold">{sample.hmpi.toFixed(2)}</span></p>
                    <p><strong>Date:</strong> {sample.date}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analysis
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No samples to display</h3>
              <p className="text-gray-500">
                {selectedProject !== 'all' || selectedRiskLevel !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Add samples through the Data Entry page to see them on the map.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
          <CardDescription>Understanding the risk level color coding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {riskLevels.map(level => {
              const sample = mapSamples.find(s => s.riskLevel.level === level);
              const color = sample?.riskLevel.color || '#666';
              
              return (
                <div key={level} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <div className="font-medium text-sm">{level}</div>
                    <div className="text-xs text-gray-500">
                      {riskDistribution[level] || 0} sample{(riskDistribution[level] || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}