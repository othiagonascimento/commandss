ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS billing_day integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL;

-- Add constraint for billing_day range
ALTER TABLE public.tenants 
  ADD CONSTRAINT tenants_billing_day_range CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 28));

COMMENT ON COLUMN public.tenants.billing_day IS 'Dia do vencimento mensal (1-28)';
COMMENT ON COLUMN public.tenants.payment_method IS 'Método de pagamento: cash, pix, boleto, stripe, infinitipay';