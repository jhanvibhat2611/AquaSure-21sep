'use client';
import { useAuth } from '@/contexts/AuthContext';
import { projects, samples, alerts, calculateHMPI, getRiskLevel } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  FolderOpen,
  TestTube,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  // Calculate statistics
  const totalProjects = projects.length;
  const totalSamples = samples.length;
  const totalAlerts = alerts.filter(a => !a.acknowledged).length;
  
  // Calculate HMPI for all samples
  const samplesWithHMPI = samples.map(sample => ({
    ...sample,
    hmpi: calculateHMPI(sample),
    riskLevel: getRiskLevel(calculateHMPI(sample))
  }));

  // Risk distribution
  const riskDistribution = samplesWithHMPI.reduce((acc, sample) => {
    const level = sample.riskLevel.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskChartData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: samplesWithHMPI.find(s => s.riskLevel.level === level)?.riskLevel.color || '#666'
  }));

  // Project-wise sample distribution
  const projectDistribution = projects.map(project => ({
    name: project.name.split(' - ')[1] || project.name,
    samples: samples.filter(s => s.projectId === project.id).length,
    alerts: alerts.filter(a => a.projectId === project.id && !a.acknowledged).length
  }));

  // Recent activities (mock data)
  const recentActivities = [
    { id: 1, action: 'New sample added', project: 'Ganga Study', time: '2 hours ago' },
    { id: 2, action: 'Alert generated', project: 'Yamuna Study', time: '5 hours ago' },
    { id: 3, action: 'Report generated', project: 'Cauvery Study', time: '1 day ago' },
    { id: 4, action: 'HMPI calculated', project: 'Narmada Study', time: '2 days ago' },
  ];

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'scientist':
        return {
          title: 'Scientific Analysis Dashboard',
          description: 'Monitor water quality data and conduct environmental analysis',
          primaryActions: ['Add New Sample', 'Run Calculations', 'Generate Report']
        };
      case 'policy-maker':
        return {
          title: 'Policy Management Dashboard',
          description: 'Review environmental data and manage policy thresholds',
          primaryActions: ['Review Alerts', 'Update Thresholds', 'View Reports']
        };
      case 'researcher':
        return {
          title: 'Research Analysis Dashboard',
          description: 'Explore environmental data and research insights',
          primaryActions: ['View Visualization', 'Access Reports', 'Analyze Trends']
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Water quality monitoring overview',
          primaryActions: []
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{roleContent.title}</h1>
        <p className="text-gray-600">{roleContent.description}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active monitoring projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Samples</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSamples}</div>
            <p className="text-xs text-muted-foreground">Collected and analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg HMPI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(samplesWithHMPI.reduce((sum, s) => sum + s.hmpi, 0) / samplesWithHMPI.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Pollution index level</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Sample Distribution</CardTitle>
            <CardDescription>Number of samples per project location</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="samples" fill="#3B82F6" />
                <Bar dataKey="alerts" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Sample classification by pollution risk</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest water quality monitoring projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.slice(0, 4).map((project) => {
              const projectSamples = samples.filter(s => s.projectId === project.id);
              const projectAlerts = alerts.filter(a => a.projectId === project.id && !a.acknowledged);
              const avgHMPI = projectSamples.length > 0 
                ? projectSamples.reduce((sum, s) => sum + calculateHMPI(s), 0) / projectSamples.length 
                : 0;

              return (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.district}, {project.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {projectSamples.length} samples
                      </Badge>
                      {projectAlerts.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {projectAlerts.length} alerts
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">HMPI: {avgHMPI.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">{project.createdAt}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.project}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {roleContent.primaryActions.map((action) => (
              <Badge key={action} variant="outline" className="cursor-pointer hover:bg-blue-50">
                {action}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}