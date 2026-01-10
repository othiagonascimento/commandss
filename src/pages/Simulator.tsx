import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMasterDashboard } from '@/hooks/useMasterDashboard';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Percent,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// Default cost configuration
const DEFAULT_COSTS = {
  // Fixed costs (monthly)
  infraBase: 500, // R$ per month base infrastructure
  salaries: 15000, // R$ per month team
  marketing: 2000, // R$ per month
  tools: 500, // R$ per month SaaS tools
  
  // Variable costs per unit
  aiTokenPer1k: 0.002, // R$ per 1K tokens
  storagePer1gb: 0.50, // R$ per GB
  messagePer1: 0.001, // R$ per message
  infraPerTenant: 5.00, // R$ per tenant base
};

// Revenue assumptions
const DEFAULT_REVENUE = {
  pricePerUser: 69, // R$ per user
  channelPrice: 19.90, // R$ per extra channel
  implementationFee: 500, // R$ one-time
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

interface ScenarioData {
  month: string;
  tenants: number;
  users: number;
  mrr: number;
  costs: number;
  profit: number;
  cumulativeProfit: number;
}

export default function Simulator() {
  const { overview, revenue: currentRevenue, isLoading } = useMasterDashboard();
  
  // Cost Configuration State
  const [costs, setCosts] = useState(DEFAULT_COSTS);
  const [revenueConfig, setRevenueConfig] = useState(DEFAULT_REVENUE);
  
  // Simulation Parameters
  const [growthRate, setGrowthRate] = useState(10); // % monthly tenant growth
  const [churnRate, setChurnRate] = useState(3); // % monthly churn
  const [avgUsersPerTenant, setAvgUsersPerTenant] = useState(3);
  const [avgChannelsPerTenant, setAvgChannelsPerTenant] = useState(1);
  const [projectionMonths, setProjectionMonths] = useState(12);
  
  // Current metrics from API
  const currentTenants = overview?.tenants.active || 10;
  const currentMRR = currentRevenue?.mrr || 5000;
  
  // Calculate Fixed Costs (monthly)
  const fixedCosts = useMemo(() => {
    return costs.infraBase + costs.salaries + costs.marketing + costs.tools;
  }, [costs]);
  
  // Calculate Unit Economics
  const unitEconomics = useMemo(() => {
    const revenuePerTenant = (revenueConfig.pricePerUser * avgUsersPerTenant) + 
                            (revenueConfig.channelPrice * avgChannelsPerTenant);
    
    const variableCostPerTenant = costs.infraPerTenant + 
                                  (costs.aiTokenPer1k * 50) + // Assume 50K tokens/month
                                  (costs.storagePer1gb * 0.5) + // Assume 0.5GB/month
                                  (costs.messagePer1 * 500); // Assume 500 msgs/month
    
    const marginPerTenant = revenuePerTenant - variableCostPerTenant;
    const marginPercent = (marginPerTenant / revenuePerTenant) * 100;
    
    // LTV calculation (assuming 24 month average lifetime)
    const avgLifetimeMonths = 24;
    const ltv = marginPerTenant * avgLifetimeMonths;
    
    // CAC (implementation fee + marketing cost per acquired tenant)
    const cac = revenueConfig.implementationFee + (costs.marketing / (currentTenants * (growthRate / 100) || 1));
    
    // Payback period
    const paybackMonths = cac / marginPerTenant;
    
    return {
      revenuePerTenant,
      variableCostPerTenant,
      marginPerTenant,
      marginPercent,
      ltv,
      cac,
      ltvCacRatio: ltv / cac,
      paybackMonths,
    };
  }, [costs, revenueConfig, avgUsersPerTenant, avgChannelsPerTenant, currentTenants, growthRate]);
  
  // Generate Projection Data
  const projectionData = useMemo((): ScenarioData[] => {
    const data: ScenarioData[] = [];
    let tenants = currentTenants;
    let cumulativeProfit = 0;
    
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    for (let i = 0; i < projectionMonths; i++) {
      // Apply growth and churn
      const newTenants = Math.round(tenants * (growthRate / 100));
      const churnedTenants = Math.round(tenants * (churnRate / 100));
      tenants = tenants + newTenants - churnedTenants;
      
      const users = tenants * avgUsersPerTenant;
      const mrr = tenants * unitEconomics.revenuePerTenant;
      const variableCosts = tenants * unitEconomics.variableCostPerTenant;
      const totalCosts = fixedCosts + variableCosts;
      const profit = mrr - totalCosts;
      cumulativeProfit += profit;
      
      const monthIndex = (currentMonth + i + 1) % 12;
      const year = new Date().getFullYear() + Math.floor((currentMonth + i + 1) / 12);
      
      data.push({
        month: `${monthNames[monthIndex]}/${year.toString().slice(-2)}`,
        tenants,
        users,
        mrr,
        costs: totalCosts,
        profit,
        cumulativeProfit,
      });
    }
    
    return data;
  }, [currentTenants, growthRate, churnRate, avgUsersPerTenant, projectionMonths, unitEconomics, fixedCosts]);
  
  // Calculate summary metrics
  const summary = useMemo(() => {
    const lastMonth = projectionData[projectionData.length - 1];
    const breakEvenMonth = projectionData.findIndex(d => d.cumulativeProfit > 0);
    
    return {
      finalTenants: lastMonth?.tenants || 0,
      finalMRR: lastMonth?.mrr || 0,
      finalARR: (lastMonth?.mrr || 0) * 12,
      totalProfit: lastMonth?.cumulativeProfit || 0,
      breakEvenMonth: breakEvenMonth >= 0 ? breakEvenMonth + 1 : null,
      avgGrowthRate: projectionData.length > 1 
        ? ((lastMonth?.tenants / currentTenants) ** (1 / projectionMonths) - 1) * 100
        : 0,
    };
  }, [projectionData, currentTenants, projectionMonths]);
  
  const resetToDefaults = () => {
    setCosts(DEFAULT_COSTS);
    setRevenueConfig(DEFAULT_REVENUE);
    setGrowthRate(10);
    setChurnRate(3);
    setAvgUsersPerTenant(3);
    setAvgChannelsPerTenant(1);
    setProjectionMonths(12);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Simulador Financeiro"
        description="Projeções, cenários e análise de unit economics"
        icon={Calculator}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Cenário
            </Button>
          </div>
        }
      />
      
      <Tabs defaultValue="projection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="projection" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Projeções</span>
          </TabsTrigger>
          <TabsTrigger value="economics" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Unit Economics</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Custos</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Cenários IA</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Projection Tab */}
        <TabsContent value="projection" className="space-y-6">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Parâmetros da Simulação
              </CardTitle>
              <CardDescription>Ajuste os parâmetros para ver diferentes cenários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Taxa de Crescimento</Label>
                    <Badge variant="outline">{growthRate}% / mês</Badge>
                  </div>
                  <Slider
                    value={[growthRate]}
                    onValueChange={([v]) => setGrowthRate(v)}
                    min={0}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Taxa de Churn</Label>
                    <Badge variant="outline" className="text-destructive">{churnRate}% / mês</Badge>
                  </div>
                  <Slider
                    value={[churnRate]}
                    onValueChange={([v]) => setChurnRate(v)}
                    min={0}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Usuários por Tenant</Label>
                    <Badge variant="outline">{avgUsersPerTenant}</Badge>
                  </div>
                  <Slider
                    value={[avgUsersPerTenant]}
                    onValueChange={([v]) => setAvgUsersPerTenant(v)}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Período de Projeção</Label>
                    <Badge variant="outline">{projectionMonths} meses</Badge>
                  </div>
                  <Slider
                    value={[projectionMonths]}
                    onValueChange={([v]) => setProjectionMonths(v)}
                    min={6}
                    max={36}
                    step={6}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">Tenants em {projectionMonths}m</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(summary.finalTenants)}</p>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(summary.finalTenants - currentTenants)} novos
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">MRR Projetado</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary.finalMRR)}</p>
                <p className="text-xs text-muted-foreground">
                  ARR: {formatCurrency(summary.finalARR)}
                </p>
              </CardContent>
            </Card>
            
            <Card className={cn(summary.totalProfit > 0 ? 'border-success/50' : 'border-destructive/50')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  {summary.totalProfit > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">Lucro Acumulado</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  summary.totalProfit > 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(summary.totalProfit)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Break-even</span>
                </div>
                {summary.breakEvenMonth ? (
                  <>
                    <p className="text-2xl font-bold text-success">Mês {summary.breakEvenMonth}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Atingido
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-warning">Não atingido</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Ajuste parâmetros
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Projection Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Projeção de {projectionMonths} Meses</CardTitle>
              <CardDescription>MRR, Custos e Lucro ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs fill-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'mrr' ? 'MRR' : name === 'costs' ? 'Custos' : 'Lucro'
                      ]}
                    />
                    <Legend 
                      formatter={(value) => value === 'mrr' ? 'MRR' : value === 'costs' ? 'Custos' : 'Lucro'}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMrr)"
                    />
                    <Area
                      type="monotone"
                      dataKey="costs"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCosts)"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Unit Economics Tab */}
        <TabsContent value="economics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={cn(unitEconomics.marginPercent >= 60 ? 'border-success/50' : unitEconomics.marginPercent >= 40 ? '' : 'border-warning/50')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Margem por Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(unitEconomics.marginPerTenant)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={unitEconomics.marginPercent >= 60 ? "default" : "secondary"}>
                    {unitEconomics.marginPercent.toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">margem</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">LTV</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(unitEconomics.ltv)}</div>
                <p className="text-xs text-muted-foreground">Lifetime value (24 meses)</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CAC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(unitEconomics.cac)}</div>
                <p className="text-xs text-muted-foreground">Custo de aquisição</p>
              </CardContent>
            </Card>
            
            <Card className={cn(unitEconomics.ltvCacRatio >= 3 ? 'border-success/50' : unitEconomics.ltvCacRatio >= 2 ? '' : 'border-destructive/50')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">LTV/CAC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unitEconomics.ltvCacRatio.toFixed(1)}x</div>
                <div className="flex items-center gap-2 mt-1">
                  {unitEconomics.ltvCacRatio >= 3 ? (
                    <Badge className="bg-success/20 text-success border-success/30">Saudável</Badge>
                  ) : unitEconomics.ltvCacRatio >= 2 ? (
                    <Badge variant="secondary">Aceitável</Badge>
                  ) : (
                    <Badge variant="destructive">Baixo</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Receita por Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Usuários ({avgUsersPerTenant}x)</span>
                  </div>
                  <span className="font-bold">
                    {formatCurrency(revenueConfig.pricePerUser * avgUsersPerTenant)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span>Canais Extras ({avgChannelsPerTenant}x)</span>
                  </div>
                  <span className="font-bold">
                    {formatCurrency(revenueConfig.channelPrice * avgChannelsPerTenant)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                  <span className="font-medium">Total Receita</span>
                  <span className="text-xl font-bold text-success">
                    {formatCurrency(unitEconomics.revenuePerTenant)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Custo por Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Infra Base</span>
                  <span className="font-medium">{formatCurrency(costs.infraPerTenant)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>IA (50K tokens)</span>
                  <span className="font-medium">{formatCurrency(costs.aiTokenPer1k * 50)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Storage (0.5GB)</span>
                  <span className="font-medium">{formatCurrency(costs.storagePer1gb * 0.5)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Mensagens (500)</span>
                  <span className="font-medium">{formatCurrency(costs.messagePer1 * 500)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <span className="font-medium">Total Custos</span>
                  <span className="text-xl font-bold text-destructive">
                    {formatCurrency(unitEconomics.variableCostPerTenant)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Payback Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{unitEconomics.paybackMonths.toFixed(1)}</div>
                <div>
                  <p className="font-medium">meses para recuperar o CAC</p>
                  <p className="text-sm text-muted-foreground">
                    Com margem de {formatCurrency(unitEconomics.marginPerTenant)}/mês por tenant
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Costs Configuration Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos Fixos (Mensais)</CardTitle>
                <CardDescription>Custos que não variam com o número de tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="infraBase">Infraestrutura Base (R$)</Label>
                  <Input
                    id="infraBase"
                    type="number"
                    value={costs.infraBase}
                    onChange={(e) => setCosts({ ...costs, infraBase: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaries">Salários e Equipe (R$)</Label>
                  <Input
                    id="salaries"
                    type="number"
                    value={costs.salaries}
                    onChange={(e) => setCosts({ ...costs, salaries: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketing">Marketing (R$)</Label>
                  <Input
                    id="marketing"
                    type="number"
                    value={costs.marketing}
                    onChange={(e) => setCosts({ ...costs, marketing: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tools">Ferramentas SaaS (R$)</Label>
                  <Input
                    id="tools"
                    type="number"
                    value={costs.tools}
                    onChange={(e) => setCosts({ ...costs, tools: Number(e.target.value) })}
                  />
                </div>
                <Separator />
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <span className="font-medium">Total Fixo</span>
                  <span className="text-xl font-bold">{formatCurrency(fixedCosts)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Custos Variáveis (Por Unidade)</CardTitle>
                <CardDescription>Custos que escalam com o uso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiToken">Custo por 1K Tokens IA (R$)</Label>
                  <Input
                    id="aiToken"
                    type="number"
                    step="0.001"
                    value={costs.aiTokenPer1k}
                    onChange={(e) => setCosts({ ...costs, aiTokenPer1k: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage">Custo por GB Storage (R$)</Label>
                  <Input
                    id="storage"
                    type="number"
                    step="0.01"
                    value={costs.storagePer1gb}
                    onChange={(e) => setCosts({ ...costs, storagePer1gb: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Custo por Mensagem (R$)</Label>
                  <Input
                    id="message"
                    type="number"
                    step="0.0001"
                    value={costs.messagePer1}
                    onChange={(e) => setCosts({ ...costs, messagePer1: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infraTenant">Infra Base por Tenant (R$)</Label>
                  <Input
                    id="infraTenant"
                    type="number"
                    step="0.01"
                    value={costs.infraPerTenant}
                    onChange={(e) => setCosts({ ...costs, infraPerTenant: Number(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Receita</CardTitle>
              <CardDescription>Preços padrão por produto/serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUser">Preço por Usuário (R$/mês)</Label>
                  <Input
                    id="pricePerUser"
                    type="number"
                    value={revenueConfig.pricePerUser}
                    onChange={(e) => setRevenueConfig({ ...revenueConfig, pricePerUser: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channelPrice">Preço por Canal Extra (R$/mês)</Label>
                  <Input
                    id="channelPrice"
                    type="number"
                    step="0.01"
                    value={revenueConfig.channelPrice}
                    onChange={(e) => setRevenueConfig({ ...revenueConfig, channelPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="implementationFee">Taxa de Implementação (R$)</Label>
                  <Input
                    id="implementationFee"
                    type="number"
                    value={revenueConfig.implementationFee}
                    onChange={(e) => setRevenueConfig({ ...revenueConfig, implementationFee: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Cenários com IA
              </CardTitle>
              <CardDescription>
                Análise preditiva e recomendações baseadas nos seus dados reais
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">IA em breve</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Em breve você poderá pedir para a IA analisar cenários como "O que acontece se eu 
                aumentar o preço em 15%?" ou "Qual o impacto de reduzir churn em 1%?".
              </p>
              <Button className="mt-6" disabled>
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar com IA (em breve)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
