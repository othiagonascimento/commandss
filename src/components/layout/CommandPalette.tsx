import { useEffect, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Radio, Activity, BarChart3, Brain, Calculator,
  Trophy, CreditCard, Link2, Bell, ClipboardList, Package, DollarSign,
  UserCog, FileText, Clock, FlaskConical, Settings as SettingsIcon, Plus, RefreshCw,
} from 'lucide-react';
import { tenantsApi } from '@/services/masterApi';

const ROUTES = [
  { icon: LayoutDashboard, label: 'Dashboard',          path: '/' },
  { icon: Radio,           label: 'Operações',          path: '/operations' },
  { icon: Activity,        label: 'Saúde dos Tenants',  path: '/tenant-health' },
  { icon: BarChart3,       label: 'Inteligência Receita', path: '/analytics' },
  { icon: Brain,           label: 'Diagnóstico de IA',  path: '/ai-diagnostics' },
  { icon: Calculator,      label: 'Simulador',          path: '/simulator' },
  { icon: Building2,       label: 'Tenants',            path: '/tenants' },
  { icon: Trophy,          label: 'Rankings',           path: '/rankings' },
  { icon: ClipboardList,   label: 'Cadastros',          path: '/admin/cadastros' },
  { icon: Brain,           label: 'Templates',          path: '/admin/templates' },
  { icon: CreditCard,      label: 'Assinaturas',        path: '/subscriptions' },
  { icon: Link2,           label: 'Convites',           path: '/invite-links' },
  { icon: Bell,            label: 'Comunicados',        path: '/comunicados' },
  { icon: Package,         label: 'Planos',             path: '/plans' },
  { icon: DollarSign,      label: 'FinOps',             path: '/finops' },
  { icon: Calculator,      label: 'Custos API',         path: '/api-costs' },
  { icon: UserCog,         label: 'Master Users',       path: '/master-users' },
  { icon: FileText,        label: 'Logs',               path: '/activity-logs' },
  { icon: Clock,           label: 'Tarefas Agendadas',  path: '/scheduled-tasks' },
  { icon: FlaskConical,    label: 'Recursos Beta',      path: '/feature-flags' },
  { icon: SettingsIcon,    label: 'Configurações',      path: '/settings' },
];

interface TenantHit {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  plan_type?: string | null;
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tenants, setTenants] = useState<TenantHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!open) { setQuery(''); setTenants([]); } }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) { setTenants([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await tenantsApi.list({ search: query, limit: 8 });
        const list = (res.data as any)?.tenants ?? (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
        setTenants(Array.isArray(list) ? list.slice(0, 8) : []);
      } catch { setTenants([]); }
      finally { setLoading(false); }
    }, 220);
    return () => clearTimeout(t);
  }, [query, open]);

  const go = (path: string) => { onOpenChange(false); navigate(path); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 max-w-xl bg-surface-3 border border-hairline-strong rounded-md shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] [&>button]:hidden"
      >
        <CommandPrimitive className="flex flex-col" shouldFilter={true} filter={(value, search) => {
          // tenants are appended already; for routes use simple includes
          if (!search) return 1;
          return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
        }}>
          <div className="flex items-center gap-2 px-3 h-11 hairline-b">
            <span className="font-mono text-plasma text-[13px]">{'>'}</span>
            <CommandPrimitive.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="buscar tenants, navegar, executar ações…"
              className="flex-1 bg-transparent outline-none font-mono text-[13px] text-ink placeholder:text-ink-faint"
            />
            <kbd className="font-mono text-[10px] text-ink-faint hairline border px-1.5 py-0.5 rounded-sm">esc</kbd>
          </div>

          <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            <CommandPrimitive.Empty className="py-8 text-center text-sm text-ink-3 font-mono">
              {loading ? 'buscando…' : 'sem resultados'}
            </CommandPrimitive.Empty>

            {tenants.length > 0 && (
              <CommandPrimitive.Group heading="> TENANTS" className="[&_[cmdk-group-heading]]:editorial-label [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2">
                {tenants.map(t => (
                  <CommandPrimitive.Item
                    key={t.id}
                    value={`tenant-${t.id}-${t.name}-${t.slug ?? ''}`}
                    onSelect={() => go(`/tenants/${t.id}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer aria-selected:bg-surface-2 aria-selected:hairline aria-selected:border"
                  >
                    <Building2 className="h-3.5 w-3.5 text-plasma" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-ink truncate">{t.name}</div>
                      <div className="font-mono text-[10px] text-ink-3 truncate">
                        {[t.slug, t.state, t.city, t.plan_type].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            <CommandPrimitive.Group heading="> NAVEGAR" className="[&_[cmdk-group-heading]]:editorial-label [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 mt-2">
              {ROUTES.map(r => (
                <CommandPrimitive.Item
                  key={r.path}
                  value={`route-${r.label}-${r.path}`}
                  onSelect={() => go(r.path)}
                  className="flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer aria-selected:bg-surface-2 aria-selected:hairline aria-selected:border"
                >
                  <r.icon className="h-3.5 w-3.5 text-ink-2" />
                  <span className="text-[13px] text-ink flex-1">{r.label}</span>
                  <span className="font-mono text-[10px] text-ink-faint">{r.path}</span>
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="> AÇÕES" className="[&_[cmdk-group-heading]]:editorial-label [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 mt-2">
              <CommandPrimitive.Item value="action-new-tenant" onSelect={() => go('/tenants/new')} className="flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer aria-selected:bg-surface-2 aria-selected:hairline aria-selected:border">
                <Plus className="h-3.5 w-3.5 text-plasma" />
                <span className="text-[13px] text-ink">Criar novo tenant</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item value="action-refresh" onSelect={() => { onOpenChange(false); window.location.reload(); }} className="flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer aria-selected:bg-surface-2 aria-selected:hairline aria-selected:border">
                <RefreshCw className="h-3.5 w-3.5 text-ink-2" />
                <span className="text-[13px] text-ink">Recarregar dados</span>
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>
          </CommandPrimitive.List>

          <div className="hairline-t px-3 py-2 flex items-center gap-3 font-mono text-[10px] text-ink-faint uppercase tracking-wider">
            <span><kbd className="hairline border px-1 py-0.5 rounded-sm">↑↓</kbd> navegar</span>
            <span><kbd className="hairline border px-1 py-0.5 rounded-sm">↵</kbd> abrir</span>
            <span className="ml-auto">UÔPA · ⌘K</span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
