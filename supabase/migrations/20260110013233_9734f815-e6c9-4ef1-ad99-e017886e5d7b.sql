-- ========================================
-- HABILITAR RLS NAS TABELAS DESPROTEGIDAS
-- ========================================

-- 1. ai_config
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their ai_config"
ON public.ai_config FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Tenant admins can manage their ai_config"
ON public.ai_config FOR ALL
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));

CREATE POLICY "Master users can manage all ai_config"
ON public.ai_config FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- 2. ai_orchestration_logs
ALTER TABLE public.ai_orchestration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their orchestration logs"
ON public.ai_orchestration_logs FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Master users can manage all orchestration logs"
ON public.ai_orchestration_logs FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- 3. conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their conversations"
ON public.conversations FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Tenant users can manage their conversations"
ON public.conversations FOR ALL
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur 
  WHERE ur.user_id = auth.uid()
));

CREATE POLICY "Master users can manage all conversations"
ON public.conversations FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- 4. knowledge_base
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their knowledge base"
ON public.knowledge_base FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Tenant admins can manage their knowledge base"
ON public.knowledge_base FOR ALL
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));

CREATE POLICY "Master users can manage all knowledge base"
ON public.knowledge_base FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- 5. lead_memory
ALTER TABLE public.lead_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their lead memory"
ON public.lead_memory FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Tenant users can manage their lead memory"
ON public.lead_memory FOR ALL
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur 
  WHERE ur.user_id = auth.uid()
));

CREATE POLICY "Master users can manage all lead memory"
ON public.lead_memory FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- 6. objection_handlers
ALTER TABLE public.objection_handlers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view their objection handlers"
ON public.objection_handlers FOR SELECT
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Tenant admins can manage their objection handlers"
ON public.objection_handlers FOR ALL
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));

CREATE POLICY "Master users can manage all objection handlers"
ON public.objection_handlers FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- 7. tenant_template_exclusions
ALTER TABLE public.tenant_template_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can view their exclusions"
ON public.tenant_template_exclusions FOR SELECT
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));

CREATE POLICY "Master users can manage all exclusions"
ON public.tenant_template_exclusions FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));

-- 8. vendedor_cloning_profiles
ALTER TABLE public.vendedor_cloning_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cloning profile"
ON public.vendedor_cloning_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can view tenant cloning profiles"
ON public.vendedor_cloning_profiles FOR SELECT
USING (tenant_id IN (
  SELECT ur.tenant_id FROM user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));

CREATE POLICY "Master users can manage all cloning profiles"
ON public.vendedor_cloning_profiles FOR ALL
USING (EXISTS (
  SELECT 1 FROM master_users mu 
  WHERE mu.user_id = auth.uid() AND mu.is_active = true
));