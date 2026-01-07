import { useState } from 'react';
import { motion } from 'framer-motion';
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

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const data = useMockData();

  return (
    <div className="min-h-screen w-full">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'transition-all duration-300 p-4 lg:p-6',
          'lg:ml-[240px]',
          sidebarCollapsed && 'lg:ml-16'
        )}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4"
        >
          {/* Row 1: Health Monitor + Stats */}
          <HealthMonitor data={data.latency} delay={0} />
          <ActiveUsers data={data.activeUsers} delay={1} />
          <RevenueCard data={data.revenue} delay={2} />

          {/* Row 2: Services + Errors */}
          <ServiceStatus services={data.services} delay={3} />
          <ErrorHeatmap errors={data.errors} delay={4} />

          {/* Row 3: Live Feed + Queues + System */}
          <LiveFeed logs={data.logs} delay={5} />
          <QueueStatus queues={data.queues} delay={6} />
          <SystemStats data={data.system} delay={7} />
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
