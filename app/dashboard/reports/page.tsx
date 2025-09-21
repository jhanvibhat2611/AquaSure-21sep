'use client';
import { useState } from 'react';
import { projects, samples, calculateHMPI, getRiskLevel, standards } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  MapPin,
  TestTube,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('comprehensive');

  // Filter samples based on selected project
  const filteredSamples = selectedProject === 'all' 
    ? samples 
    : samples.filter(sample => sample.projectId === selectedProject);

  const selectedProjectData = selectedProject !== 'all' 
    ? projects.find(p => p.id === selectedProject)
    : null;

  // Calculate report data
  const reportData = {
    samples: filteredSamples.map(sample => ({
      ...sample,
      hmpi: calculateHMPI(sample),
      riskLevel: getRiskLevel(calculateHMPI(sample)),
      project: projects.find(p => p.id === sample.projectId)
    })),
    summary: {
      totalSamples: filteredSamples.length,
      averageHMPI: filteredSamples.length > 0 
        ? filteredSamples.reduce((sum, s) => sum + calculateHMPI(s), 0) / filteredSamples.length 
        : 0,
      highRiskCount: filteredSamples.filter(s => {
        const hmpi = calculateHMPI(s);
        const risk = getRiskLevel(hmpi);
        return risk.level === 'High Risk' || risk.level === 'Very High Risk';
      }).length,
      projects: selectedProject === 'all' ? projects.length : 1
    }
  };

  // Risk distribution for charts
  const riskDistribution = reportData.samples.reduce((acc, sample) => {
    const level = sample.riskLevel.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskChartData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: reportData.samples.find(s => s.riskLevel.level === level)?.riskLevel.color || '#666'
  }));

  // Metal distribution
  const metalDistribution = reportData.samples.reduce((acc, sample) => {
    acc[sample.metal] = (acc[sample.metal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const metalChartData = Object.entries(metalDistribution).map(([metal, count]) => ({
    name: metal,
    count,
    avgHMPI: reportData.samples
      .filter(s => s.metal === metal)
      .reduce((sum, s) => sum + s.hmpi, 0) / reportData.samples.filter(s => s.metal === metal).length
  }));

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('AquaSure Water Quality Report', 20, 30);
      
      // Add project info
      doc.setFontSize(12);
      if (selectedProjectData) {
        doc.text(`Project: ${selectedProjectData.name}`, 20, 50);
        doc.text(`Location: ${selectedProjectData.district}, ${selectedProjectData.city}`, 20, 60);
      } else {
        doc.text('Comprehensive Report - All Projects', 20, 50);
      }
      
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 70);
      doc.text(`Total Samples: ${reportData.summary.totalSamples}`, 20, 80);
      doc.text(`Average HMPI: ${reportData.summary.averageHMPI.toFixed(2)}`, 20, 90);
      doc.text(`High Risk Samples: ${reportData.summary.highRiskCount}`, 20, 100);
      
      // Add sample summary
      let yPos = 120;
      doc.text('Sample Summary:', 20, yPos);
      yPos += 10;
      
      reportData.samples.slice(0, 10).forEach((sample, index) => {
        doc.text(
          `${sample.sampleId}: ${sample.metal} - HMPI: ${sample.hmpi.toFixed(2)} (${sample.riskLevel.level})`,
          25,
          yPos + (index * 8)
        );
      });

      // Save PDF
      doc.save(`AquaSure_Report_${selectedProject}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const handleDownloadExcel = () => {
    const csvContent = [
      // Headers
      [
        'Sample ID',
        'Project', 
        'Location',
        'Metal',
        'Si (mg/L)',
        'Ii',
        'Mi',
        'HMPI',
        'Risk Level',
        'Date',
        'WHO Limit',
        'BBI Limit',
        'Exceeds WHO',
        'Exceeds BBI'
      ].join(','),
      // Data rows
      ...reportData.samples.map(sample => [
        sample.sampleId,
        sample.project?.name.split(' - ')[1] || 'Unknown',
        `${sample.district} ${sample.city}`,
        sample.metal,
        sample.Si,
        sample.Ii,
        sample.Mi,
        sample.hmpi.toFixed(2),
        sample.riskLevel.level,
        sample.date,
        standards.WHO[sample.metal as keyof typeof standards.WHO] || 'N/A',
        standards.BBI[sample.metal as keyof typeof standards.BBI] || 'N/A',
        sample.Si > (standards.WHO[sample.metal as keyof typeof standards.WHO] || Infinity) ? 'Yes' : 'No',
        sample.Si > (standards.BBI[sample.metal as keyof typeof standards.BBI] || Infinity) ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AquaSure_Report_${selectedProject}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate comprehensive water quality analysis reports</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleDownloadExcel} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select project and report type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects - Comprehensive Report</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                  <SelectItem value="summary">Executive Summary</SelectItem>
                  <SelectItem value="technical">Technical Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <div id="report-content" className="space-y-6">
        {/* Report Header */}
        <Card>
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Water Quality Analysis Report</CardTitle>
                {selectedProjectData ? (
                  <CardDescription className="text-lg mt-2">
                    {selectedProjectData.name}
                  </CardDescription>
                ) : (
                  <CardDescription className="text-lg mt-2">
                    Comprehensive Multi-Project Analysis
                  </CardDescription>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  Generated: {new Date().toLocaleDateString()}
                </div>
                {selectedProjectData && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    {selectedProjectData.district}, {selectedProjectData.city}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{reportData.summary.totalSamples}</div>
                <div className="text-sm text-gray-500">Total Samples Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{reportData.summary.projects}</div>
                <div className="text-sm text-gray-500">
                  {selectedProject === 'all' ? 'Projects Covered' : 'Project'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {reportData.summary.averageHMPI.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Average HMPI</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{reportData.summary.highRiskCount}</div>
                <div className="text-sm text-gray-500">High Risk Samples</div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="prose max-w-none">
              <p>
                This report presents a comprehensive analysis of water quality data collected from{' '}
                {selectedProject === 'all' 
                  ? `${reportData.summary.projects} projects across multiple locations`
                  : `the ${selectedProjectData?.name} project`
                }. 
                A total of {reportData.summary.totalSamples} water samples were analyzed for heavy metal contamination 
                using the Heavy Metal Pollution Index (HMPI) methodology.
              </p>
              
              <p>
                The analysis reveals an average HMPI of {reportData.summary.averageHMPI.toFixed(2)}, with{' '}
                {reportData.summary.highRiskCount} samples ({((reportData.summary.highRiskCount / reportData.summary.totalSamples) * 100).toFixed(1)}%) 
                classified as high or very high risk for human consumption.
              </p>

              {reportData.summary.highRiskCount > 0 && (
                <p className="text-red-700 font-medium">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Immediate attention is required for {reportData.summary.highRiskCount} samples that exceed safe consumption limits.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Level Distribution</CardTitle>
              <CardDescription>Classification of samples by pollution risk</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metal Contamination Analysis</CardTitle>
              <CardDescription>Heavy metal distribution and average HMPI</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metalChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Sample Count" />
                  <Bar dataKey="avgHMPI" fill="#EF4444" name="Avg HMPI" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sample Data */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Sample Analysis</CardTitle>
            <CardDescription>Individual sample results and risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Sample ID</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Metal</th>
                    <th className="text-left p-3">Si (mg/L)</th>
                    <th className="text-left p-3">HMPI</th>
                    <th className="text-left p-3">Risk Level</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.samples.map((sample) => (
                    <tr key={sample.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{sample.sampleId}</td>
                      <td className="p-3">{sample.district}, {sample.city}</td>
                      <td className="p-3">{sample.metal}</td>
                      <td className="p-3">{sample.Si.toFixed(3)}</td>
                      <td className="p-3 font-bold">{sample.hmpi.toFixed(2)}</td>
                      <td className="p-3">
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: sample.riskLevel.color,
                            color: sample.riskLevel.color 
                          }}
                        >
                          {sample.riskLevel.level}
                        </Badge>
                      </td>
                      <td className="p-3">{sample.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Standards Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Standards Compliance Analysis</CardTitle>
            <CardDescription>Comparison against WHO and BBI standards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">WHO Standards Compliance</h4>
                {Object.entries(standards.WHO).map(([metal, limit]) => {
                  const metalSamples = reportData.samples.filter(s => s.metal === metal);
                  const violations = metalSamples.filter(s => s.Si > limit).length;
                  const complianceRate = metalSamples.length > 0 
                    ? ((metalSamples.length - violations) / metalSamples.length * 100) 
                    : 100;
                  
                  return (
                    <div key={metal} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{metal}</span>
                        <span className="text-sm">{complianceRate.toFixed(1)}% compliant</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${complianceRate}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {violations}/{metalSamples.length} samples exceed limit ({limit} mg/L)
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <h4 className="font-medium mb-3">BBI Standards Compliance</h4>
                {Object.entries(standards.BBI).map(([metal, limit]) => {
                  const metalSamples = reportData.samples.filter(s => s.metal === metal);
                  const violations = metalSamples.filter(s => s.Si > limit).length;
                  const complianceRate = metalSamples.length > 0 
                    ? ((metalSamples.length - violations) / metalSamples.length * 100) 
                    : 100;
                  
                  return (
                    <div key={metal} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{metal}</span>
                        <span className="text-sm">{complianceRate.toFixed(1)}% compliant</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${complianceRate}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {violations}/{metalSamples.length} samples exceed limit ({limit} mg/L)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.summary.highRiskCount > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Immediate Action Required</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Restrict water usage from high-risk sample locations</li>
                    <li>• Implement immediate treatment protocols for contaminated sources</li>
                    <li>• Conduct follow-up sampling within 30 days</li>
                  </ul>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Monitoring Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Increase sampling frequency for high-risk areas</li>
                  <li>• Establish continuous monitoring systems</li>
                  <li>• Regular calibration of testing equipment</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Long-term Strategy</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Develop comprehensive water treatment infrastructure</li>
                  <li>• Community education on water safety practices</li>
                  <li>• Regular reporting to regulatory authorities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Footer */}
        <Card>
          <CardContent className="pt-6">
            <Separator className="mb-4" />
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                Report generated by AquaSure Water Quality Monitoring System
              </div>
              <div>
                {new Date().toLocaleDateString()} • Page 1 of 1
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}