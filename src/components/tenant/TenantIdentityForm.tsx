import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '@/services/masterApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Building2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const BR_UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface FormState {
  name: string;
  subdomain: string;
  city: string;
  state: string;
  country: string;
}

interface TenantIdentityFormProps {
  tenantId: string;
  tenant: any;
}

export function TenantIdentityForm({ tenantId, tenant }: TenantIdentityFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({
    name: '', subdomain: '', city: '', state: '', country: 'BR',
  });

  useEffect(() => {
    if (!tenant) return;
    setForm({
      name: tenant.name || '',
      subdomain: tenant.slug || tenant.subdomain || '',
      city: tenant.city || '',
      state: tenant.state || '',
      country: tenant.country || 'BR',
    });
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await tenantsApi.update(tenantId, data);
      if (r.error) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      toast.success('Identidade atualizada');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (e) => toast.error('Erro: ' + (e as Error).message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      subdomain: form.subdomain,
      city: form.city || null,
      state: form.state || null,
      country: form.country || 'BR',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4" />Dados básicos
          </CardTitle>
          <CardDescription>Nome e identificador público (subdomínio)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomínio *</Label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  value={form.subdomain}
                  onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                />
                <span className="text-muted-foreground ml-2 text-sm">.uopa.com.br</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4" />Localização
          </CardTitle>
          <CardDescription>Alimenta o mapa do dashboard executivo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex: São Paulo" />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Select value={form.state || 'none'} onValueChange={(v) => setForm({ ...form, state: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">—</SelectItem>
                  {BR_UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar identidade
        </Button>
      </div>
    </form>
  );
}
