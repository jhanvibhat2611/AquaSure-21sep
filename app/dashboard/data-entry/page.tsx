'use client';
import { useState, useEffect } from 'react';
import { getProjects, createSample, createBulkSamples, calculateHMPI, getRiskLevel } from '@/utils/supabase';
import type { Project } from '@/utils/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Plus, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Trash2
} from 'lucide-react';

const excelTemplate = {
  headers: [
    "SampleID",
    "ProjectID", 
    "District",
    "City",
    "Latitude",
    "Longitude",
    "Metal",
    "Concentration",
    "Date"
  ],
  sampleData: [
    ["GNG-008", "project-id-here", "Varanasi", "Varanasi", "25.3176", "82.9739", "Lead", "0.09", "2025-01-20"],
    ["YMN-006", "project-id-here", "New Delhi", "Delhi", "28.7041", "77.1025", "Arsenic", "0.05", "2025-02-12"],
  ]
};

interface SampleData {
  sampleId: string;
  projectId: string;
  district: string;
  city: string;
  latitude: string;
  longitude: string;
  metal: string;
  concentration: string;
  date: string;
}

export default function DataEntryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadedData, setUploadedData] = useState<SampleData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSample, setNewSample] = useState<SampleData>({
    sampleId: '',
    projectId: '',
    district: '',
    city: '',
    latitude: '',
    longitude: '',
    metal: '',
    concentration: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV content
    const csvContent = [
      excelTemplate.headers.join(','),
      ...excelTemplate.sampleData.map(row => row.join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AquaSure_Sample_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Simulate file processing
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        
        if (headers.length !== excelTemplate.headers.length) {
          throw new Error('Invalid file format. Please use the provided template.');
        }

        const data: SampleData[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          if (row.length >= 8 && row[0].trim()) {
            data.push({
              sampleId: row[0].trim(),
              projectId: row[1].trim(),
              district: row[2].trim(),
              city: row[3].trim(),
              latitude: row[4].trim(),
              longitude: row[5].trim(),
              metal: row[6].trim(),
              concentration: row[7].trim(),
              date: row[8].trim()
            });
          }
        }
        
        setUploadedData(data);
      } catch (error) {
        alert('Error processing file. Please check the format and try again.');
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.readAsText(file);
  };

  const handleAddSample = () => {
    // Validate form
    const requiredFields = ['sampleId', 'projectId', 'district', 'city', 'latitude', 'longitude', 'metal', 'concentration'];
    const missingFields = requiredFields.filter(field => !newSample[field as keyof SampleData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Add to uploaded data
    setUploadedData(prev => [...prev, { ...newSample }]);
    
    // Reset form
    setNewSample({
      sampleId: '',
      projectId: '',
      district: '',
      city: '',
      latitude: '',
      longitude: '',
      metal: '',
      concentration: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSaveData = async () => {
    if (uploadedData.length === 0) {
      alert('No data to save. Please add samples or upload a file.');
      return;
    }

    setIsSaving(true);
    try {
      const samplesToSave = uploadedData.map(sample => {
        const concentration = parseFloat(sample.concentration);
        // Using standard values for HMPI calculation
        const Ii = getStandardIi(sample.metal);
        const Mi = getStandardMi(sample.metal);
        const hmpiValue = calculateHMPI(concentration, Ii, Mi);
        const riskLevel = getRiskLevel(hmpiValue);

        return {
          project_id: sample.projectId,
          sample_id: sample.sampleId,
          metal: sample.metal,
          concentration,
          date_collected: sample.date,
          latitude: parseFloat(sample.latitude),
          longitude: parseFloat(sample.longitude),
          hmpi_value: hmpiValue,
          risk_level: riskLevel
        };
      });

      await createBulkSamples(samplesToSave);
      alert(`Successfully saved ${uploadedData.length} sample(s) to the database!`);
      setUploadedData([]);
    } catch (error) {
      console.error('Error saving samples:', error);
      alert('Error saving samples. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions for standard values
  const getStandardIi = (metal: string): number => {
    const standards: Record<string, number> = {
      'Lead': 0.01,
      'Arsenic': 0.01,
      'Chromium': 0.05,
      'Mercury': 0.006,
      'Cadmium': 0.003,
    };
    return standards[metal] || 0.01;
  };

  const getStandardMi = (metal: string): number => {
    const weights: Record<string, number> = {
      'Lead': 0.7,
      'Arsenic': 0.5,
      'Chromium': 0.4,
      'Mercury': 0.6,
      'Cadmium': 0.45,
    };
    return weights[metal] || 0.5;
  };

  const handleDeleteSample = (index: number) => {
    setUploadedData(prev => prev.filter((_, i) => i !== index));
  };

  const validateSample = (sample: SampleData) => {
    const errors = [];
    
    // Check if project exists
    const projectExists = projects.some(p => p.id === sample.projectId);
    if (!projectExists) errors.push('Invalid project ID');
    
    // Validate coordinates
    const lat = parseFloat(sample.latitude);
    const lng = parseFloat(sample.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.push('Invalid latitude');
    if (isNaN(lng) || lng < -180 || lng > 180) errors.push('Invalid longitude');
    
    // Validate numeric values
    const concentration = parseFloat(sample.concentration);
    if (isNaN(concentration) || concentration < 0) errors.push('Invalid concentration value');
    
    return errors;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Entry</h1>
        <p className="text-gray-600">Add water quality samples to the system</p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Excel Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Bulk Data Upload
            </CardTitle>
            <CardDescription>
              Upload multiple samples using Excel/CSV format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                Click to upload or drag and drop your Excel/CSV file
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" disabled={isUploading}>
                  {isUploading ? 'Processing...' : 'Choose File'}
                </Button>
              </label>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownloadTemplate}
                className="text-blue-600 hover:text-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use the provided template to ensure proper data format. 
                Include columns: SampleID, ProjectID, District, City, Latitude, Longitude, Metal, Si, Ii, Mi, Date.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Manual Sample Entry
            </CardTitle>
            <CardDescription>
              Add individual samples manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sampleId">Sample ID *</Label>
                <Input
                  id="sampleId"
                  placeholder="e.g., GNG-008"
                  value={newSample.sampleId}
                  onChange={(e) => setNewSample(prev => ({ ...prev, sampleId: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <Select
                  value={newSample.projectId}
                  onValueChange={(value) => setNewSample(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  placeholder="District name"
                  value={newSample.district}
                  onChange={(e) => setNewSample(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City name"
                  value={newSample.city}
                  onChange={(e) => setNewSample(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  placeholder="e.g., 25.3176"
                  value={newSample.latitude}
                  onChange={(e) => setNewSample(prev => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  placeholder="e.g., 82.9739"
                  value={newSample.longitude}
                  onChange={(e) => setNewSample(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metal">Metal Type *</Label>
              <Select
                value={newSample.metal}
                onValueChange={(value) => setNewSample(prev => ({ ...prev, metal: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Arsenic">Arsenic</SelectItem>
                  <SelectItem value="Chromium">Chromium</SelectItem>
                  <SelectItem value="Mercury">Mercury</SelectItem>
                  <SelectItem value="Cadmium">Cadmium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="concentration">Concentration (mg/L) *</Label>
                <Input
                  id="concentration"
                  placeholder="0.09"
                  value={newSample.concentration}
                  onChange={(e) => setNewSample(prev => ({ ...prev, concentration: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Sample Date *</Label>
              <Input
                id="date"
                type="date"
                value={newSample.date}
                onChange={(e) => setNewSample(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <Button onClick={handleAddSample} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Sample
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      {uploadedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Review and validate samples before saving ({uploadedData.length} sample{uploadedData.length > 1 ? 's' : ''})
                </CardDescription>
              </div>
              <Button onClick={handleSaveData} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save All Data'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Sample ID</th>
                    <th className="text-left p-2">Project</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Metal</th>
                    <th className="text-left p-2">Concentration</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedData.map((sample, index) => {
                    const errors = validateSample(sample);
                    const project = projects.find(p => p.id === sample.projectId);
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{sample.sampleId}</td>
                        <td className="p-2">{project ? project.name : sample.projectId}</td>
                        <td className="p-2">{sample.district}, {sample.city}</td>
                        <td className="p-2">{sample.metal}</td>
                        <td className="p-2">{sample.concentration}</td>
                        <td className="p-2">
                          {errors.length === 0 ? (
                            <Badge variant="outline" className="text-green-600">Valid</Badge>
                          ) : (
                            <Badge variant="destructive">
                              {errors.length} Error{errors.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSample(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}