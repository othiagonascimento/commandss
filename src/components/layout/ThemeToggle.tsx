import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme();
  const Icon = resolved === 'dark' ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Alternar tema"
          className="p-1.5 text-ink-2 hover:text-ink transition-colors rounded-sm"
        >
          <Icon className="h-[15px] w-[15px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-surface-3 border-hairline w-44 font-mono text-[11px]">
        <Item active={mode === 'light'} icon={Sun} label="Claro" onClick={() => setMode('light')} />
        <Item active={mode === 'dark'} icon={Moon} label="Escuro" onClick={() => setMode('dark')} />
        <Item active={mode === 'system'} icon={Monitor} label="Sistema" onClick={() => setMode('system')} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Item({ active, icon: Icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        'gap-2 uppercase tracking-wider cursor-pointer',
        active ? 'text-plasma' : 'text-ink-2',
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
      {active && <span className="ml-auto text-[9px] text-plasma">●</span>}
    </DropdownMenuItem>
  );
}
