-- Add new fields for implementation tracking and monthly fee flag
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS implementation_status TEXT DEFAULT 'pending';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS implementation_paid_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS has_monthly_fee BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN tenants.implementation_status IS 'Status of implementation payment: pending, paid, exempt';
COMMENT ON COLUMN tenants.implementation_paid_at IS 'Date when implementation fee was paid';
COMMENT ON COLUMN tenants.has_monthly_fee IS 'Whether tenant pays monthly recurring fee (false for lifetime/partnership)';