-- Create scheduled_tasks table for scheduling actions
CREATE TABLE public.scheduled_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('broadcast', 'status_change', 'template_sync', 'report', 'notification')),
    action_payload JSONB NOT NULL DEFAULT '{}',
    target_type TEXT NOT NULL CHECK (target_type IN ('all_tenants', 'specific_tenants', 'plan_filter', 'tag_filter')),
    target_ids TEXT[] DEFAULT '{}',
    target_filter JSONB,
    scheduled_at TIMESTAMPTZ NOT NULL,
    repeat_type TEXT CHECK (repeat_type IN ('once', 'daily', 'weekly', 'monthly')),
    repeat_config JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    max_runs INTEGER,
    error_message TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policy for master users
CREATE POLICY "Master users can manage scheduled tasks"
ON public.scheduled_tasks
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.master_users mu
        WHERE mu.user_id = auth.uid() AND mu.is_active = true
    )
);

-- Create index for efficient queries
CREATE INDEX idx_scheduled_tasks_status ON public.scheduled_tasks(status);
CREATE INDEX idx_scheduled_tasks_scheduled_at ON public.scheduled_tasks(scheduled_at);
CREATE INDEX idx_scheduled_tasks_next_run_at ON public.scheduled_tasks(next_run_at);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_tasks_updated_at
    BEFORE UPDATE ON public.scheduled_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.scheduled_tasks IS 'Stores scheduled actions for automated execution';