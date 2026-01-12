import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GaarWarningBadgeProps {
  level: "none" | "caution" | "warning" | "critical";
  message?: string;
  details?: string[];
  className?: string;
}

export function GaarWarningBadge({ level, message, details, className }: GaarWarningBadgeProps) {
  if (level === "none") {
    return null;
  }

  const config = {
    caution: {
      icon: Info,
      label: "GAAR Caution",
      variant: "secondary" as const,
      colorClass: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20",
    },
    warning: {
      icon: AlertTriangle,
      label: "GAAR Warning",
      variant: "outline" as const,
      colorClass: "bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500/20",
    },
    critical: {
      icon: ShieldAlert,
      label: "GAAR Alert",
      variant: "destructive" as const,
      colorClass: "bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20",
    },
  };

  const { icon: Icon, label, colorClass } = config[level];

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "cursor-help gap-1.5 transition-colors",
        colorClass,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );

  if (!message && (!details || details.length === 0)) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            {message && <p className="text-sm font-medium">{message}</p>}
            {details && details.length > 0 && (
              <ul className="text-xs space-y-1">
                {details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-muted-foreground">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook to check if a message warrants a GAAR warning display
export function useGaarCheck(content: string): { showWarning: boolean; level: GaarWarningBadgeProps["level"] } {
  const lowercaseContent = content.toLowerCase();
  
  // Check for GAAR-related keywords in the response
  const gaarKeywords = ["gaar", "general anti-avoidance", "anti-avoidance rule", "abusive tax avoidance"];
  const cautionKeywords = ["tax planning", "tax efficiency", "tax optimization"];
  const warningKeywords = ["aggressive tax", "tax shelter", "tax deferral scheme"];
  
  const hasGaarMention = gaarKeywords.some(kw => lowercaseContent.includes(kw));
  const hasCautionKeyword = cautionKeywords.some(kw => lowercaseContent.includes(kw));
  const hasWarningKeyword = warningKeywords.some(kw => lowercaseContent.includes(kw));
  
  if (hasGaarMention) {
    return { showWarning: true, level: "warning" };
  }
  
  if (hasWarningKeyword) {
    return { showWarning: true, level: "caution" };
  }
  
  if (hasCautionKeyword) {
    return { showWarning: false, level: "none" };
  }
  
  return { showWarning: false, level: "none" };
}
