import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
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

interface VerifyResult {
  domain: string;
  status: string;
  error?: string;
}

interface DomainsManagementProps {
  tenantId: string;
  tenantSubdomain: string;
}

const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const EXPECTED_IP = '185.158.133.1';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  verifying: { label: 'Verificando...', variant: 'secondary', icon: RefreshCw },
  verified: { label: 'Verificado', variant: 'secondary', icon: Check },
  active: { label: 'Ativo', variant: 'default', icon: Check },
  failed: { label: 'Falhou', variant: 'destructive', icon: X },
  expired: { label: 'Expirado', variant: 'destructive', icon: AlertCircle },
};

export function DomainsManagement({ tenantId, tenantSubdomain }: DomainsManagementProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<TenantDomain | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

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
      const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();
      const token = `lovable_verify_${crypto.randomUUID().slice(0, 12)}`;
      
      const { data, error } = await supabase
        .from('tenant_domains')
        .insert({
          tenant_id: tenantId,
          domain: cleanDomain,
          domain_type: 'custom',
          status: 'pending',
          verification_token: token,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as TenantDomain;
    },
    onSuccess: (data) => {
      toast.success('Domínio adicionado! Configure o DNS conforme as instruções abaixo.');
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
      setIsDialogOpen(false);
      setNewDomain('');
      setDomainError('');
      // Auto-expand the new domain's DNS instructions
      setExpandedDomains(prev => new Set(prev).add(data.id));
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
      setVerifyingId(domainId);
      
      const { data, error } = await supabase.functions.invoke('verify-domains', {
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // The edge function uses query params, but supabase.functions.invoke doesn't support them directly.
      // We need to use the URL approach instead.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/verify-domains?domain_id=${domainId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      return await response.json() as { results: VerifyResult[]; verified: number; total: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', tenantId] });
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result.status === 'verified') {
          toast.success(`DNS verificado com sucesso para ${result.domain}!`);
        } else {
          toast.warning(`DNS ainda não configurado para ${result.domain}: ${result.error || 'Aguardando propagação'}`);
        }
      } else {
        toast.info('Verificação concluída.');
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao verificar DNS: ' + error.message);
    },
    onSettled: () => {
      setVerifyingId(null);
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
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (domainId: string) => {
      await supabase
        .from('tenant_domains')
        .update({ is_primary: false })
        .eq('tenant_id', tenantId);
      
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
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const toggleExpanded = (id: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const validateDomain = (value: string): string => {
    const clean = value.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();
    if (!clean) return 'Digite um domínio.';
    if (!DOMAIN_REGEX.test(clean)) return 'Formato de domínio inválido. Ex: meusite.com.br';
    if (clean.includes(' ')) return 'Domínio não pode conter espaços.';
    if (domains?.some(d => d.domain === clean)) return 'Este domínio já está cadastrado.';
    return '';
  };

  const handleAddDomain = () => {
    const error = validateDomain(newDomain);
    if (error) {
      setDomainError(error);
      return;
    }
    setDomainError('');
    addDomainMutation.mutate(newDomain);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const publicSiteUrl = `https://site.uopacrm.com/${tenantSubdomain}`;
  const cleanDomainPreview = newDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();

  return (
    <div className="space-y-6">
      {/* Public Site URL Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">URL do Site Público</p>
                <div className="flex items-center gap-2">
                  <code className="bg-background px-3 py-1.5 rounded-md border text-sm font-mono">
                    {publicSiteUrl}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(publicSiteUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  URL padrão. Configure um domínio próprio abaixo para usar um endereço personalizado.
                </p>
              </div>
            </div>
            <Button onClick={() => window.open(publicSiteUrl, '_blank')} className="shrink-0">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Site
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works — always visible */}
      <Alert className="border-blue-500/30 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-500">Como funciona o domínio próprio</AlertTitle>
        <AlertDescription className="text-sm space-y-2 mt-2">
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Adicione o domínio desejado clicando em <strong>"Adicionar Domínio"</strong></li>
            <li>Configure os registros DNS no seu provedor de domínio (ex: Registro.br, GoDaddy, Cloudflare)</li>
            <li>Clique em <strong>"Verificar DNS"</strong> para validar a configuração</li>
            <li>Após verificação, o SSL é provisionado automaticamente e o domínio fica ativo</li>
          </ol>
          <p className="text-xs text-muted-foreground/70 mt-2">
            A propagação DNS pode levar até 72 horas. Enquanto isso, o site continua acessível pela URL padrão.
          </p>
        </AlertDescription>
      </Alert>

      {/* Domains List */}
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
            <div className="space-y-3">
              {domains.map((domain) => {
                const StatusIcon = statusConfig[domain.status]?.icon || Clock;
                const isExpanded = expandedDomains.has(domain.id);
                const isVerifying = verifyingId === domain.id;

                return (
                  <Collapsible key={domain.id} open={isExpanded} onOpenChange={() => toggleExpanded(domain.id)}>
                    <div className="border rounded-lg overflow-hidden">
                      {/* Domain header row */}
                      <div className="flex items-center justify-between p-4 bg-card hover:bg-accent/30 transition-colors">
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-3 flex-1 text-left">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{domain.domain}</span>
                                {domain.is_primary && (
                                  <Badge variant="outline" className="text-xs">Principal</Badge>
                                )}
                              </div>
                              {domain.last_check_at && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Última verificação: {format(new Date(domain.last_check_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <div className="flex items-center gap-3">
                          {/* Status indicators */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs" title="DNS">
                              {domain.dns_configured ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-muted-foreground/50" />
                              )}
                              <span className="text-muted-foreground">DNS</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs" title="SSL">
                              {domain.ssl_provisioned ? (
                                <Shield className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Shield className="w-4 h-4 text-muted-foreground/50" />
                              )}
                              <span className="text-muted-foreground">SSL</span>
                            </div>
                          </div>

                          <Badge variant={statusConfig[domain.status]?.variant || 'outline'}>
                            <StatusIcon className={`w-3 h-3 mr-1 ${isVerifying ? 'animate-spin' : ''}`} />
                            {isVerifying ? 'Verificando...' : statusConfig[domain.status]?.label || domain.status}
                          </Badge>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1">
                            {domain.status !== 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => verifyDomainMutation.mutate(domain.id)}
                                disabled={isVerifying}
                                title="Verificar DNS agora"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isVerifying ? 'animate-spin' : ''}`} />
                                Verificar DNS
                              </Button>
                            )}
                            {domain.status === 'active' && !domain.is_primary && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPrimaryMutation.mutate(domain.id)}
                                title="Definir como principal"
                                className="h-8 w-8"
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
                                className="h-8 w-8"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(domain)}
                              title="Remover domínio"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Last error */}
                      {domain.last_error && (
                        <div className="px-4 py-2 bg-destructive/5 border-t border-destructive/20">
                          <p className="text-xs text-destructive flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {domain.last_error}
                          </p>
                        </div>
                      )}

                      {/* Expandable DNS instructions */}
                      <CollapsibleContent>
                        <div className="border-t p-4 bg-muted/30 space-y-4">
                          <p className="text-sm font-medium">Configuração DNS para <code className="bg-background px-1.5 py-0.5 rounded border text-xs">{domain.domain}</code></p>
                          <p className="text-xs text-muted-foreground">
                            Acesse o painel do seu provedor de domínio e adicione os registros abaixo:
                          </p>

                          <div className="grid gap-3">
                            {/* A Record (root) */}
                            <DnsRecordCard
                              type="A"
                              name="@"
                              value={EXPECTED_IP}
                              description="Registro A — aponta o domínio raiz para o servidor"
                              onCopy={copyToClipboard}
                            />

                            {/* A Record (www) */}
                            <DnsRecordCard
                              type="A"
                              name="www"
                              value={EXPECTED_IP}
                              description="Registro A — aponta o subdomínio www"
                              onCopy={copyToClipboard}
                            />

                            {/* TXT Record */}
                            {domain.verification_token && (
                              <DnsRecordCard
                                type="TXT"
                                name="_lovable"
                                value={domain.verification_token}
                                description="Registro TXT — token de verificação de propriedade"
                                onCopy={copyToClipboard}
                              />
                            )}
                          </div>

                          <div className="flex items-start gap-2 mt-3 p-3 rounded-md bg-background border">
                            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Após configurar os registros, clique em <strong>"Verificar DNS"</strong> acima.</p>
                              <p>A propagação pode levar até 72 horas, mas geralmente leva poucos minutos.</p>
                              <p>Se usar Cloudflare, certifique-se que o proxy (nuvem laranja) está <strong>desativado</strong> para o registro A.</p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum domínio próprio configurado.</p>
              <p className="text-sm mt-1">Clique em "Adicionar Domínio" para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setDomainError(''); setNewDomain(''); } }}>
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
                placeholder="meusite.com.br"
                value={newDomain}
                onChange={(e) => { setNewDomain(e.target.value); setDomainError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              />
              {domainError && (
                <p className="text-xs text-destructive">{domainError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Apenas para o site público. O CRM continua acessível pelo subdomínio padrão.
              </p>
            </div>

            {cleanDomainPreview && DOMAIN_REGEX.test(cleanDomainPreview) && (
              <div className="p-3 rounded-md bg-muted border">
                <p className="text-xs text-muted-foreground mb-1">Preview da URL:</p>
                <code className="text-sm font-mono">https://{cleanDomainPreview}</code>
              </div>
            )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover domínio?</AlertDialogTitle>
            <AlertDialogDescription>
              O domínio <strong>{deleteTarget?.domain}</strong> será removido permanentemente. 
              Você precisará reconfigurá-lo caso queira usá-lo novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteDomainMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDomainMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── DNS Record Card Sub-component ──
function DnsRecordCard({ type, name, value, description, onCopy }: {
  type: string;
  name: string;
  value: string;
  description: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="bg-background border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{description}</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onCopy(value)}>
          <Copy className="w-3 h-3 mr-1" />
          Copiar valor
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground text-xs block">Tipo</span>
          <code className="font-medium">{type}</code>
        </div>
        <div>
          <span className="text-muted-foreground text-xs block">Nome</span>
          <code className="font-medium">{name}</code>
        </div>
        <div>
          <span className="text-muted-foreground text-xs block">Valor</span>
          <code className="font-medium break-all">{value}</code>
        </div>
      </div>
    </div>
  );
}
