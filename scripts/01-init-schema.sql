-- ============================================
-- Corominas SEO Reporting System - Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DATASOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS datasources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mangools', 'semrush')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MANGOOLS DOMAINS TABLE
-- ============================================
CREATE TABLE mangools_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datasource_id UUID NOT NULL REFERENCES datasources(id) ON DELETE CASCADE,
  tracking_id TEXT NOT NULL UNIQUE,  -- This is the _id from Mangools API
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_datasources_project_id ON datasources(project_id);
CREATE INDEX IF NOT EXISTS idx_datasources_type ON datasources(type);
CREATE INDEX IF NOT EXISTS idx_mangools_domains_datasource_id ON mangools_domains(datasource_id);
CREATE INDEX IF NOT EXISTS idx_mangools_domains_tracking_id ON mangools_domains(tracking_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mangools_domains ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "authenticated_users_all_clients" ON clients;
CREATE POLICY "authenticated_users_all_clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_users_all_projects" ON projects;
CREATE POLICY "authenticated_users_all_projects" ON projects
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_users_all_datasources" ON datasources;
CREATE POLICY "authenticated_users_all_datasources" ON datasources
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_users_all_mangools_domains" ON mangools_domains;
CREATE POLICY "authenticated_users_all_mangools_domains" ON mangools_domains
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_datasources_updated_at ON datasources;
CREATE TRIGGER update_datasources_updated_at
  BEFORE UPDATE ON datasources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mangools_domains_updated_at ON mangools_domains;
CREATE TRIGGER update_mangools_domains_updated_at
  BEFORE UPDATE ON mangools_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
