'use client';
import { useState } from 'react';
import { projects, samples, standards, calculateHMPI, getRiskLevel } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Calculator, AlertTriangle, CheckCircle, TrendingUp, FileText } from 'lucide-react';

export default function CalculationsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedMetal, setSelectedMetal] = useState<string>('all');

  // Filter samples based on selections
  const filteredSamples = samples.filter(sample => {
    if (selectedProject !== 'all' && sample.projectId !== selectedProject) return false;
    if (selectedMetal !== 'all' && sample.metal !== selectedMetal) return false;
    return true;
  });

  // Calculate HMPI for filtered samples
  const samplesWithCalculations = filteredSamples.map(sample => {
    const hmpi = calculateHMPI(sample);
    const riskLevel = getRiskLevel(hmpi);
    const whoStandard = standards.WHO[sample.metal as keyof typeof standards.WHO];
    const bbiStandard = standards.BBI[sample.metal as keyof typeof standards.BBI];
    const project = projects.find(p => p.id === sample.projectId);
    
    return {
      ...sample,
      hmpi,
      riskLevel,
      whoStandard,
      bbiStandard,
      policyThreshold: project?.policyMakerThresholds.HMPI || 100,
      project: project?.name.split(' - ')[1] || 'Unknown',
      exceedsWHO: sample.Si > whoStandard,
      exceedsBBI: sample.Si > bbiStandard,
      exceedsPolicy: hmpi > (project?.policyMakerThresholds.HMPI || 100)
    };
  });

  // Statistics
  const stats = {
    totalSamples: samplesWithCalculations.length,
    averageHMPI: samplesWithCalculations.length > 0 
      ? samplesWithCalculations.reduce((sum, s) => sum + s.hmpi, 0) / samplesWithCalculations.length 
      : 0,
    exceedsWHO: samplesWithCalculations.filter(s => s.exceedsWHO).length,
    exceedsBBI: samplesWithCalculations.filter(s => s.exceedsBBI).length,
    exceedsPolicy: samplesWithCalculations.filter(s => s.exceedsPolicy).length,
    highRisk: samplesWithCalculations.filter(s => 
      s.riskLevel.level === 'High Risk' || s.riskLevel.level === 'Very High Risk'
    ).length
  };

  // Chart data for HMPI comparison
  const chartData = samplesWithCalculations.map(sample => ({
    sampleId: sample.sampleId,
    hmpi: sample.hmpi,
    whoThreshold: 50, // Example threshold for visualization
    bbiThreshold: 75, // Example threshold for visualization
    policyThreshold: sample.policyThreshold,
    riskColor: sample.riskLevel.color
  }));

  const handleExportResults = () => {
    const csvContent = [
      ['Sample ID', 'Project', 'Metal', 'Si (mg/L)', 'Ii', 'Mi', 'HMPI', 'Risk Level', 'WHO Standard', 'BBI Standard', 'Exceeds WHO', 'Exceeds BBI', 'Exceeds Policy'].join(','),
      ...samplesWithCalculations.map(sample => [
        sample.sampleId,
        sample.project,
        sample.metal,
        sample.Si,
        sample.Ii,
        sample.Mi,
        sample.hmpi,
        sample.riskLevel.level,
        sample.whoStandard,
        sample.bbiStandard,
        sample.exceedsWHO ? 'Yes' : 'No',
        sample.exceedsBBI ? 'Yes' : 'No',
        sample.exceedsPolicy ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'HMPI_Calculations.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Get unique metals for filter
  const uniqueMetals = [...new Set(samples.map(s => s.metal))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HMPI Calculations</h1>
          <p className="text-gray-600">Heavy Metal Pollution Index analysis and standards comparison</p>
        </div>
        
        <Button onClick={handleExportResults} disabled={samplesWithCalculations.length === 0}>
          <FileText className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-48">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name.split(' - ')[1]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-32">
          <Select value={selectedMetal} onValueChange={setSelectedMetal}>
            <SelectTrigger>
              <SelectValue placeholder="All Metals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metals</SelectItem>
              {uniqueMetals.map(metal => (
                <SelectItem key={metal} value={metal}>
                  {metal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSamples}</div>
            <p className="text-xs text-muted-foreground">Analyzed samples</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average HMPI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageHMPI.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Pollution index</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WHO Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.exceedsWHO}</div>
            <p className="text-xs text-muted-foreground">Exceed WHO limits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground">High/Very high risk</p>
          </CardContent>
        </Card>
      </div>

      {/* HMPI Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>HMPI Values by Sample</CardTitle>
            <CardDescription>Heavy Metal Pollution Index compared to thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sampleId" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : value, 
                    name === 'hmpi' ? 'HMPI Value' : name
                  ]}
                />
                <ReferenceLine y={50} stroke="#059669" strokeDasharray="5 5" label="Safe Level" />
                <ReferenceLine y={100} stroke="#DC2626" strokeDasharray="5 5" label="Danger Level" />
                <Bar dataKey="hmpi" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed HMPI Calculations</CardTitle>
          <CardDescription>
            Complete analysis with standards comparison ({samplesWithCalculations.length} samples)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {samplesWithCalculations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sample ID</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>Si (mg/L)</TableHead>
                    <TableHead>HMPI</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>WHO</TableHead>
                    <TableHead>BBI</TableHead>
                    <TableHead>Policy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samplesWithCalculations.map((sample) => (
                    <TableRow key={sample.id}>
                      <TableCell className="font-medium">{sample.sampleId}</TableCell>
                      <TableCell>{sample.project}</TableCell>
                      <TableCell>{sample.metal}</TableCell>
                      <TableCell>{sample.Si.toFixed(3)}</TableCell>
                      <TableCell className="font-bold">{sample.hmpi.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: sample.riskLevel.color,
                            color: sample.riskLevel.color 
                          }}
                        >
                          {sample.riskLevel.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sample.exceedsWHO ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Exceeds
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Safe
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {sample.exceedsBBI ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Exceeds
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Safe
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {sample.exceedsPolicy ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Exceeds
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Safe
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No samples to calculate</h3>
              <p className="text-gray-500">
                {selectedProject !== 'all' || selectedMetal !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Add samples through the Data Entry page to see calculations here.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standards Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Standards Reference</CardTitle>
          <CardDescription>Heavy metal concentration limits (mg/L)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">WHO Standards</h4>
              <div className="space-y-2">
                {Object.entries(standards.WHO).map(([metal, limit]) => (
                  <div key={metal} className="flex justify-between p-2 bg-blue-50 rounded">
                    <span>{metal}</span>
                    <span className="font-medium">{limit} mg/L</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">BBI Standards</h4>
              <div className="space-y-2">
                {Object.entries(standards.BBI).map(([metal, limit]) => (
                  <div key={metal} className="flex justify-between p-2 bg-green-50 rounded">
                    <span>{metal}</span>
                    <span className="font-medium">{limit} mg/L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HMPI Formula */}
      <Card>
        <CardHeader>
          <CardTitle>HMPI Calculation Formula</CardTitle>
          <CardDescription>Heavy Metal Pollution Index methodology</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Formula:</h4>
              <p className="text-lg font-mono">HMPI = (Si / Ii) × Mi × 100</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <h5 className="font-medium">Si</h5>
                <p className="text-sm text-gray-600">Metal concentration in sample (mg/L)</p>
              </div>
              <div className="p-3 border rounded">
                <h5 className="font-medium">Ii</h5>
                <p className="text-sm text-gray-600">Highest permissible value of metal i</p>
              </div>
              <div className="p-3 border rounded">
                <h5 className="font-medium">Mi</h5>
                <p className="text-sm text-gray-600">Relative weight of metal i</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Risk Classification:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span><strong>Safe:</strong> HMPI &lt; 10</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-lime-600 rounded"></div>
                  <span><strong>Low Risk:</strong> 10 ≤ HMPI &lt; 25</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                  <span><strong>Moderate Risk:</strong> 25 ≤ HMPI &lt; 50</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-600 rounded"></div>
                  <span><strong>High Risk:</strong> 50 ≤ HMPI &lt; 100</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span><strong>Very High Risk:</strong> HMPI ≥ 100</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}