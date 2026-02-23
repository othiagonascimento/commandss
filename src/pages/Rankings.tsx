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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenantSelector } from '@/components/ui/tenant-selector';

interface UserRanking {
  id: string;
  user_id: string;
  tenant_id: string;
  tenant_name?: string;
  full_name: string;
  email: string;
  ai_tokens_month: number;
  ai_tokens_total: number;
  messages_sent_month: number;
  storage_bytes: number;
  api_calls_month: number;
  transcription_seconds_month: number;
}

interface TenantRanking {
  id: string;
  name: string;
  ai_tokens_used: number;
  messages_sent: number;
  storage_used_mb: number;
  active_users: number;
  leads_count: number;
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

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
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
  const [activeTab, setActiveTab] = useState('users');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  // Fetch user usage data
  const { data: userUsage, isLoading: usersLoading } = useQuery({
    queryKey: ['user-usage-rankings', selectedTenantId],
    queryFn: async () => {
      let query = supabase
        .from('user_usage')
        .select(`
          id,
          user_id,
          tenant_id,
          ai_tokens_month,
          ai_tokens_total,
          messages_sent_month,
          storage_bytes,
          api_calls_month,
          transcription_seconds_month
        `)
        .order('ai_tokens_month', { ascending: false })
        .limit(50);
      
      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId);
      }

      const { data: usage, error: usageError } = await query;
      if (usageError) throw usageError;
      
      // Get profiles for names
      const userIds = (usage?.map(u => u.user_id) || []) as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, tenant_id')
        .in('id', userIds);
      
      // Get tenants for names
      const tenantIds = [...new Set((usage?.map(u => u.tenant_id) || []) as string[])];
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);
      
      return usage?.map(u => ({
        ...u,
        full_name: profileMap.get(u.user_id)?.full_name || 'Usuário',
        email: '',
        tenant_name: tenantMap.get(u.tenant_id) || '',
      })) as UserRanking[];
    },
  });

  // Fetch tenant usage data
  const { data: tenantUsage, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenant-usage-rankings', selectedTenantId],
    queryFn: async () => {
      let query = supabase
        .from('tenant_usage')
        .select(`
          id,
          tenant_id,
          ai_tokens_used,
          messages_sent,
          storage_used_mb,
          active_users,
          leads_count
        `)
        .order('ai_tokens_used', { ascending: false })
        .limit(50);
      
      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId);
      }

      const { data: usage, error } = await query;
      if (error) throw error;
      
      // Get tenant names
      const tenantIds = usage?.map(u => u.tenant_id) || [];
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);
      
      const tenantMap = new Map(tenants?.map(t => [t.id, t.name]) || []);
      
      return usage?.map(u => ({
        id: u.id,
        name: tenantMap.get(u.tenant_id) || 'Tenant',
        ai_tokens_used: u.ai_tokens_used || 0,
        messages_sent: u.messages_sent || 0,
        storage_used_mb: u.storage_used_mb || 0,
        active_users: u.active_users || 0,
        leads_count: u.leads_count || 0,
      })) as TenantRanking[];
    },
  });

  const isLoading = usersLoading || tenantsLoading;

  // Sort rankings by different metrics
  const usersByAI = [...(userUsage || [])].sort((a, b) => (b.ai_tokens_month || 0) - (a.ai_tokens_month || 0));
  const usersByMessages = [...(userUsage || [])].sort((a, b) => (b.messages_sent_month || 0) - (a.messages_sent_month || 0));
  const usersByStorage = [...(userUsage || [])].sort((a, b) => (b.storage_bytes || 0) - (a.storage_bytes || 0));
  
  const tenantsByAI = [...(tenantUsage || [])].sort((a, b) => (b.ai_tokens_used || 0) - (a.ai_tokens_used || 0));
  const tenantsByMessages = [...(tenantUsage || [])].sort((a, b) => (b.messages_sent || 0) - (a.messages_sent || 0));
  const tenantsByUsers = [...(tenantUsage || [])].sort((a, b) => (b.active_users || 0) - (a.active_users || 0));
  const tenantsByLeads = [...(tenantUsage || [])].sort((a, b) => (b.leads_count || 0) - (a.leads_count || 0));

  return (
    <DashboardLayout>
      <PageHeader
        title="Rankings & Engajamento"
        description="Acompanhe os usuários e tenants mais ativos para ações promocionais"
        icon={Trophy}
        actions={
          <TenantSelector
            value={selectedTenantId}
            onChange={setSelectedTenantId}
            placeholder="Todas as Lojas"
          />
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
                  <Flame className="w-4 h-4 text-orange-500" />
                  Usuários Ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userUsage?.length || 0}</div>
                <p className="text-xs text-muted-foreground">com atividade este mês</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Tokens IA Usados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(userUsage?.reduce((sum, u) => sum + (u.ai_tokens_month || 0), 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">total este mês</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-success" />
                  Mensagens Enviadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(userUsage?.reduce((sum, u) => sum + (u.messages_sent_month || 0), 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">total este mês</p>
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
                <div className="text-2xl font-bold">
                  {formatNumber(tenantUsage?.reduce((sum, t) => sum + (t.leads_count || 0), 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">em todos os tenants</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                <Trophy className="w-4 h-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="tenants" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Tenants
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RankingCard
                  title="🧠 Mais usou IA"
                  description="Tokens consumidos este mês"
                  icon={Brain}
                  data={usersByAI}
                  valueKey="ai_tokens_month"
                />
                <RankingCard
                  title="💬 Mais mensagens"
                  description="Mensagens enviadas este mês"
                  icon={MessageSquare}
                  data={usersByMessages}
                  valueKey="messages_sent_month"
                />
                <RankingCard
                  title="💾 Mais storage"
                  description="Armazenamento utilizado"
                  icon={HardDrive}
                  data={usersByStorage}
                  valueKey="storage_bytes"
                  formatValue={formatBytes}
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
                      <p className="font-medium">🏆 Usuário do Mês</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Destacar o usuário mais engajado com badge especial
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-medium">🚀 Power Users</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Desconto para quem usar mais de 50K tokens/mês
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tenants" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <RankingCard
                  title="🧠 Mais usou IA"
                  description="Tokens consumidos"
                  icon={Brain}
                  data={tenantsByAI}
                  valueKey="ai_tokens_used"
                />
                <RankingCard
                  title="💬 Mais mensagens"
                  description="Mensagens enviadas"
                  icon={MessageSquare}
                  data={tenantsByMessages}
                  valueKey="messages_sent"
                />
                <RankingCard
                  title="👥 Mais usuários"
                  description="Usuários ativos"
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
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  );
}
