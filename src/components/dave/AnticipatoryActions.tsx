import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAnticipatoryActions, Suggestion } from "@/lib/api";

interface AnticipatoryActionsProps {
  onActionSelect: (action: string) => void;
}

export function AnticipatoryActions({ onActionSelect }: AnticipatoryActionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { suggestions } = await getAnticipatoryActions();
        setSuggestions(suggestions);
      } catch (error) {
        // Provide fallback suggestions
        setSuggestions([
          {
            id: "1",
            action: "Review upcoming meetings",
            description: "Check your calendar for today",
            icon: "📅",
            priority: 1,
          },
          {
            id: "2",
            action: "Check pending tasks",
            description: "Review your task list",
            icon: "✅",
            priority: 2,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
    // Refresh every 10 minutes
    const interval = setInterval(fetchSuggestions, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleSuggestions = suggestions
    .filter((s) => !dismissed.has(s.id))
    .slice(0, 3);

  if (isLoading || visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-28 left-1/2 z-30 -translate-x-1/2 md:bottom-32">
      <div className="flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-sm border shadow-lg px-2 py-1.5">
        <Sparkles className="h-4 w-4 text-primary ml-2" />
        
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-center gap-1 animate-pulse-subtle"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onActionSelect(suggestion.action)}
              className="rounded-full text-sm px-3 py-1 h-auto hover:bg-primary/10"
            >
              <span className="mr-1">{suggestion.icon}</span>
              {suggestion.action}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed((prev) => new Set([...prev, suggestion.id]))}
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