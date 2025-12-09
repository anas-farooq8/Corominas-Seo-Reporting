-- ============================================
-- Corominas SEO Reporting System - Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DATASOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS datasources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mangools', 'semrush')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MANGOOLS DOMAINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mangools_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datasource_id UUID NOT NULL REFERENCES datasources(id) ON DELETE CASCADE,
  mangools_id TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  location_code TEXT,
  location_label TEXT,
  platform_id INTEGER,
  keywords_count INTEGER DEFAULT 0,
  mangools_created_at BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_datasources_customer_id ON datasources(customer_id);
CREATE INDEX IF NOT EXISTS idx_datasources_type ON datasources(type);
CREATE INDEX IF NOT EXISTS idx_mangools_domains_datasource_id ON mangools_domains(datasource_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mangools_domains ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "authenticated_users_all_customers" ON customers;
CREATE POLICY "authenticated_users_all_customers" ON customers
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

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_datasources_updated_at ON datasources;
CREATE TRIGGER update_datasources_updated_at
  BEFORE UPDATE ON datasources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mangools_domains_updated_at ON mangools_domains;
CREATE TRIGGER update_mangools_domains_updated_at
  BEFORE UPDATE ON mangools_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
