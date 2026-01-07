import { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { HealthMonitor } from '@/components/dashboard/HealthMonitor';
import { ErrorHeatmap } from '@/components/dashboard/ErrorHeatmap';
import { LiveFeed } from '@/components/dashboard/LiveFeed';
import { ServiceStatus } from '@/components/dashboard/ServiceStatus';
import { ActiveUsers } from '@/components/dashboard/ActiveUsers';
import { RevenueCard } from '@/components/dashboard/RevenueCard';
import { QueueStatus } from '@/components/dashboard/QueueStatus';
import { SystemStats } from '@/components/dashboard/SystemStats';
import { useMockData } from '@/hooks/useMockData';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const data = useMockData();

  return (
    <div className="min-h-screen w-full bg-background">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'transition-[margin] duration-300 p-4 lg:p-6',
          'lg:ml-[280px]',
          sidebarCollapsed && 'lg:ml-[72px]'
        )}
      >
        {/* Welcome Message */}
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Bem-vindo ao seu Painel de Controle!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Aqui você vê tudo que acontece no seu sistema em tempo real. Passe o mouse sobre qualquer card 
                e clique no <span className="inline-flex items-center"><HelpCircle className="w-3 h-3 mx-1" /></span> 
                para entender o que cada número significa. Não se preocupe se não entender tudo de primeira - 
                estamos aqui para ajudar!
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Row 1: Key Metrics */}
          <HealthMonitor data={data.latency} />
          <ActiveUsers data={data.activeUsers} />
          <RevenueCard data={data.revenue} />

          {/* Row 2: Services & Errors */}
          <ServiceStatus services={data.services} />
          <ErrorHeatmap errors={data.errors} />

          {/* Row 3: Live Feed, Queues & System */}
          <LiveFeed logs={data.logs} />
          <QueueStatus queues={data.queues} />
          <SystemStats data={data.system} />
        </div>
      </main>
    </div>
  );
};

export default Index;
