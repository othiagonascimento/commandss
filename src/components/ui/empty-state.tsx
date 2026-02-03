import * as React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action,
  secondaryAction,
  className,
  size = "md"
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-8",
      icon: "h-10 w-10",
      iconWrapper: "p-3",
      title: "text-base",
      description: "text-xs",
    },
    md: {
      container: "py-12",
      icon: "h-12 w-12",
      iconWrapper: "p-4",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16",
      iconWrapper: "p-5",
      title: "text-xl",
      description: "text-base",
    },
  };

  const s = sizes[size];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      s.container,
      className
    )}>
      <div className={cn(
        "rounded-full bg-muted/50 mb-4",
        s.iconWrapper
      )}>
        <Icon className={cn("text-muted-foreground/60", s.icon)} />
      </div>
      
      <h3 className={cn("font-semibold text-foreground mb-1", s.title)}>
        {title}
      </h3>
      
      {description && (
        <p className={cn("text-muted-foreground max-w-sm mb-4", s.description)}>
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {action && (
            <Button 
              onClick={action.onClick}
              variant={action.variant || "default"}
              size={size === "sm" ? "sm" : "default"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="ghost"
              size={size === "sm" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
