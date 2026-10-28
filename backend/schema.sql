CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  service VARCHAR(40) NOT NULL CHECK (service IN ('Visual media','Software & web','Hybrid overhaul','Brand & design','Not sure yet')),
  brief TEXT NOT NULL CHECK (char_length(brief) BETWEEN 10 AND 5000),
  estimate VARCHAR(200) NOT NULL DEFAULT '',
  source VARCHAR(100) NOT NULL DEFAULT 'website',
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed','spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries (status, created_at DESC);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(40) NOT NULL CHECK (category IN ('visual','digital','brand')),
  summary TEXT NOT NULL,
  problem TEXT NOT NULL DEFAULT '',
  execution TEXT NOT NULL DEFAULT '',
  deliverables TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_published_sort_idx ON projects (published, featured DESC, sort_order ASC);

-- Deliberately no invented client case studies are seeded. Publish only approved records
-- after entering verified project details and trusted image URLs through a controlled CMS/admin workflow.

-- Publicly readable planning prices. Update these rows through a secured admin workflow.
-- The frontend uses local fallback assumptions until the API is configured.
CREATE TABLE IF NOT EXISTS pricing_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track VARCHAR(20) NOT NULL CHECK (track IN ('visual','software','hybrid')),
  item_key VARCHAR(40) NOT NULL,
  label VARCHAR(180) NOT NULL,
  min_cost INTEGER NOT NULL CHECK (min_cost >= 0),
  max_cost INTEGER NOT NULL CHECK (max_cost >= min_cost),
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (track, item_key)
);
CREATE INDEX IF NOT EXISTS pricing_catalog_published_idx ON pricing_catalog (published, track, sort_order);
