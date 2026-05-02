import { useMemo, useState, ReactNode, forwardRef } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronDown, Columns3, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportCsvButton } from './ExportCsvButton';

export type FinOpsColumnDef<T> = ColumnDef<T> & {
  meta?: { numeric?: boolean; mono?: boolean; pin?: 'left' | 'right' };
};

interface Props<T> {
  data: T[];
  columns: FinOpsColumnDef<T>[];
  searchPlaceholder?: string;
  initialSorting?: SortingState;
  defaultHidden?: string[];
  csvFilename?: string;
  csvHeaders?: { key: string; label: string }[];
  toolbar?: ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string;
  loading?: boolean;
  density?: 'compact' | 'comfortable';
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Buscar…',
  initialSorting = [],
  defaultHidden = [],
  csvFilename,
  csvHeaders,
  toolbar,
  emptyMessage = 'Nenhum registro',
  onRowClick,
  rowKey,
  loading,
  density = 'compact',
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => Object.fromEntries(defaultHidden.map((id) => [id, false])),
  );

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<T>[],
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  const cellPad = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3';

  const csvRows = useMemo(() => {
    if (!csvFilename) return [];
    return table.getFilteredRowModel().rows.map((r) => r.original as Record<string, unknown>);
  }, [csvFilename, table, sorting, globalFilter]);

  return (
    <DataTableRoot>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-7 h-8 w-64 text-xs"
          />
        </div>
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-3.5 w-3.5" />
                Colunas <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Mostrar colunas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().map((col) => {
                if (!col.getCanHide()) return null;
                return (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {(col.columnDef.header as string) || col.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {csvFilename && (
            <ExportCsvButton filename={csvFilename} rows={csvRows} headers={csvHeaders} />
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/30 hover:bg-muted/30">
                {hg.headers.map((h) => {
                  const meta = h.column.columnDef.meta as { numeric?: boolean } | undefined;
                  const sortable = h.column.getCanSort();
                  return (
                    <TableHead
                      key={h.id}
                      className={cn(
                        'h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                        cellPad,
                        meta?.numeric && 'text-right',
                        sortable && 'cursor-pointer select-none hover:text-foreground',
                      )}
                      onClick={sortable ? h.column.getToggleSortingHandler() : undefined}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center gap-1',
                          meta?.numeric && 'flex-row-reverse w-full justify-start',
                        )}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sortable && (
                          <ArrowUpDown
                            className={cn(
                              'h-3 w-3 opacity-30',
                              h.column.getIsSorted() && 'opacity-100 text-primary',
                            )}
                          />
                        )}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-8">
                  Carregando…
                </TableCell>
              </TableRow>
            )}
            {!loading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={rowKey ? rowKey(row.original) : row.id}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { numeric?: boolean; mono?: boolean } | undefined;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cellPad,
                        'text-sm',
                        meta?.numeric && 'text-right tabular-nums',
                        meta?.mono && 'font-mono text-xs',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground tabular-nums">
        {table.getFilteredRowModel().rows.length} de {data.length} {data.length === 1 ? 'registro' : 'registros'}
      </div>
    </DataTableRoot>
  );
}

// Internal forwardRef wrapper so DataTable can be a child of components that
// inject refs (e.g. Radix's Slot, shadcn Card). Without this, React warns
// "Function components cannot be given refs."
const DataTableRoot = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => (
    <div ref={ref} className="space-y-2">
      {children}
    </div>
  ),
);
DataTableRoot.displayName = 'DataTableRoot';
