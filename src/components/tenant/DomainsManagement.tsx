import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Plus, 
  Globe, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TenantDomain {
  id: string;
  tenant_id: string;
  domain: string;
  domain_type: 'subdomain' | 'custom';
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'failed' | 'expired';
  is_primary: boolean;
  verification_token: string | null;
  dns_configured: boolean;
  ssl_provisioned: boolean;
  verified_at: string | null;
  last_check_at: string | null;
  expires_at: string | null;
  created_at: string;
  notes: string | null;
  last_error: string | null;
}

interface DomainsManagementProps {
  tenantId: string;
  tenantSubdomain: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  verifying: { label: 'Verificando', variant: 'secondary', icon: RefreshCw },
  verified: { label: 'Verificado', variant: 'secondary', icon: Check },
  active: { label: 'Ativo', variant: 'default', icon: Check },
  failed: { label: 'Falhou', variant: 'destructive', icon: X },
  expired: { label: 'Expirado', variant: 'destructive', icon: AlertCircle },
};

export function DomainsManagement({ tenantId, tenantSubdomain }: DomainsManagementProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  const { data: domains, isLoading } = useQuery({
    queryKey: ['tenant-domains', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_domains')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TenantDomain[];
    },
  });

  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      // Generate verification token
      const token = `lovable_verify_${crypto.randomUUID().slice(0, 12)}`;
      
      const { error } = await supabase
        .from('tenant_domains')
        .insert({
          tenant_id: tenantId,
          domain: domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
          domain_type: 'custom',
          status: 'pending',
          verification_token: token,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Domínio adicionado! Configure o DNS para verificar.');
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
      setIsDialogOpen(false);
      setNewDomain('');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este domínio já está cadastrado.');
      } else {
        toast.error('Erro ao adicionar domínio: ' + error.message);
      }
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      // Update status to verifying
      const { error } = await supabase
        .from('tenant_domains')
        .update({ 
          status: 'verifying',
          last_check_at: new Date().toISOString(),
        })
        .eq('id', domainId);
      
      if (error) throw error;
      
      // In a real implementation, this would trigger DNS verification
      // For now, we'll simulate it
      toast.info('Verificação iniciada. Pode levar até 72h para propagação do DNS.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
    },
    onError: (error) => {
      toast.error('Erro ao verificar: ' + error.message);
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from('tenant_domains')
        .delete()
        .eq('id', domainId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Domínio removido.');
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (domainId: string) => {
      // First, unset all as primary
      await supabase
        .from('tenant_domains')
        .update({ is_primary: false })
        .eq('tenant_id', tenantId);
      
      // Set the selected one as primary
      const { error } = await supabase
        .from('tenant_domains')
        .update({ is_primary: true })
        .eq('id', domainId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Domínio principal definido.');
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      toast.error('Digite um domínio válido');
      return;
    }
    addDomainMutation.mutate(newDomain);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Alert>
        <Globe className="w-4 h-4" />
        <AlertDescription>
          <strong>Subdomínio padrão:</strong>{' '}
          <code className="bg-muted px-2 py-0.5 rounded">{tenantSubdomain}.suaapp.com</code>
          <br />
          <span className="text-muted-foreground">
            Este subdomínio é usado para acesso ao CRM e PWA. Domínios próprios são apenas para o site público.
          </span>
        </AlertDescription>
      </Alert>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Domínios Próprios
              </CardTitle>
              <CardDescription>
                Configure domínios personalizados para o site público
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Domínio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {domains && domains.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>DNS</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => {
                  const StatusIcon = statusConfig[domain.status]?.icon || Clock;
                  return (
                    <TableRow key={domain.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{domain.domain}</span>
                          {domain.is_primary && (
                            <Badge variant="outline" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        {domain.last_error && (
                          <p className="text-xs text-destructive mt-1">{domain.last_error}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[domain.status]?.variant || 'outline'}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[domain.status]?.label || domain.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {domain.dns_configured ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {domain.ssl_provisioned ? (
                          <Shield className="w-4 h-4 text-success" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(domain.created_at), 'dd MMM yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {domain.status === 'active' && !domain.is_primary && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPrimaryMutation.mutate(domain.id)}
                              title="Definir como principal"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {domain.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                              title="Abrir site"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          {['pending', 'failed'].includes(domain.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => verifyDomainMutation.mutate(domain.id)}
                              title="Verificar DNS"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDomainMutation.mutate(domain.id)}
                            title="Remover"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum domínio próprio configurado.</p>
              <p className="text-sm">Adicione um domínio para o site público do tenant.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      {domains && domains.some(d => d.status === 'pending' || d.status === 'verifying') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instruções de Configuração DNS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para ativar seu domínio próprio, configure os seguintes registros DNS no seu provedor:
            </p>
            
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Registro A (raiz)</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard('185.158.133.1')}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span> <code>A</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span> <code>@</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span> <code>185.158.133.1</code>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Registro A (www)</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard('185.158.133.1')}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span> <code>A</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span> <code>www</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span> <code>185.158.133.1</code>
                  </div>
                </div>
              </div>

              {domains.filter(d => d.verification_token).map(domain => (
                <div key={domain.id} className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Registro TXT ({domain.domain})</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(domain.verification_token || '')}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span> <code>TXT</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nome:</span> <code>_lovable</code>
                    </div>
                    <div className="col-span-1">
                      <span className="text-muted-foreground">Valor:</span>{' '}
                      <code className="break-all">{domain.verification_token}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              A propagação do DNS pode levar até 72 horas. Após configurar, clique em "Verificar" no domínio.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Domain Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Domínio Próprio</DialogTitle>
            <DialogDescription>
              Digite o domínio que deseja usar para o site público deste tenant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Domínio</Label>
              <Input
                placeholder="www.exemplo.com.br"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Apenas para o site público. O CRM continua acessível pelo subdomínio padrão.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDomain} disabled={addDomainMutation.isPending}>
              {addDomainMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}