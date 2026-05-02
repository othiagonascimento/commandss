import { useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { AICopilot } from '@/components/ai/AICopilot';
import { cn } from '@/lib/utils';

const SIDEBAR_KEY = 'ui:sidebar:collapsed';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  // Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen w-full bg-canvas relative">
      <AppSidebar
        collapsed={false}
        onCollapse={() => {}}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="transition-[padding] duration-200 min-h-screen flex flex-col lg:pl-[232px]">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onCommandOpen={() => setCmdkOpen(true)}
        />

        <main className="flex-1 px-3 sm:px-5 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10 relative z-10">
          <div className="max-w-[1480px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <BottomNav onMore={() => setMobileMenuOpen(true)} />
      <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
      <AICopilot />
    </div>
  );
}
