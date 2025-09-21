// utils/auth.ts
export type UserRole = 'scientist' | 'policy-maker' | 'researcher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@aquasure.com',
    role: 'scientist'
  },
  {
    id: '2', 
    name: 'Michael Chen',
    email: 'michael.chen@gov.in',
    role: 'policy-maker'
  },
  {
    id: '3',
    name: 'Research User',
    email: 'research@aquasure.com', 
    role: 'researcher'
  }
];

export const rolePermissions = {
  scientist: [
    'dashboard',
    'data-entry', 
    'calculations',
    'visualization',
    'projects',
    'reports',
    'trends',
    'comparison',
    'alerts'
  ],
  'policy-maker': [
    'policies',
    'projects', 
    'reports',
    'trends',
    'comparison', 
    'alerts',
    'visualization'
  ],
  researcher: [
    'visualization',
    'projects',
    'reports', 
    'trends',
    'comparison',
    'alerts'
  ]
};

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'scientist': return 'Water Quality Scientist';
    case 'policy-maker': return 'Environmental Policy Maker';
    case 'researcher': return 'Research Analyst';
    default: return 'User';
  }
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'scientist': 
      return 'Full access to data entry, calculations, and analysis tools';
    case 'policy-maker':
      return 'Access to policy settings, reports, and threshold management';
    case 'researcher':
      return 'View-only access to visualization and research data';
    default: 
      return '';
  }
}