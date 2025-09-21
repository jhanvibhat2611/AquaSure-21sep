'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, getRoleDisplayName, getRoleDescription } from '@/utils/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Droplets, Users, FlaskConical, ScrollText } from 'lucide-react';

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const roles: { role: UserRole; icon: React.ReactNode; color: string }[] = [
    { 
      role: 'scientist', 
      icon: <FlaskConical className="h-8 w-8" />,
      color: 'border-blue-200 hover:border-blue-400'
    },
    { 
      role: 'policy-maker', 
      icon: <ScrollText className="h-8 w-8" />,
      color: 'border-green-200 hover:border-green-400'
    },
    { 
      role: 'researcher', 
      icon: <Users className="h-8 w-8" />,
      color: 'border-purple-200 hover:border-purple-400'
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    
    // Pre-fill credentials for demo
    if (role === 'scientist') {
      setEmail('scientist@aquasure.com');
      setPassword('password');
    } else if (role === 'policy-maker') {
      setEmail('policy@aquasure.com');
      setPassword('password');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleLogin = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    setError('');

    try {
      const success = await login(selectedRole, email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Droplets className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">AquaSure</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Water Quality Monitoring System</p>
          <p className="text-sm text-gray-500">Save Water, Save Life - Advanced Environmental Analysis Platform</p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
              Select Your Role to Continue
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {roles.map(({ role, icon, color }) => (
                <Card 
                  key={role}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${color}`}
                  onClick={() => handleRoleSelect(role)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3 text-blue-600">
                      {icon}
                    </div>
                    <CardTitle className="text-lg">
                      {getRoleDisplayName(role)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-sm leading-relaxed">
                      {getRoleDescription(role)}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Demo Credentials:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Scientist:</strong> scientist@aquasure.com / password</p>
                <p><strong>Policy Maker:</strong> policy@aquasure.com / password</p>
                <p><strong>Researcher:</strong> No login required</p>
              </div>
            </div>
          </div>
        ) : (
          /* Login Form */
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {roles.find(r => r.role === selectedRole)?.icon}
                Login as {getRoleDisplayName(selectedRole)}
              </CardTitle>
              <CardDescription>
                {selectedRole === 'researcher' 
                  ? 'Click continue to access the research dashboard'
                  : 'Enter your credentials to access the dashboard'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {selectedRole !== 'researcher' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleLogin} 
                  disabled={loading || (selectedRole !== 'researcher' && (!email || !password))}
                  className="flex-1"
                >
                  {loading ? 'Loading...' : selectedRole === 'researcher' ? 'Continue' : 'Login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}