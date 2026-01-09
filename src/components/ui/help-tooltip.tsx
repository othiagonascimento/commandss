import * as React from "react";
import { HelpCircle, Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  title?: string;
  description: string;
  example?: string;
  className?: string;
  iconSize?: "sm" | "md";
  variant?: "default" | "info";
}

export function HelpTooltip({
  title,
  description,
  example,
  className,
  iconSize = "sm",
  variant = "default",
}: HelpTooltipProps) {
  const sizeClasses = iconSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors ml-1 focus:outline-none focus:ring-1 focus:ring-ring",
              className
            )}
          >
            {variant === "info" ? (
              <Lightbulb className={cn(sizeClasses, "text-primary")} />
            ) : (
              <HelpCircle className={sizeClasses} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs p-3 space-y-1.5"
          sideOffset={4}
        >
          {title && (
            <p className="font-medium text-sm text-foreground">{title}</p>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
          {example && (
            <p className="text-xs text-primary/80 italic border-l-2 border-primary/30 pl-2 mt-2">
              {example}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface EducationalBannerProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function EducationalBanner({
  icon,
  title,
  description,
  className,
}: EducationalBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6",
        className
      )}
    >
      {icon || <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
      <div className="space-y-1">
        <p className="font-medium text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

interface SectionHelpProps {
  title: string;
  description: string;
  impact?: string;
  className?: string;
}

export function SectionHelp({
  title,
  description,
  impact,
  className,
}: SectionHelpProps) {
  return (
    <div
      className={cn(
        "text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4",
        className
      )}
    >
      <p className="font-medium text-foreground mb-1">{title}</p>
      <p className="leading-relaxed">{description}</p>
      {impact && (
        <p className="mt-2 text-primary/80">
          <span className="font-medium">Impacto no tenant:</span> {impact}
        </p>
      )}
    </div>
  );
}
