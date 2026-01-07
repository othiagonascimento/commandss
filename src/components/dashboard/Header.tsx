import { motion } from 'framer-motion';
import { Bell, Menu, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import uopaLogo from '@/assets/uopa-logo-white.png';
import uopaSymbol from '@/assets/uopa-symbol.png';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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
              <h1 className="font-semibold text-foreground">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">Visão geral do seu negócio</p>
            </div>
          </div>
        </div>

        {/* Center: Welcome */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
        >
          <span className="status-dot status-dot-success" />
          <span className="text-sm text-success font-medium">
            Tudo funcionando normalmente
          </span>
        </motion.div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
          </Button>
          <div className="hidden sm:flex items-center gap-2 ml-2 pl-4 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
              A
            </div>
            <span className="text-sm font-medium">Admin</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
