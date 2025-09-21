'use client';
import { useState } from 'react';
import { projects, samples, calculateHMPI, getRiskLevel } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';

export default function TrendsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedMetal, setSelectedMetal] = useState<string>('all');
  const [timeFrame, setTimeFrame] = useState<string>('3months');

  // Process data for trends
  const processedSamples = samples.map(sample => ({
    ...sample,
    hmpi: calculateHMPI(sample),
    riskLevel: getRiskLevel(calculateHMPI(sample)),
    project: projects.find(p => p.id === sample.projectId),
    month: new Date(sample.date).toLocaleString('default', { month: 'short', year: '2-digit' })
  }));

  // Filter samples
  const filteredSamples = processedSamples.filter(sample => {
    if (selectedProject !== 'all' && sample.projectId !== selectedProject) return false;
    if (selectedMetal !== 'all' && sample.metal !== selectedMetal) return false;
    return true;
  });

  // Time series data for HMPI trends
  const timeSeriesData = filteredSamples
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, sample) => {
      const month = sample.month;
      const existing = acc.find(item => item.month === month);
      
      if (existing) {
        existing.hmpi = (existing.hmpi * existing.count + sample.hmpi) / (existing.count + 1);
        existing.count += 1;
      } else {
        acc.push({
          month,
          hmpi: sample.hmpi,
          count: 1,
          date: sample.date
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; hmpi: number; count: number; date: string }>);

  // District comparison data
  const districtData = filteredSamples.reduce((acc, sample) => {
    const district = sample.district;
    const existing = acc.find(item => item.district === district);
    
    if (existing) {
      existing.avgHMPI = (existing.avgHMPI * existing.samples + sample.hmpi) / (existing.samples + 1);
      existing.samples += 1;
      if (sample.riskLevel.level === 'High Risk' || sample.riskLevel.level === 'Very High Risk') {
        existing.highRisk += 1;
      }
    } else {
      acc.push({
        district,
        avgHMPI: sample.hmpi,
        samples: 1,
        highRisk: (sample.riskLevel.level === 'High Risk' || sample.riskLevel.level === 'Very High Risk') ? 1 : 0
      });
    }
    
    return acc;
  }, [] as Array<{ district: string; avgHMPI: number; samples: number; highRisk: number }>)
  .sort((a, b) => b.avgHMPI - a.avgHMPI);

  // Metal comparison data
  const metalData = filteredSamples.reduce((acc, sample) => {
    const metal = sample.metal;
    const existing = acc.find(item => item.metal === metal);
    
    if (existing) {
      existing.avgHMPI = (existing.avgHMPI * existing.samples + sample.hmpi) / (existing.samples + 1);
      existing.avgConcentration = (existing.avgConcentration * existing.samples + sample.Si) / (existing.samples + 1);
      existing.samples += 1;
    } else {
      acc.push({
        metal,
        avgHMPI: sample.hmpi,
        avgConcentration: sample.Si,
        samples: 1
      });
    }
    
    return acc;
  }, [] as Array<{ metal: string; avgHMPI: number; avgConcentration: number; samples: number }>);

  // Calculate trend statistics
  const trendStats = {
    totalSamples: filteredSamples.length,
    avgHMPI: filteredSamples.length > 0 
      ? filteredSamples.reduce((sum, s) => sum + s.hmpi, 0) / filteredSamples.length 
      : 0,
    trend: timeSeriesData.length > 1 
      ? timeSeriesData[timeSeriesData.length - 1].hmpi - timeSeriesData[0].hmpi
      : 0,
    highRiskLocations: new Set(
      filteredSamples
        .filter(s => s.riskLevel.level === 'High Risk' || s.riskLevel.level === 'Very High Risk')
        .map(s => s.district)
    ).size
  };

  // Get unique metals for filter
  const uniqueMetals = [...new Set(samples.map(s => s.metal))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trends Analysis</h1>
        <p className="text-gray-600">Monitor water quality trends and patterns over time</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium">Metal Type</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Frame</label>
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trendStats.totalSamples}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average HMPI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trendStats.avgHMPI.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Pollution index</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend Direction</CardTitle>
            {trendStats.trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${trendStats.trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {trendStats.trend >= 0 ? '+' : ''}{trendStats.trend.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {trendStats.trend >= 0 ? 'Increasing' : 'Decreasing'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Areas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{trendStats.highRiskLocations}</div>
            <p className="text-xs text-muted-foreground">Districts affected</p>
          </CardContent>
        </Card>
      </div>

      {/* HMPI Trend Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>HMPI Trend Over Time</CardTitle>
          <CardDescription>
            Average Heavy Metal Pollution Index progression
            {selectedProject !== 'all' && ` for ${projects.find(p => p.id === selectedProject)?.name.split(' - ')[1]}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="hmpiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(2), 'Average HMPI']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="hmpi" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#hmpiGradient)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="hmpi" 
                  stroke="#1E40AF" 
                  strokeWidth={2}
                  dot={{ fill: '#1E40AF', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trend data available</h3>
              <p className="text-gray-500">Adjust your filters to see trend analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* District and Metal Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>District-wise Analysis</CardTitle>
            <CardDescription>Average HMPI by geographical location</CardDescription>
          </CardHeader>
          <CardContent>
            {districtData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={districtData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="district" type="category" width={100} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'avgHMPI' ? value.toFixed(2) : value,
                      name === 'avgHMPI' ? 'Avg HMPI' : 'High Risk Samples'
                    ]}
                  />
                  <Bar dataKey="avgHMPI" fill="#3B82F6" />
                  <Bar dataKey="highRisk" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No district data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metal Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Metal-wise Analysis</CardTitle>
            <CardDescription>Contamination levels by metal type</CardDescription>
          </CardHeader>
          <CardContent>
            {metalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metal" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      value.toFixed(3),
                      name === 'avgHMPI' ? 'Avg HMPI' : 'Avg Concentration (mg/L)'
                    ]}
                  />
                  <Bar dataKey="avgHMPI" fill="#8B5CF6" name="Avg HMPI" />
                  <Bar dataKey="avgConcentration" fill="#10B981" name="Avg Concentration" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No metal data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Trend Analysis</CardTitle>
          <CardDescription>
            Comprehensive breakdown of trends by location and metal type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {districtData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">District</th>
                    <th className="text-left p-3">Samples</th>
                    <th className="text-left p-3">Average HMPI</th>
                    <th className="text-left p-3">High Risk</th>
                    <th className="text-left p-3">Risk Level</th>
                    <th className="text-left p-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {districtData.map((district, index) => {
                    const riskLevel = getRiskLevel(district.avgHMPI);
                    const riskPercent = (district.highRisk / district.samples) * 100;
                    
                    return (
                      <tr key={district.district} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{district.district}</td>
                        <td className="p-3">{district.samples}</td>
                        <td className="p-3 font-bold">{district.avgHMPI.toFixed(2)}</td>
                        <td className="p-3">
                          {district.highRisk}/{district.samples} ({riskPercent.toFixed(0)}%)
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: riskLevel.color,
                              color: riskLevel.color 
                            }}
                          >
                            {riskLevel.level}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {index === 0 ? (
                            <Badge variant="destructive">Highest</Badge>
                          ) : index < 2 ? (
                            <Badge variant="outline" className="text-orange-600">Above Avg</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">Below Avg</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No detailed data available</h3>
              <p className="text-gray-500">Adjust your filters to see detailed trend analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Important observations from the trend analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Positive Trends</h4>
              <div className="space-y-2">
                {districtData.filter(d => d.avgHMPI < 25).length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Low Risk Districts</p>
                      <p className="text-xs text-green-600">
                        {districtData.filter(d => d.avgHMPI < 25).length} district(s) showing low pollution levels
                      </p>
                    </div>
                  </div>
                )}
                {trendStats.trend < 0 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Improving Trend</p>
                      <p className="text-xs text-green-600">
                        Overall HMPI showing downward trend of {Math.abs(trendStats.trend).toFixed(1)} points
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Areas of Concern</h4>
              <div className="space-y-2">
                {districtData.filter(d => d.avgHMPI > 50).length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">High Risk Districts</p>
                      <p className="text-xs text-red-600">
                        {districtData.filter(d => d.avgHMPI > 50).length} district(s) require immediate attention
                      </p>
                    </div>
                  </div>
                )}
                {trendStats.trend > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Worsening Trend</p>
                      <p className="text-xs text-red-600">
                        Overall HMPI increasing by {trendStats.trend.toFixed(1)} points - investigate causes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}