import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnticipatoryActionsProps {
  onActionSelect: (action: string) => void;
}

// Static suggestions since the alien/anticipate endpoint is not available in Dave 2.0
const DEFAULT_SUGGESTIONS = [
  { action: "Check today's appointments", priority: "medium" as const },
  { action: "Review pending tasks", priority: "medium" as const },
  { action: "Search client files", priority: "low" as const },
];

export function AnticipatoryActions({ onActionSelect }: AnticipatoryActionsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visibleSuggestions = DEFAULT_SUGGESTIONS.filter((_, idx) => !dismissed.has(idx));

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-28 left-1/2 z-30 -translate-x-1/2 md:bottom-32">
      <div className="flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-sm border shadow-lg px-2 py-1.5">
        <Sparkles className="h-4 w-4 text-primary ml-2" />
        
        {DEFAULT_SUGGESTIONS.map((suggestion, idx) => !dismissed.has(idx) && (
          <div
            key={idx}
            className="flex items-center gap-1 animate-pulse-subtle"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onActionSelect(suggestion.action)}
              className="rounded-full text-sm px-3 py-1 h-auto hover:bg-primary/10"
            >
              {suggestion.action}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed((prev) => new Set([...prev, idx]))}
              className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
