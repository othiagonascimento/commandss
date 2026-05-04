import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Radio, Brain, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { icon: LayoutDashboard, label: 'Home',     path: '/' },
  { icon: Building2,       label: 'Tenants',  path: '/tenants' },
  { icon: Radio,           label: 'Ops',      path: '/operations' },
  { icon: Brain,           label: 'IA',       path: '/ai-diagnostics' },
];

export function BottomNav({ onMore }: { onMore: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = (p: string) => p === '/' ? pathname === '/' : pathname.startsWith(p);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-canvas/95 backdrop-blur hairline-t pb-safe">
      <div className="grid grid-cols-5 h-14">
        {items.map(it => {
          const active = isActive(it.path);
          return (
            <button
              key={it.path}
              onClick={() => navigate(it.path)}
              className="relative flex flex-col items-center justify-center gap-1 text-ink-3"
            >
              {active && <span className="absolute top-0 w-8 h-[2px] bg-plasma" />}
              <it.icon className={cn('h-[18px] w-[18px]', active && 'text-plasma')} />
              <span className={cn('font-mono text-[9px] uppercase tracking-wider', active && 'text-ink')}>{it.label}</span>
            </button>
          );
        })}
        <button onClick={onMore} className="flex flex-col items-center justify-center gap-1 text-ink-3">
          <MoreHorizontal className="h-[18px] w-[18px]" />
          <span className="font-mono text-[9px] uppercase tracking-wider">Mais</span>
        </button>
      </div>
    </nav>
  );
}
