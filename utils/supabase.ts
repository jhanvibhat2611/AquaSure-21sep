import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  role: 'scientist' | 'policy-maker' | 'researcher';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  location_city: string;
  location_district: string;
  location_state: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

export interface Sample {
  id: string;
  project_id: string;
  sample_id: string;
  metal: string;
  concentration: number;
  date_collected: string;
  latitude: number;
  longitude: number;
  hmpi_value: number;
  risk_level: string;
  created_at: string;
  project?: Project;
}

export interface Alert {
  id: string;
  sample_id: string;
  priority: 'low' | 'medium' | 'high';
  risk_level: string;
  status: 'active' | 'acknowledged' | 'resolved';
  recommended_action?: string;
  created_at: string;
  sample?: Sample;
}

// Auth functions
export async function signUp(email: string, password: string, name: string, role: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (error) throw error;

  // Create user record in our users table
  if (data.user) {
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          name,
          email,
          role,
        },
      ]);

    if (userError) throw userError;
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<DatabaseUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

// Project functions
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'created_by'>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        ...project,
        created_by: user?.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Sample functions
export async function getSamples(): Promise<Sample[]> {
  const { data, error } = await supabase
    .from('samples')
    .select(`
      *,
      project:projects(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSamplesByProject(projectId: string): Promise<Sample[]> {
  const { data, error } = await supabase
    .from('samples')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSample(sample: Omit<Sample, 'id' | 'created_at' | 'project'>) {
  const { data, error } = await supabase
    .from('samples')
    .insert([sample])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createBulkSamples(samples: Omit<Sample, 'id' | 'created_at' | 'project'>[]) {
  const { data, error } = await supabase
    .from('samples')
    .insert(samples)
    .select();

  if (error) throw error;
  return data;
}

// Alert functions
export async function getAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select(`
      *,
      sample:samples(
        *,
        project:projects(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAlert(alert: Omit<Alert, 'id' | 'created_at' | 'sample'>) {
  const { data, error } = await supabase
    .from('alerts')
    .insert([alert])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAlertStatus(alertId: string, status: 'active' | 'acknowledged' | 'resolved') {
  const { data, error } = await supabase
    .from('alerts')
    .update({ status })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Utility functions
export function calculateHMPI(concentration: number, Ii: number, Mi: number): number {
  const hmpi = (concentration / Ii) * Mi * 100;
  return Math.round(hmpi * 100) / 100;
}

export function getRiskLevel(hmpi: number): string {
  if (hmpi >= 100) return 'Very High Risk';
  if (hmpi >= 50) return 'High Risk';
  if (hmpi >= 25) return 'Moderate Risk';
  if (hmpi >= 10) return 'Low Risk';
  return 'Safe';
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'Very High Risk': return '#DC2626';
    case 'High Risk': return '#EA580C';
    case 'Moderate Risk': return '#D97706';
    case 'Low Risk': return '#65A30D';
    case 'Safe': return '#059669';
    default: return '#666666';
  }
}