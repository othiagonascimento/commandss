import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: LucideIcon;
  badge?: string;
}

interface ScrollableTabsListProps {
  tabs: TabItem[];
  className?: string;
  showIconOnly?: boolean;
}

export function ScrollableTabsList({ tabs, className, showIconOnly = false }: ScrollableTabsListProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <TabsList className={cn("inline-flex w-max gap-1 p-1 h-auto", className)}>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value} 
            className="gap-1.5 px-3 py-2 text-xs sm:text-sm min-w-fit whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            {tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
            {!showIconOnly && (
              <>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              </>
            )}
            {showIconOnly && <span className="sr-only">{tab.label}</span>}
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}

// Mobile dropdown alternative for tabs
interface MobileTabSelectorProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function MobileTabSelector({ tabs, value, onValueChange, className }: MobileTabSelectorProps) {
  const currentTab = tabs.find(t => t.value === value);
  
  return (
    <div className={cn("sm:hidden", className)}>
      <select 
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full p-2.5 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {tabs.map((tab) => (
          <option key={tab.value} value={tab.value}>
            {tab.icon ? `${tab.label}` : tab.label}
          </option>
        ))}
      </select>
    </div>
  );
}
