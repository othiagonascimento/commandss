import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Terminal,
  Users,
  Mail,
  DollarSign,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Activity, label: 'Health Monitor' },
  { icon: AlertTriangle, label: 'Error Zones' },
  { icon: Terminal, label: 'Live Logs' },
  { icon: Users, label: 'Active Users' },
  { icon: Mail, label: 'Message Queues' },
  { icon: DollarSign, label: 'Revenue' },
  { icon: Cpu, label: 'System' },
];

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const sidebarContent = (
    <>
      {/* Toggle Button - Desktop */}
      <div className="hidden lg:flex justify-end p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapse(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Close Button - Mobile */}
      <div className="flex lg:hidden justify-between items-center p-4 border-b border-border/40">
        <span className="font-semibold">Menu</span>
        <Button variant="ghost" size="icon" onClick={onMobileClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'transition-all duration-200',
              'hover:bg-sidebar-accent',
              'group relative',
              item.active && 'bg-sidebar-accent text-neon-green'
            )}
          >
            <item.icon
              className={cn(
                'h-5 w-5 flex-shrink-0 transition-all duration-200',
                item.active ? 'text-neon-green drop-shadow-[0_0_8px_hsl(160_100%_50%/0.6)]' : 'text-sidebar-foreground group-hover:text-foreground'
              )}
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            
            {/* Active Indicator */}
            {item.active && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-neon-green"
                style={{
                  boxShadow: '0 0 12px hsl(160 100% 50% / 0.6)',
                }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-border/40">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'transition-all duration-200',
            'hover:bg-sidebar-accent',
            'text-muted-foreground hover:text-foreground'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'hidden lg:flex flex-col',
          'fixed left-0 top-16 bottom-0',
          'bg-sidebar border-r border-border/40',
          'z-40'
        )}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-border/40 z-50 flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
