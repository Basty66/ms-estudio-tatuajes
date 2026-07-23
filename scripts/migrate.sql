-- Add estado column to cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';
