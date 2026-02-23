import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TenantOption {
  id: string;
  name: string;
}

interface TenantSelectorProps {
  value: string | null;
  onChange: (tenantId: string | null) => void;
  className?: string;
  placeholder?: string;
  showAllOption?: boolean;
}

export function TenantSelector({
  value,
  onChange,
  className,
  placeholder = 'Todas as Lojas',
  showAllOption = true,
}: TenantSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants-selector'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return (data || []) as TenantOption[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(t => t.name.toLowerCase().includes(q));
  }, [tenants, search]);

  const selectedTenant = tenants.find(t => t.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 max-w-[220px]', className)}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {selectedTenant ? selectedTenant.name : placeholder}
          </span>
          {value && (
            <X
              className="h-3 w-3 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 bg-popover border border-border shadow-lg z-50"
        align="end"
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar loja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-1">
          {showAllOption && (
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch('');
              }}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                !value && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {placeholder}
                {!value && <Badge variant="secondary" className="ml-auto text-xs">Ativo</Badge>}
              </span>
            </button>
          )}
          {isLoading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Nenhuma loja encontrada
            </div>
          ) : (
            filtered.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  onChange(tenant.id);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  value === tenant.id && 'bg-accent text-accent-foreground font-medium'
                )}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{tenant.name}</span>
                  {value === tenant.id && <Badge variant="secondary" className="ml-auto text-xs">Ativo</Badge>}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
