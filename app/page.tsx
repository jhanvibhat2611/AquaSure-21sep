'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, Users, FlaskConical, ScrollText, UserPlus } from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { signIn, signUp, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const roles = [
    { 
      value: 'scientist',
      label: 'Water Quality Scientist',
      description: 'Full access to data entry, calculations, and analysis tools',
      icon: <FlaskConical className="h-8 w-8" />,
      color: 'text-blue-600'
    },
    { 
      value: 'policy-maker',
      label: 'Environmental Policy Maker', 
      description: 'Access to policy settings, reports, and threshold management',
      icon: <ScrollText className="h-8 w-8" />,
      color: 'text-green-600'
    },
    { 
      value: 'researcher',
      label: 'Research Analyst',
      description: 'View-only access to visualization and research data',
      icon: <Users className="h-8 w-8" />,
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        router.push('/dashboard');
      } else {
        if (!name || !role) {
          setError('Please fill in all fields');
          return;
        }
        await signUp(email, password, name, role);
        // User will be redirected automatically after successful signup
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('');
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

        {/* Auth Form */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {mode === 'signin' ? <Droplets className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin' 
                ? 'Enter your credentials to access the dashboard'
                : 'Create a new account to get started'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={submitting}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole} disabled={submitting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((roleOption) => (
                          <SelectItem key={roleOption.value} value={roleOption.value}>
                            {roleOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={submitting}
                  required
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
                  disabled={submitting}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button 
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  resetForm();
                }}
                disabled={submitting}
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Role Information */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {roles.map((roleOption) => (
            <Card key={roleOption.value} className="border-gray-200">
              <CardHeader className="text-center pb-4">
                <div className={`flex justify-center mb-3 ${roleOption.color}`}>
                  {roleOption.icon}
                </div>
                <CardTitle className="text-lg">
                  {roleOption.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm leading-relaxed">
                  {roleOption.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}