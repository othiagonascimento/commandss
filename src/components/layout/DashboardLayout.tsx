import { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <AppSidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          'transition-[margin] duration-300 pt-16 p-4 lg:p-6',
          'lg:ml-[280px]',
          sidebarCollapsed && 'lg:ml-[72px]'
        )}
      >
        {children}
      </main>
    </div>
  );
}
