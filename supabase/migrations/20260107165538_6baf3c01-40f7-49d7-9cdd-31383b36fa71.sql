-- Add pricing and contract fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS document TEXT, -- CPF/CNPJ
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS price_per_user NUMERIC(10,2) DEFAULT 69.00,
ADD COLUMN IF NOT EXISTS contracted_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS extra_channels INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS channel_price NUMERIC(10,2) DEFAULT 19.90,
ADD COLUMN IF NOT EXISTS implementation_fee NUMERIC(10,2) DEFAULT 2500.00,
ADD COLUMN IF NOT EXISTS implementation_paid_externally BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS ai_token_limit INTEGER DEFAULT 100000,
ADD COLUMN IF NOT EXISTS storage_limit_gb INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON public.tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON public.tenants(subscription_status);