'use client';
import { useState } from 'react';
import { projects, samples, calculateHMPI, getRiskLevel, standards } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter
} from 'recharts';
import { BarChart3, Shuffle, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ComparisonPage() {
  const [comparisonType, setComparisonType] = useState<string>('projects');
  const [selectedProjects, setSelectedProjects] = useState<string[]>(['p1', 'p2']);
  const [selectedMetals, setSelectedMetals] = useState<string[]>(['Lead', 'Arsenic']);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['Varanasi', 'New Delhi']);

  // Process data for different comparison types
  const getComparisonData = () => {
    switch (comparisonType) {
      case 'projects':
        return getProjectComparison();
      case 'metals':
        return getMetalComparison();
      case 'districts':
        return getDistrictComparison();
      case 'standards':
        return getStandardsComparison();
      default:
        return { data: [], summary: [] };
    }
  };

  const getProjectComparison = () => {
    const data = selectedProjects.map(projectId => {
      const project = projects.find(p => p.id === projectId);
      const projectSamples = samples.filter(s => s.projectId === projectId);
      
      if (!project || projectSamples.length === 0) return null;

      const hmpiValues = projectSamples.map(s => calculateHMPI(s));
      const avgHMPI = hmpiValues.reduce((sum, hmpi) => sum + hmpi, 0) / hmpiValues.length;
      const maxHMPI = Math.max(...hmpiValues);
      const minHMPI = Math.min(...hmpiValues);
      const highRiskCount = projectSamples.filter(s => {
        const risk = getRiskLevel(calculateHMPI(s));
        return risk.level === 'High Risk' || risk.level === 'Very High Risk';
      }).length;

      return {
        name: project.name.split(' - ')[1] || project.name,
        fullName: project.name,
        samples: projectSamples.length,
        avgHMPI: Number(avgHMPI.toFixed(2)),
        maxHMPI: Number(maxHMPI.toFixed(2)),
        minHMPI: Number(minHMPI.toFixed(2)),
        highRiskCount,
        riskPercent: Number(((highRiskCount / projectSamples.length) * 100).toFixed(1))
      };
    }).filter(Boolean);

    const summary = data.map(item => ({
      category: item?.name || '',
      avgHMPI: item?.avgHMPI || 0,
      samples: item?.samples || 0,
      highRisk: item?.highRiskCount || 0
    }));

    return { data, summary };
  };

  const getMetalComparison = () => {
    const data = selectedMetals.map(metal => {
      const metalSamples = samples.filter(s => s.metal === metal);
      
      if (metalSamples.length === 0) return null;

      const hmpiValues = metalSamples.map(s => calculateHMPI(s));
      const avgHMPI = hmpiValues.reduce((sum, hmpi) => sum + hmpi, 0) / hmpiValues.length;
      const avgConcentration = metalSamples.reduce((sum, s) => sum + s.Si, 0) / metalSamples.length;
      const whoLimit = standards.WHO[metal as keyof typeof standards.WHO] || 0;
      const bbiLimit = standards.BBI[metal as keyof typeof standards.BBI] || 0;
      const whoViolations = metalSamples.filter(s => s.Si > whoLimit).length;
      const bbiViolations = metalSamples.filter(s => s.Si > bbiLimit).length;

      return {
        name: metal,
        samples: metalSamples.length,
        avgHMPI: Number(avgHMPI.toFixed(2)),
        avgConcentration: Number(avgConcentration.toFixed(4)),
        whoLimit,
        bbiLimit,
        whoViolations,
        bbiViolations,
        whoComplianceRate: Number(((metalSamples.length - whoViolations) / metalSamples.length * 100).toFixed(1)),
        bbiComplianceRate: Number(((metalSamples.length - bbiViolations) / metalSamples.length * 100).toFixed(1))
      };
    }).filter(Boolean);

    const summary = data.map(item => ({
      category: item?.name || '',
      avgHMPI: item?.avgHMPI || 0,
      samples: item?.samples || 0,
      whoCompliance: item?.whoComplianceRate || 0
    }));

    return { data, summary };
  };

  const getDistrictComparison = () => {
    const data = selectedDistricts.map(district => {
      const districtSamples = samples.filter(s => s.district === district);
      
      if (districtSamples.length === 0) return null;

      const hmpiValues = districtSamples.map(s => calculateHMPI(s));
      const avgHMPI = hmpiValues.reduce((sum, hmpi) => sum + hmpi, 0) / hmpiValues.length;
      const uniqueProjects = new Set(districtSamples.map(s => s.projectId)).size;
      const metals = [...new Set(districtSamples.map(s => s.metal))];
      const highRiskCount = districtSamples.filter(s => {
        const risk = getRiskLevel(calculateHMPI(s));
        return risk.level === 'High Risk' || risk.level === 'Very High Risk';
      }).length;

      return {
        name: district,
        samples: districtSamples.length,
        projects: uniqueProjects,
        metals: metals.length,
        avgHMPI: Number(avgHMPI.toFixed(2)),
        highRiskCount,
        riskPercent: Number(((highRiskCount / districtSamples.length) * 100).toFixed(1))
      };
    }).filter(Boolean);

    const summary = data.map(item => ({
      category: item?.name || '',
      avgHMPI: item?.avgHMPI || 0,
      samples: item?.samples || 0,
      projects: item?.projects || 0
    }));

    return { data, summary };
  };

  const getStandardsComparison = () => {
    const allMetals = [...new Set(samples.map(s => s.metal))];
    
    const data = allMetals.map(metal => {
      const metalSamples = samples.filter(s => s.metal === metal);
      const avgConcentration = metalSamples.reduce((sum, s) => sum + s.Si, 0) / metalSamples.length;
      
      return {
        metal,
        avgConcentration: Number(avgConcentration.toFixed(4)),
        whoStandard: standards.WHO[metal as keyof typeof standards.WHO] || 0,
        bbiStandard: standards.BBI[metal as keyof typeof standards.BBI] || 0,
        samples: metalSamples.length
      };
    });

    const summary = data.map(item => ({
      category: item.metal,
      current: item.avgConcentration,
      whoStandard: item.whoStandard,
      bbiStandard: item.bbiStandard
    }));

    return { data, summary };
  };

  const { data, summary } = getComparisonData();

  // Get available options for selectors
  const availableProjects = projects.map(p => ({ id: p.id, name: p.name.split(' - ')[1] || p.name }));
  const availableMetals = [...new Set(samples.map(s => s.metal))];
  const availableDistricts = [...new Set(samples.map(s => s.district))];

  const handleSelectionChange = (type: string, values: string[]) => {
    switch (type) {
      case 'projects':
        setSelectedProjects(values);
        break;
      case 'metals':
        setSelectedMetals(values);
        break;
      case 'districts':
        setSelectedDistricts(values);
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comparative Analysis</h1>
        <p className="text-gray-600">Compare water quality data across projects, metals, and locations</p>
      </div>

      {/* Comparison Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Comparison Settings
          </CardTitle>
          <CardDescription>Select what you want to compare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Comparison Type</label>
                <Select value={comparisonType} onValueChange={setComparisonType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Compare Projects</SelectItem>
                    <SelectItem value="metals">Compare Metals</SelectItem>
                    <SelectItem value="districts">Compare Districts</SelectItem>
                    <SelectItem value="standards">Compare to Standards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Selection Based on Comparison Type */}
            {comparisonType === 'projects' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Projects to Compare</label>
                <div className="flex flex-wrap gap-2">
                  {availableProjects.map(project => (
                    <Button
                      key={project.id}
                      variant={selectedProjects.includes(project.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newSelection = selectedProjects.includes(project.id)
                          ? selectedProjects.filter(p => p !== project.id)
                          : [...selectedProjects, project.id];
                        handleSelectionChange('projects', newSelection);
                      }}
                    >
                      {project.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {comparisonType === 'metals' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Metals to Compare</label>
                <div className="flex flex-wrap gap-2">
                  {availableMetals.map(metal => (
                    <Button
                      key={metal}
                      variant={selectedMetals.includes(metal) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newSelection = selectedMetals.includes(metal)
                          ? selectedMetals.filter(m => m !== metal)
                          : [...selectedMetals, metal];
                        handleSelectionChange('metals', newSelection);
                      }}
                    >
                      {metal}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {comparisonType === 'districts' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Districts to Compare</label>
                <div className="flex flex-wrap gap-2">
                  {availableDistricts.map(district => (
                    <Button
                      key={district}
                      variant={selectedDistricts.includes(district) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newSelection = selectedDistricts.includes(district)
                          ? selectedDistricts.filter(d => d !== district)
                          : [...selectedDistricts, district];
                        handleSelectionChange('districts', newSelection);
                      }}
                    >
                      {district}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Charts */}
      {summary.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>
                {comparisonType === 'projects' && 'Project HMPI Comparison'}
                {comparisonType === 'metals' && 'Metal Contamination Levels'}
                {comparisonType === 'districts' && 'District Pollution Index'}
                {comparisonType === 'standards' && 'Current vs Standards'}
              </CardTitle>
              <CardDescription>Comparative analysis visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  {comparisonType === 'standards' ? (
                    <>
                      <Bar dataKey="current" fill="#EF4444" name="Current Level" />
                      <Bar dataKey="whoStandard" fill="#10B981" name="WHO Standard" />
                      <Bar dataKey="bbiStandard" fill="#3B82F6" name="BBI Standard" />
                    </>
                  ) : (
                    <Bar dataKey="avgHMPI" fill="#3B82F6" name="Average HMPI" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scatter Plot or Additional Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>
                {comparisonType === 'projects' && 'Sample Count vs Risk'}
                {comparisonType === 'metals' && 'WHO Compliance Rate'}
                {comparisonType === 'districts' && 'Coverage Analysis'}
                {comparisonType === 'standards' && 'Standards Violation Rate'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {comparisonType === 'projects' && (
                  <ScatterChart data={data}>
                    <CartesianGrid />
                    <XAxis dataKey="samples" name="Samples" />
                    <YAxis dataKey="riskPercent" name="Risk %" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="riskPercent" fill="#EF4444" />
                  </ScatterChart>
                )}
                {comparisonType === 'metals' && (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="whoComplianceRate" fill="#10B981" name="WHO Compliance %" />
                    <Bar dataKey="bbiComplianceRate" fill="#3B82F6" name="BBI Compliance %" />
                  </BarChart>
                )}
                {(comparisonType === 'districts' || comparisonType === 'standards') && (
                  <BarChart data={summary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey={comparisonType === 'districts' ? 'samples' : 'current'} 
                      fill="#8B5CF6" 
                      name={comparisonType === 'districts' ? 'Samples' : 'Current Level'} 
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
          <CardDescription>
            Comprehensive comparison data for selected items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Samples</th>
                    <th className="text-left p-3">Avg HMPI</th>
                    {comparisonType === 'projects' && (
                      <>
                        <th className="text-left p-3">High Risk</th>
                        <th className="text-left p-3">Risk %</th>
                        <th className="text-left p-3">Status</th>
                      </>
                    )}
                    {comparisonType === 'metals' && (
                      <>
                        <th className="text-left p-3">Avg Conc.</th>
                        <th className="text-left p-3">WHO Limit</th>
                        <th className="text-left p-3">WHO Compliance</th>
                      </>
                    )}
                    {comparisonType === 'districts' && (
                      <>
                        <th className="text-left p-3">Projects</th>
                        <th className="text-left p-3">Metals</th>
                        <th className="text-left p-3">Risk Status</th>
                      </>
                    )}
                    {comparisonType === 'standards' && (
                      <>
                        <th className="text-left p-3">WHO Standard</th>
                        <th className="text-left p-3">BBI Standard</th>
                        <th className="text-left p-3">Compliance</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => {
                    const riskLevel = 'avgHMPI' in item ? getRiskLevel(item.avgHMPI as number) : null;
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3">{item.samples}</td>
                        {'avgHMPI' in item && (
                          <td className="p-3 font-bold">{(item.avgHMPI as number).toFixed(2)}</td>
                        )}
                        
                        {comparisonType === 'projects' && 'highRiskCount' in item && (
                          <>
                            <td className="p-3">{item.highRiskCount}</td>
                            <td className="p-3">{item.riskPercent}%</td>
                            <td className="p-3">
                              {riskLevel && (
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    borderColor: riskLevel.color,
                                    color: riskLevel.color 
                                  }}
                                >
                                  {riskLevel.level}
                                </Badge>
                              )}
                            </td>
                          </>
                        )}
                        
                        {comparisonType === 'metals' && 'avgConcentration' in item && (
                          <>
                            <td className="p-3">{(item.avgConcentration as number).toFixed(4)}</td>
                            <td className="p-3">{item.whoLimit}</td>
                            <td className="p-3">
                              <Badge 
                                variant={(item.whoComplianceRate as number) >= 90 ? "outline" : "destructive"}
                                className={(item.whoComplianceRate as number) >= 90 ? "text-green-600" : ""}
                              >
                                {item.whoComplianceRate}%
                              </Badge>
                            </td>
                          </>
                        )}
                        
                        {comparisonType === 'districts' && 'projects' in item && (
                          <>
                            <td className="p-3">{item.projects}</td>
                            <td className="p-3">{item.metals}</td>
                            <td className="p-3">
                              {(item.riskPercent as number) > 20 ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  High Risk
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600">
                                  Manageable
                                </Badge>
                              )}
                            </td>
                          </>
                        )}

                        {comparisonType === 'standards' && 'whoStandard' in item && (
                          <>
                            <td className="p-3">{item.whoStandard}</td>
                            <td className="p-3">{item.bbiStandard}</td>
                            <td className="p-3">
                              {(item.avgConcentration as number) <= (item.whoStandard as number) ? (
                                <Badge variant="outline" className="text-green-600">Compliant</Badge>
                              ) : (
                                <Badge variant="destructive">Exceeds</Badge>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No comparison data</h3>
              <p className="text-gray-500">
                Select items to compare using the buttons above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>Important observations from the comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Best Performers</h4>
                {comparisonType === 'projects' && data.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      {(data as any[]).reduce((best, current) => 
                        current.avgHMPI < best.avgHMPI ? current : best
                      ).name}
                    </p>
                    <p className="text-xs text-green-600">
                      Lowest average HMPI of {(data as any[]).reduce((best, current) => 
                        current.avgHMPI < best.avgHMPI ? current : best
                      ).avgHMPI}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Areas Needing Attention</h4>
                {comparisonType === 'projects' && data.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      {(data as any[]).reduce((worst, current) => 
                        current.avgHMPI > worst.avgHMPI ? current : worst
                      ).name}
                    </p>
                    <p className="text-xs text-red-600">
                      Highest average HMPI of {(data as any[]).reduce((worst, current) => 
                        current.avgHMPI > worst.avgHMPI ? current : worst
                      ).avgHMPI}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}