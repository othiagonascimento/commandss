import { useMemo } from 'react';
import { FinOpsShell } from '@/components/finops/FinOpsShell';
import { DataTable, FinOpsColumnDef } from '@/components/finops/DataTable';
import { useFinOpsMedia } from '@/hooks/finops/useFinOps';
import { useFinOpsPeriod } from '@/hooks/finops/useFinOpsPeriod';
import { Card } from '@/components/ui/card';
import { brl, bytes, num, dateBR } from '@/lib/finops/format';
import type { FinOpsMediaTenantRow } from '@/types/finops';
import { CheckCircle2, AlertTriangle, Loader2, Film } from 'lucide-react';

export default function FinOpsMediaPage() {
  const { filters } = useFinOpsPeriod();
  const { data, isLoading } = useFinOpsMedia(filters);

  const cols: FinOpsColumnDef<FinOpsMediaTenantRow>[] = useMemo(
    () => [
      { accessorKey: 'tenant_name', header: 'Tenant', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
      { accessorKey: 'folder', header: 'Folder', cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'strategy', header: 'Strategy', cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) || '—'}</span> },
      { accessorKey: 'bytes_uploaded', header: 'Uploaded', meta: { numeric: true }, cell: ({ getValue }) => bytes(getValue() as number) },
      { accessorKey: 'bytes_deleted', header: 'Deleted', meta: { numeric: true }, cell: ({ getValue }) => bytes(getValue() as number) },
      { accessorKey: 'current_storage_bytes', header: 'Storage atual', meta: { numeric: true }, cell: ({ getValue }) => bytes(getValue() as number) },
      { accessorKey: 'video_jobs', header: 'Video jobs', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'failed_jobs', header: 'Falhas', meta: { numeric: true }, cell: ({ getValue }) => <span className="text-destructive">{num(getValue() as number)}</span> },
      { accessorKey: 'uploading_jobs', header: 'Uploading', meta: { numeric: true }, cell: ({ getValue }) => num(getValue() as number) },
      { accessorKey: 'last_event_at', header: 'Último evento', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{dateBR(getValue() as string)}</span> },
    ],
    [],
  );

  const totals = data?.totals;
  const vp = data?.video_pipeline;

  return (
    <FinOpsShell title="Mídia & Storage" description="Eventos normalizados de mídia, GCS, vídeo commerce e jobs presos.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground">Bytes uploaded</div>
          <div className="text-xl font-bold tabular-nums">{bytes(totals?.bytes_uploaded)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground">Bytes deleted</div>
          <div className="text-xl font-bold tabular-nums">{bytes(totals?.bytes_deleted)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground">Storage atual</div>
          <div className="text-xl font-bold tabular-nums">{bytes(totals?.current_storage_bytes)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase text-muted-foreground">Custo estimado</div>
          <div className="text-xl font-bold tabular-nums text-destructive">{brl(totals?.cost_estimated_brl)}</div>
        </Card>
      </div>

      {vp && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Film className="h-4 w-4" /> Pipeline de Vídeo Commerce</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded border bg-info/5">
              <div className="flex items-center gap-2 text-xs"><Loader2 className="h-3.5 w-3.5 text-info" /> Uploading</div>
              <div className="text-xl font-bold tabular-nums">{num(vp.uploading)}</div>
            </div>
            <div className="p-3 rounded border bg-warning/5">
              <div className="flex items-center gap-2 text-xs"><Loader2 className="h-3.5 w-3.5 text-warning" /> Processing</div>
              <div className="text-xl font-bold tabular-nums">{num(vp.processing)}</div>
            </div>
            <div className="p-3 rounded border bg-success/5">
              <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Completed</div>
              <div className="text-xl font-bold tabular-nums">{num(vp.completed)}</div>
            </div>
            <div className="p-3 rounded border bg-destructive/5">
              <div className="flex items-center gap-2 text-xs"><AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Failed recoverable</div>
              <div className="text-xl font-bold tabular-nums">{num(vp.failed_recoverable)}</div>
            </div>
          </div>
        </Card>
      )}

      {data?.stuck_jobs && data.stuck_jobs.length > 0 && (
        <Card className="p-4 border-warning/40 bg-warning/5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-warning"><AlertTriangle className="h-4 w-4" /> Jobs presos</h3>
          <div className="space-y-1.5 text-xs font-mono">
            {data.stuck_jobs.slice(0, 10).map((j) => (
              <div key={j.id} className="flex items-center justify-between border-b border-border/40 pb-1">
                <span>{j.id} · tenant {j.tenant_id}</span>
                <span>{j.status}{j.phase ? ` / ${j.phase}` : ''} · {num(j.minutes_stuck)} min</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <DataTable
        data={data?.rows ?? []}
        columns={cols}
        loading={isLoading}
        searchPlaceholder="Buscar tenant ou folder…"
        csvFilename={`finops-media-${filters.month || 'range'}.csv`}
        initialSorting={[{ id: 'current_storage_bytes', desc: true }]}
        rowKey={(r) => `${r.tenant_id}-${r.folder}-${r.strategy}`}
      />
    </FinOpsShell>
  );
}
