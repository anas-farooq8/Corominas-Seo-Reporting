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
  type TEXT NOT NULL CHECK (type IN ('mangools', 'semrush', 'google_analytics')),
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
-- GOOGLE ANALYTICS PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS google_analytics_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datasource_id UUID NOT NULL REFERENCES datasources(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,  -- This is the "name" field from GA API (e.g., "properties/516632017")
  parent TEXT NOT NULL,
  display_name TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DASHBOARD CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datasource_id UUID NOT NULL REFERENCES datasources(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,  -- For Mangools: tracking_id, For GA: property name
  start_date DATE NOT NULL,  -- Start date of the data range
  end_date DATE NOT NULL,    -- End date of the data range
  data JSONB NOT NULL,       -- The cached dashboard data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(datasource_id, resource_id, start_date, end_date)  -- Prevent duplicate cache entries
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_datasources_project_id ON datasources(project_id);
CREATE INDEX IF NOT EXISTS idx_datasources_type ON datasources(type);
CREATE INDEX IF NOT EXISTS idx_mangools_domains_datasource_id ON mangools_domains(datasource_id);
CREATE INDEX IF NOT EXISTS idx_mangools_domains_tracking_id ON mangools_domains(tracking_id);
CREATE INDEX IF NOT EXISTS idx_ga_properties_datasource_id ON google_analytics_properties(datasource_id);
CREATE INDEX IF NOT EXISTS idx_ga_properties_name ON google_analytics_properties(name);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_datasource_id ON dashboard_cache(datasource_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_resource_id ON dashboard_cache(resource_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_dates ON dashboard_cache(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_lookup ON dashboard_cache(datasource_id, resource_id, start_date, end_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mangools_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_analytics_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_cache ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "authenticated_users_all_ga_properties" ON google_analytics_properties;
CREATE POLICY "authenticated_users_all_ga_properties" ON google_analytics_properties
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_users_all_dashboard_cache" ON dashboard_cache;
CREATE POLICY "authenticated_users_all_dashboard_cache" ON dashboard_cache
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

DROP TRIGGER IF EXISTS update_ga_properties_updated_at ON google_analytics_properties;
CREATE TRIGGER update_ga_properties_updated_at
  BEFORE UPDATE ON google_analytics_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_cache_updated_at ON dashboard_cache;
CREATE TRIGGER update_dashboard_cache_updated_at
  BEFORE UPDATE ON dashboard_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
