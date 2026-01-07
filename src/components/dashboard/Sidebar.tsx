import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
  LogOut,
  Flag,
  Megaphone,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/',
    description: 'Visão geral do sistema',
  },
  { 
    icon: Building2, 
    label: 'Tenants', 
    path: '/tenants',
    description: 'Gerenciar empresas',
  },
  { 
    icon: Users, 
    label: 'Usuários', 
    path: '/users',
    description: 'Gerenciar usuários',
  },
  { 
    icon: CreditCard, 
    label: 'Assinaturas', 
    path: '/subscriptions',
    description: 'Planos e cobranças',
  },
  { 
    icon: Link2, 
    label: 'Links de Convite', 
    path: '/invite-links',
    description: 'Gerar links comerciais',
  },
  { 
    icon: Flag, 
    label: 'Feature Flags', 
    path: '/feature-flags',
    description: 'Controle de funcionalidades',
  },
  { 
    icon: Megaphone, 
    label: 'Broadcasts', 
    path: '/broadcasts',
    description: 'Comunicados e avisos',
  },
  { 
    icon: Settings, 
    label: 'Configurações', 
    path: '/settings',
    description: 'Configurações do sistema',
  },
];

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const NavItem = ({ item, index }: { item: typeof navItems[0]; index: number }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== '/' && location.pathname.startsWith(item.path));
    
    const handleClick = () => {
      navigate(item.path);
      onMobileClose();
    };

    const button = (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'transition-all duration-200',
          'hover:bg-sidebar-accent',
          'group relative',
          isActive && 'bg-sidebar-accent text-primary'
        )}
      >
        <item.icon
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 text-left overflow-hidden"
            >
              <span className="text-sm font-medium whitespace-nowrap block">
                {item.label}
              </span>
              {item.description && (
                <span className="text-xs text-muted-foreground whitespace-nowrap block">
                  {item.description}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Active Indicator */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary"
          />
        )}
      </motion.button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{item.label}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  const sidebarContent = (
    <>
      {/* Toggle Button - Desktop */}
      <div className="hidden lg:flex justify-end p-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse(!collapsed)}
          className="h-8 gap-2 text-muted-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Recolher menu</span>
            </>
          )}
        </Button>
      </div>

      {/* Close Button - Mobile */}
      <div className="flex lg:hidden justify-between items-center p-4 border-b border-border">
        <span className="font-semibold">Menu</span>
        <Button variant="ghost" size="icon" onClick={onMobileClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="mb-4">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Menu Principal
          </p>
        </div>
        {navItems.map((item, index) => (
          <NavItem key={item.label} item={item} index={index} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'transition-all duration-200',
            'hover:bg-sidebar-accent',
            'text-muted-foreground hover:text-foreground'
          )}
        >
          <HelpCircle className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-left"
              >
                <span className="text-sm font-medium whitespace-nowrap block">Ajuda</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        
        <button
          onClick={() => signOut()}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'transition-all duration-200',
            'hover:bg-destructive/10',
            'text-muted-foreground hover:text-destructive'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-left"
              >
                <span className="text-sm font-medium whitespace-nowrap block">Sair</span>
              </motion.div>
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
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'hidden lg:flex flex-col',
          'fixed left-0 top-16 bottom-0',
          'bg-card border-r border-border',
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
              className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[300px] bg-card border-r border-border z-50 flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
