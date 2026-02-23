import { useState } from 'react';
import { safeArray } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  Loader2, 
  Link2, 
  Copy, 
  Calendar,
  Percent,
  Users,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InviteLink {
  id: string;
  code: string;
  is_active: boolean;
  plan_type: string;
  trial_days: number;
  discount_percent: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

export default function InviteLinks() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [planType, setPlanType] = useState('starter');
  const [trialDays, setTrialDays] = useState('30');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [maxUses, setMaxUses] = useState('');

  const { data: links, isLoading } = useQuery({
    queryKey: ['invite-links'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('invite-links', {
        method: 'GET',
      });
      if (error) throw error;
      return safeArray<InviteLink>(data?.links ?? data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('invite-links', {
        method: 'POST',
        body: {
          action: 'create',
          planType,
          trialDays: parseInt(trialDays),
          discountPercent: parseFloat(discountPercent),
          maxUses: maxUses ? parseInt(maxUses) : null,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Link criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['invite-links'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar link'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase.functions.invoke('invite-links', {
        method: 'POST',
        body: { action: 'toggle', linkId: id, isActive },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invite-links'] });
      toast.success('Status atualizado!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status'),
  });

  const resetForm = () => {
    setPlanType('starter');
    setTrialDays('30');
    setDiscountPercent('0');
    setMaxUses('');
  };

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/signup?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const planColors: Record<string, string> = {
    starter: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary',
    enterprise: 'bg-warning/10 text-warning',
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Links de Convite"
        description="Gere links comerciais para trials e descontos"
        icon={Link2}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Link de Convite</DialogTitle>
                <DialogDescription>
                  Configure as condições do link para novos clientes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dias de Trial</Label>
                    <Input
                      type="number"
                      value={trialDays}
                      onChange={(e) => setTrialDays(e.target.value)}
                      min="0"
                      max="90"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Máximo de Usos (opcional)</Label>
                  <Input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                    min="1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Criar Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Links de Convite</h1>
            <p className="text-muted-foreground">Gere links comerciais para trials e descontos</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Link de Convite</DialogTitle>
                <DialogDescription>
                  Configure as condições do link para novos clientes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dias de Trial</Label>
                    <Input
                      type="number"
                      value={trialDays}
                      onChange={(e) => setTrialDays(e.target.value)}
                      min="0"
                      max="90"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Máximo de Usos (opcional)</Label>
                  <Input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                    min="1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Criar Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Total de Links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{links?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ToggleRight className="w-4 h-4 text-success" />
                Links Ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">
                {links?.filter((l) => l.is_active).length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Usos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {links?.reduce((acc, l) => acc + l.used_count, 0) || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Média Desconto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {links?.length
                  ? (
                      links.reduce((acc, l) => acc + l.discount_percent, 0) /
                      links.length
                    ).toFixed(0)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Links Criados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : links && links.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Trial</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-sm">
                        {link.code}
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[link.plan_type]}>
                          {link.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {link.trial_days}d
                        </div>
                      </TableCell>
                      <TableCell>
                        {link.discount_percent > 0 ? (
                          <Badge variant="secondary">
                            {link.discount_percent}% off
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {link.used_count}
                        {link.max_uses && ` / ${link.max_uses}`}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleMutation.mutate({
                              id: link.id,
                              isActive: !link.is_active,
                            })
                          }
                          disabled={toggleMutation.isPending}
                        >
                          {link.is_active ? (
                            <ToggleRight className="w-5 h-5 text-success" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(link.created_at), 'dd MMM', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(link.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum link criado ainda.</p>
                <Button
                  variant="link"
                  onClick={() => setDialogOpen(true)}
                  className="mt-2"
                >
                  Criar primeiro link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}
