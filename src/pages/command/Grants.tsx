/**
 * Command AI — Tenant Grants
 * Concede/revoga scopes que o Command AI pode rodar em cada tenant.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Shield, Plus, X, Clock, Check } from 'lucide-react';
import {
  listGrants,
  listTenantsBasic,
  upsertGrant,
  revokeGrant,
  ALL_SCOPES,
  type TenantGrant,
} from '@/lib/command/grants';

export default function CommandGrants() {
  const qc = useQueryClient();
  const [editingTenant, setEditingTenant] = useState<string | null>(null);

  const { data: grants = [] } = useQuery({
    queryKey: ['command', 'grants'],
    queryFn: listGrants,
    refetchInterval: 30_000,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['command', 'tenants-basic'],
    queryFn: listTenantsBasic,
    staleTime: 5 * 60_000,
  });

  const tenantById = new Map(tenants.map((t) => [t.id, t]));
  const grantedTenantIds = new Set(grants.map((g) => g.target_tenant_id));
  const ungranted = tenants.filter((t) => !grantedTenantIds.has(t.id));

  const revokeMut = useMutation({
    mutationFn: revokeGrant,
    onSuccess: () => {
      toast.success('Concessão revogada');
      qc.invalidateQueries({ queryKey: ['command', 'grants'] });
    },
  });

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ink-faint))] mb-2">
          <Shield className="w-3 h-3" /> Concessões multi-tenant
        </div>
        <h1 className="font-display text-[34px] font-bold tracking-tight text-[hsl(var(--ink-primary))] leading-none">
          Quem o Command AI pode tocar.
        </h1>
        <p className="text-[14px] text-[hsl(var(--ink-muted))] mt-3 max-w-[640px] leading-relaxed">
          Cada tenant precisa autorizar explicitamente quais escopos o Command AI pode usar.
          Sem grant, qualquer ferramenta retorna <span className="font-mono text-[12px]">denied</span>.
        </p>
      </div>

      {/* Active grants */}
      <section className="mb-10">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-4">
          Ativas ({grants.length})
        </div>
        {grants.length === 0 ? (
          <EmptyHint />
        ) : (
          <div className="space-y-2">
            {grants.map((g) => {
              const t = tenantById.get(g.target_tenant_id);
              const isEditing = editingTenant === g.target_tenant_id;
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-1))] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-medium text-[hsl(var(--ink-primary))]">
                        {t?.name ?? g.target_tenant_id.slice(0, 8)}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mt-0.5">
                        {t?.subdomain ?? '—'} · {g.target_tenant_id.slice(0, 8)}
                      </div>
                      {g.expires_at && (
                        <div className="font-mono text-[10.5px] text-[hsl(var(--ink-muted))] mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> expira {new Date(g.expires_at).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingTenant(isEditing ? null : g.target_tenant_id)}
                        className="text-[11px] font-mono uppercase tracking-widest text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-primary))]"
                      >
                        {isEditing ? 'fechar' : 'editar'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Revogar acesso ao tenant ${t?.name ?? g.target_tenant_id}?`))
                            revokeMut.mutate(g.id);
                        }}
                        className="p-1.5 rounded text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--brand-magenta))]"
                        aria-label="Revogar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <GrantEditor
                      grant={g}
                      onSaved={() => {
                        setEditingTenant(null);
                        qc.invalidateQueries({ queryKey: ['command', 'grants'] });
                      }}
                    />
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {g.scopes.map((s) => (
                        <ScopeBadge key={s} scope={s} active />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add new */}
      {ungranted.length > 0 && (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))] mb-4">
            Conceder acesso ({ungranted.length} sem grant)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ungranted.slice(0, 12).map((t) => (
              <button
                key={t.id}
                onClick={() => setEditingTenant(t.id)}
                className="text-left rounded-lg border border-dashed border-[hsl(var(--hairline))] hover:border-[hsl(var(--hairline-strong))] hover:bg-[hsl(var(--surface-2))] p-4 transition-all flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-[hsl(var(--ink-primary))]">{t.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
                    {t.subdomain ?? t.id.slice(0, 8)}
                  </div>
                </div>
                <Plus className="w-3.5 h-3.5 text-[hsl(var(--ink-muted))]" />
              </button>
            ))}
          </div>

          {editingTenant && !grantedTenantIds.has(editingTenant) && (
            <div className="mt-4 rounded-xl border border-[hsl(var(--hairline-strong))] bg-[hsl(var(--surface-1))] p-5">
              <div className="text-[13.5px] font-medium text-[hsl(var(--ink-primary))] mb-3">
                Novo grant para {tenantById.get(editingTenant)?.name ?? editingTenant.slice(0, 8)}
              </div>
              <GrantEditor
                tenantId={editingTenant}
                onSaved={() => {
                  setEditingTenant(null);
                  qc.invalidateQueries({ queryKey: ['command', 'grants'] });
                }}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function GrantEditor({
  grant,
  tenantId,
  onSaved,
}: {
  grant?: TenantGrant;
  tenantId?: string;
  onSaved: () => void;
}) {
  const [scopes, setScopes] = useState<string[]>(grant?.scopes ?? []);
  const [expires, setExpires] = useState<string>(
    grant?.expires_at ? grant.expires_at.slice(0, 16) : '',
  );

  const target = grant?.target_tenant_id ?? tenantId!;

  const mut = useMutation({
    mutationFn: () =>
      upsertGrant({
        target_tenant_id: target,
        scopes,
        expires_at: expires ? new Date(expires).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success('Grant salvo');
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (s: string) =>
    setScopes((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ALL_SCOPES.map((s) => (
          <button
            key={s}
            onClick={() => toggle(s)}
            className="transition-all"
          >
            <ScopeBadge scope={s} active={scopes.includes(s)} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <label className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-faint))]">
          expira em
        </label>
        <input
          type="datetime-local"
          value={expires}
          onChange={(e) => setExpires(e.target.value)}
          className="bg-[hsl(var(--surface-2))] border border-[hsl(var(--hairline))] rounded px-2 py-1 text-[11.5px] font-mono text-[hsl(var(--ink-primary))]"
        />
        <button
          onClick={() => setExpires('')}
          className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink-primary))]"
        >
          sem expiração
        </button>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => mut.mutate()}
          disabled={scopes.length === 0 || mut.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[hsl(var(--brand-magenta))] text-white text-[12px] font-medium disabled:opacity-40"
        >
          <Check className="w-3 h-3" /> Salvar grant
        </button>
      </div>
    </div>
  );
}

function ScopeBadge({ scope, active }: { scope: string; active: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded text-[10.5px] font-mono lowercase border transition-all ${
        active
          ? 'border-[hsl(var(--brand-magenta))] bg-[hsl(var(--brand-magenta))]/10 text-[hsl(var(--ink-primary))]'
          : 'border-[hsl(var(--hairline))] bg-[hsl(var(--surface-2))] text-[hsl(var(--ink-muted))]'
      }`}
    >
      {scope}
    </span>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-xl border border-dashed border-[hsl(var(--hairline))] p-8 text-center">
      <Shield className="w-6 h-6 mx-auto text-[hsl(var(--ink-faint))]" />
      <div className="mt-3 text-[13px] text-[hsl(var(--ink-muted))]">
        Nenhum tenant autorizado ainda. Conceda escopos abaixo para o Command AI começar a operar.
      </div>
    </div>
  );
}
