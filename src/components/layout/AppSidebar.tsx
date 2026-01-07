import { useState, useMemo } from 'react';
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
  Brain,
  ChevronDown,
  Briefcase,
  BarChart3,
  Cog,
  UserCog,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  description?: string;
  badge?: string;
  permissionCheck?: () => boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  permissionCheck?: () => boolean;
}

export function AppSidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const permissions = usePermissions();
  const [openGroups, setOpenGroups] = useState<string[]>(['overview', 'ai', 'clients', 'commercial', 'system']);

  // Define nav groups with permission checks
  const navGroups: NavGroup[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: BarChart3,
      permissionCheck: permissions.canViewDashboard,
      items: [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          path: '/',
          description: 'Métricas e visão geral',
          permissionCheck: permissions.canViewDashboard,
        },
      ],
    },
    {
      id: 'ai',
      label: 'Inteligência Artificial',
      icon: Brain,
      permissionCheck: permissions.canViewTemplates,
      items: [
        {
          icon: Brain,
          label: 'Templates de Nicho',
          path: '/admin/templates',
          description: 'Treinar IA por segmento',
          badge: 'IA',
          permissionCheck: permissions.canViewTemplates,
        },
      ],
    },
    {
      id: 'clients',
      label: 'Gestão de Clientes',
      icon: Building2,
      permissionCheck: () => permissions.canViewTenants() || permissions.canViewUsers(),
      items: [
        {
          icon: Building2,
          label: 'Tenants',
          path: '/tenants',
          description: 'Empresas cadastradas',
          permissionCheck: permissions.canViewTenants,
        },
        {
          icon: Users,
          label: 'Usuários',
          path: '/users',
          description: 'Usuários do sistema',
          permissionCheck: permissions.canViewUsers,
        },
      ],
    },
    {
      id: 'commercial',
      label: 'Comercial',
      icon: Briefcase,
      permissionCheck: () => permissions.canViewSubscriptions() || permissions.canViewInviteLinks() || permissions.canViewBroadcasts(),
      items: [
        {
          icon: CreditCard,
          label: 'Assinaturas',
          path: '/subscriptions',
          description: 'Planos e cobranças',
          permissionCheck: permissions.canViewSubscriptions,
        },
        {
          icon: Link2,
          label: 'Links de Convite',
          path: '/invite-links',
          description: 'Links comerciais',
          permissionCheck: permissions.canViewInviteLinks,
        },
        {
          icon: Megaphone,
          label: 'Broadcasts',
          path: '/broadcasts',
          description: 'Comunicados',
          permissionCheck: permissions.canViewBroadcasts,
        },
        {
          icon: FileText,
          label: 'Novo Contrato',
          path: '/tenants/contract',
          description: 'Criar contrato',
          permissionCheck: permissions.canViewTenants,
        },
      ],
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: Cog,
      permissionCheck: () => permissions.canViewMasterUsers() || permissions.canViewFeatureFlags() || permissions.canViewSettings(),
      items: [
        {
          icon: UserCog,
          label: 'Usuários Master',
          path: '/master-users',
          description: 'Gestão de acessos',
          permissionCheck: permissions.canViewMasterUsers,
        },
        {
          icon: Flag,
          label: 'Feature Flags',
          path: '/feature-flags',
          description: 'Controle de features',
          permissionCheck: permissions.canViewFeatureFlags,
        },
        {
          icon: Settings,
          label: 'Configurações',
          path: '/settings',
          description: 'Config. do sistema',
          permissionCheck: permissions.canViewSettings,
        },
      ],
    },
  ], [permissions]);

  // Filter items based on permissions (if super admin or no master user yet, show all)
  const filteredNavGroups = useMemo(() => {
    // If still loading or user is super admin, show everything
    if (permissions.isLoading || permissions.isSuperAdmin() || !permissions.masterUser) {
      return navGroups;
    }

    return navGroups
      .filter(group => !group.permissionCheck || group.permissionCheck())
      .map(group => ({
        ...group,
        items: group.items.filter(item => !item.permissionCheck || item.permissionCheck()),
      }))
      .filter(group => group.items.length > 0);
  }, [navGroups, permissions]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => isPathActive(item.path));
  };

  const NavItemButton = ({ item, index }: { item: NavItem; index: number }) => {
    const isActive = isPathActive(item.path);

    const handleClick = () => {
      navigate(item.path);
      onMobileClose();
    };

    const button = (
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
          'transition-all duration-200',
          'hover:bg-sidebar-accent',
          'group relative',
          collapsed ? 'justify-center' : 'pl-9',
          isActive && 'bg-sidebar-accent text-primary font-medium'
        )}
      >
        <item.icon
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 flex items-center justify-between overflow-hidden"
            >
              <span className="text-sm whitespace-nowrap">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {item.badge}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isActive && (
          <motion.div
            layoutId="sidebarActiveIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-primary"
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
              <span className="text-xs">Recolher</span>
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

      {/* Navigation Groups */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavGroups.map((group) => {
          const isOpen = openGroups.includes(group.id);
          const groupActive = isGroupActive(group);

          // Single item groups render directly
          if (group.items.length === 1) {
            return (
              <div key={group.id} className="mb-1">
                <NavItemButton item={group.items[0]} index={0} />
              </div>
            );
          }

          // Collapsed sidebar shows only icons
          if (collapsed) {
            return (
              <div key={group.id} className="mb-2">
                {group.items.map((item, idx) => (
                  <NavItemButton key={item.path} item={item} index={idx} />
                ))}
              </div>
            );
          }

          // Full sidebar with collapsible groups
          return (
            <Collapsible
              key={group.id}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.id)}
              className="mb-1"
            >
              <CollapsibleTrigger className="w-full">
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg',
                    'text-sm font-medium text-muted-foreground',
                    'hover:bg-sidebar-accent hover:text-foreground',
                    'transition-colors cursor-pointer',
                    groupActive && 'text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4" />
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-0.5">
                {group.items.map((item, idx) => (
                  <NavItemButton key={item.path} item={item} index={idx} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
            'transition-all duration-200',
            'hover:bg-sidebar-accent',
            'text-muted-foreground hover:text-foreground',
            collapsed && 'justify-center'
          )}
        >
          <HelpCircle className="h-4 w-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm whitespace-nowrap"
              >
                Ajuda
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => signOut()}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
            'transition-all duration-200',
            'hover:bg-destructive/10',
            'text-muted-foreground hover:text-destructive',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm whitespace-nowrap"
              >
                Sair
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
