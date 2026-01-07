import { motion } from 'framer-motion';
import { Bell, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusLED } from './StatusLED';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl"
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
          
          {/* Logo Placeholder */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center animate-breathing"
              style={{
                boxShadow: '0 0 20px hsl(160 100% 50% / 0.4)',
              }}
            >
              <span className="font-bold text-background text-lg">G</span>
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold tracking-tight">God Mode</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Center: System Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass-card"
        >
          <StatusLED status="online" size="sm" />
          <span className="font-mono text-sm text-neon-green">
            Sistema Operacional: Online
          </span>
          <span className="text-muted-foreground text-sm">|</span>
          <span className="text-sm text-foreground/80">
            Bem-vindo, <span className="text-neon-cyan font-medium">Admin</span>
          </span>
        </motion.div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-magenta animate-pulse" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
