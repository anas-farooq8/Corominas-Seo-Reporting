-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create datasources table
CREATE TABLE datasources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'mangools',
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create datasource_domains table (stores only required fields)
CREATE TABLE datasource_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datasource_id UUID NOT NULL REFERENCES datasources(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  rank INTEGER,
  traffic INTEGER,
  difficulty INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(datasource_id, domain)
);

-- Create indexes for performance
CREATE INDEX idx_datasources_customer_id ON datasources(customer_id);
CREATE INDEX idx_datasource_domains_datasource_id ON datasource_domains(datasource_id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasources ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasource_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access (all tables)
-- Customers: admins can select/insert/update/delete
CREATE POLICY "admin_select_customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_insert_customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_update_customers" ON customers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "admin_delete_customers" ON customers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Datasources: admins can manage
CREATE POLICY "admin_manage_datasources" ON datasources
  FOR ALL USING (auth.role() = 'authenticated');

-- Datasource domains: admins can manage
CREATE POLICY "admin_manage_datasource_domains" ON datasource_domains
  FOR ALL USING (auth.role() = 'authenticated');
