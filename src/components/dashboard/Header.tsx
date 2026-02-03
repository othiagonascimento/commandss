import { motion } from 'framer-motion';
import { Bell, Menu, HelpCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import uopaSymbol from '@/assets/uopa-symbol.png';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { masterUser, isLoading } = usePermissions();

  // Get display name with fallback chain
  const displayName = masterUser?.full_name 
    || user?.email?.split('@')[0] 
    || 'Usuário';
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-border bg-card"
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: Logo & Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* UÔPA Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={uopaSymbol} 
              alt="UÔPA" 
              className="h-9 w-auto"
            />
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground">Painel Master</h1>
              <p className="text-xs text-muted-foreground">Gestão multi-tenant</p>
            </div>
          </div>
        </div>

        {/* Center: System Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
        >
          <span className="status-dot status-dot-success" />
          <span className="text-sm text-success font-medium">
            Sistema operacional
          </span>
        </motion.div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* User Info */}
          <div className="hidden sm:flex items-center gap-2 ml-2 pl-4 border-l border-border">
            {isLoading ? (
              <>
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-20 h-4" />
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                  {masterUser ? getInitials(displayName) : <User className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{displayName}</span>
                  {masterUser && (
                    <span className="text-xs text-muted-foreground mt-0.5">Master Admin</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
