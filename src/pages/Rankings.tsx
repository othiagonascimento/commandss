import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Medal, 
  Flame, 
  Brain, 
  HardDrive, 
  MessageSquare,
  TrendingUp,
  Crown,
  Zap,
  Star,
  Award,
  Target,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenantSelector } from '@/components/ui/tenant-selector';

interface TenantRanking {
  id: string;
  name: string;
  ai_tokens_used: number;
  messages_sent: number;
  storage_used_mb: number;
  active_users: number;
  leads_count: number;
  ai_events_count: number;
  ai_blocks: number;
}

const RANKING_ICONS = [
  { icon: Crown, color: 'text-yellow-500' },
  { icon: Medal, color: 'text-gray-400' },
  { icon: Award, color: 'text-amber-600' },
];

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString('pt-BR');
}

function RankingCard({ 
  title, 
  description, 
  icon: Icon, 
  data, 
  valueKey, 
  formatValue = formatNumber,
  unit = '',
}: { 
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  data: Array<{ id: string; name?: string; full_name?: string; tenant_name?: string; [key: string]: any }>;
  valueKey: string;
  formatValue?: (value: number) => string;
  unit?: string;
}) {
  const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 1);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.slice(0, 5).map((item, index) => {
          const RankIcon = RANKING_ICONS[index]?.icon || Star;
          const rankColor = RANKING_ICONS[index]?.color || 'text-muted-foreground';
          const value = item[valueKey] || 0;
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <RankIcon className={cn('w-4 h-4', rankColor)} />
                  <span className="font-medium truncate max-w-[120px]">
                    {item.name || item.full_name}
                  </span>
                  {item.tenant_name && (
                    <Badge variant="outline" className="text-[10px] px-1">
                      {item.tenant_name}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatValue(value)}{unit}
                </span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sem dados disponíveis
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Rankings() {
  const [activeTab, setActiveTab] = useState('tenants');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  

  // Fetch tenant rankings from tenant_usage + ai_events aggregation
  const { data: tenantUsage, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['tenant-rankings', selectedTenantId],
    queryFn: async () => {
      // Get tenant_usage data
      let usageQuery = supabase
        .from('tenant_usage')
        .select('id, tenant_id, ai_tokens_used, messages_sent, storage_used_mb, active_users, leads_count')
        .order('messages_sent', { ascending: false })
        .limit(50);
      
      if (selectedTenantId) {
        usageQuery = usageQuery.eq('tenant_id', selectedTenantId);
      }

      const { data: usage, error } = await usageQuery;
      if (error) throw error;
      
      // Get tenant names
      const tenantIds = usage?.map(u => u.tenant_id) || [];
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);
      
      const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);

      // Get ai_events aggregation per tenant (last 30 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      
      let eventsQuery = supabase
        .from('ai_events')
        .select('tenant_id, was_blocked')
        .gte('created_at', cutoff.toISOString());
      
      if (selectedTenantId) {
        eventsQuery = eventsQuery.eq('tenant_id', selectedTenantId);
      }

      const { data: events } = await eventsQuery;
      
      // Aggregate events per tenant
      const eventAgg: Record<string, { count: number; blocks: number }> = {};
      for (const e of (events || [])) {
        if (!eventAgg[e.tenant_id]) eventAgg[e.tenant_id] = { count: 0, blocks: 0 };
        eventAgg[e.tenant_id].count++;
        if (e.was_blocked) eventAgg[e.tenant_id].blocks++;
      }

      // Also count active users from profiles
      const profileCounts = await Promise.all(
        tenantIds.map(async (tid) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tid);
          return { tenant_id: tid, count: count || 0 };
        })
      );
      const profileMap = new Map(profileCounts.map(p => [p.tenant_id, p.count]));

      return usage?.map(u => ({
        id: u.id,
        name: tenantMap.get(u.tenant_id) || 'Tenant',
        ai_tokens_used: u.ai_tokens_used || 0,
        messages_sent: u.messages_sent || 0,
        storage_used_mb: u.storage_used_mb || 0,
        active_users: profileMap.get(u.tenant_id) || u.active_users || 0,
        leads_count: u.leads_count || 0,
        ai_events_count: eventAgg[u.tenant_id]?.count || 0,
        ai_blocks: eventAgg[u.tenant_id]?.blocks || 0,
      })) as TenantRanking[];
    },
  });

  const tenantsByMessages = [...(tenantUsage || [])].sort((a, b) => b.messages_sent - a.messages_sent);
  const tenantsByAI = [...(tenantUsage || [])].sort((a, b) => b.ai_events_count - a.ai_events_count);
  const tenantsByUsers = [...(tenantUsage || [])].sort((a, b) => b.active_users - a.active_users);
  const tenantsByLeads = [...(tenantUsage || [])].sort((a, b) => b.leads_count - a.leads_count);

  const totalMessages = tenantUsage?.reduce((sum, t) => sum + t.messages_sent, 0) || 0;
  const totalEvents = tenantUsage?.reduce((sum, t) => sum + t.ai_events_count, 0) || 0;
  const totalLeads = tenantUsage?.reduce((sum, t) => sum + t.leads_count, 0) || 0;
  const totalUsers = tenantUsage?.reduce((sum, t) => sum + t.active_users, 0) || 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Rankings & Engajamento"
        description="Ranking real dos tenants mais ativos baseado em dados de uso"
        icon={Trophy}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1.5">
              Fonte: <code className="font-mono">tenant_usage</code> + <code className="font-mono">ai_events</code>
            </Badge>
            {dataUpdatedAt > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                Atualizado {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR')}
              </Badge>
            )}
            <TenantSelector
              value={selectedTenantId}
              onChange={setSelectedTenantId}
              placeholder="Todas as Lojas"
            />
            <button
              onClick={() => { refetch(); }}
              className="text-xs underline text-muted-foreground hover:text-foreground"
              type="button"
            >
              Atualizar
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Mensagens Totais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalMessages)}</div>
                <p className="text-xs text-muted-foreground">em todos os tenants</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Eventos de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalEvents)}</div>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Usuários Ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalUsers)}</div>
                <p className="text-xs text-muted-foreground">em todos os tenants</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-warning" />
                  Leads Capturados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalLeads)}</div>
                <p className="text-xs text-muted-foreground">em todos os tenants</p>
              </CardContent>
            </Card>
          </div>

          {/* Rankings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <RankingCard
              title="💬 Mais mensagens"
              description="Total de mensagens enviadas"
              icon={MessageSquare}
              data={tenantsByMessages}
              valueKey="messages_sent"
            />
            <RankingCard
              title="🧠 Mais IA"
              description="Eventos de IA (30 dias)"
              icon={Brain}
              data={tenantsByAI}
              valueKey="ai_events_count"
            />
            <RankingCard
              title="👥 Mais usuários"
              description="Usuários cadastrados"
              icon={Flame}
              data={tenantsByUsers}
              valueKey="active_users"
            />
            <RankingCard
              title="🎯 Mais leads"
              description="Leads capturados"
              icon={Target}
              data={tenantsByLeads}
              valueKey="leads_count"
            />
          </div>

          {/* Promotion Ideas */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-5 h-5 text-primary" />
                Ideias de Promoções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">🎯 100 usuários = Bônus</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Premiar tenants que atingirem 100 usuários ativos
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">🏆 Tenant do Mês</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Destacar o tenant mais engajado com badge especial
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">🚀 Power Users</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desconto para quem enviar mais de 10K mensagens/mês
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
