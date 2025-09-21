'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (role: UserRole, email?: string, password?: string): Promise<boolean> => {
    // For researcher, no authentication required
    if (role === 'researcher') {
      setUser({
        id: '3',
        name: 'Research User',
        email: 'research@aquasure.com',
        role: 'researcher'
      });
      return true;
    }

    // For scientist and policy-maker, simulate authentication
    if (email && password) {
      if (role === 'scientist' && email === 'scientist@aquasure.com' && password === 'password') {
        setUser({
          id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'scientist@aquasure.com',
          role: 'scientist'
        });
        return true;
      }
      
      if (role === 'policy-maker' && email === 'policy@aquasure.com' && password === 'password') {
        setUser({
          id: '2',
          name: 'Michael Chen',
          email: 'policy@aquasure.com',
          role: 'policy-maker'
        });
        return true;
      }
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}