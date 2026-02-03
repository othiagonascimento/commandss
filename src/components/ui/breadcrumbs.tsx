import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumbs({ items, showHome = true, className }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {showHome && (
          <>
            <li>
              <Link 
                to="/" 
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            {items.length > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            )}
          </>
        )}
        
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            <li>
              {item.current || !item.href ? (
                <span 
                  className={cn(
                    "font-medium px-1",
                    item.current ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link 
                  to={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-muted"
                >
                  {item.label}
                </Link>
              )}
            </li>
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}
