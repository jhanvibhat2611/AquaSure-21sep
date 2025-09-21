/*
  # AquaSure Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `created_at` (timestamp)
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location_city` (text)
      - `location_district` (text)
      - `location_state` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, foreign key to users)
    - `samples`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `sample_id` (text, unique)
      - `metal` (text)
      - `concentration` (decimal)
      - `date_collected` (date)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `hmpi_value` (decimal)
      - `risk_level` (text)
      - `created_at` (timestamp)
    - `alerts`
      - `id` (uuid, primary key)
      - `sample_id` (uuid, foreign key to samples)
      - `priority` (text)
      - `risk_level` (text)
      - `status` (text)
      - `recommended_action` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('scientist', 'policy-maker', 'researcher')),
  created_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_city text NOT NULL,
  location_district text NOT NULL,
  location_state text NOT NULL,
  description text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create samples table
CREATE TABLE IF NOT EXISTS samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  sample_id text UNIQUE NOT NULL,
  metal text NOT NULL,
  concentration decimal NOT NULL,
  date_collected date NOT NULL,
  latitude decimal NOT NULL,
  longitude decimal NOT NULL,
  hmpi_value decimal NOT NULL,
  risk_level text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id uuid REFERENCES samples(id) ON DELETE CASCADE,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  risk_level text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  recommended_action text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for projects table
CREATE POLICY "Anyone can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Scientists can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('scientist', 'policy-maker')
    )
  );

-- Create policies for samples table
CREATE POLICY "Anyone can read samples"
  ON samples
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Scientists can create samples"
  ON samples
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'scientist'
    )
  );

-- Create policies for alerts table
CREATE POLICY "Anyone can read alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Scientists can create alerts"
  ON alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'scientist'
    )
  );

CREATE POLICY "Policy makers can update alerts"
  ON alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('scientist', 'policy-maker')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_samples_project_id ON samples(project_id);
CREATE INDEX IF NOT EXISTS idx_samples_sample_id ON samples(sample_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sample_id ON alerts(sample_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);