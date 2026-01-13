import { useState, useEffect } from "react";
import { Sparkles, X, Calendar, CheckSquare, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAppointments, getTasks } from "@/lib/api";

interface Suggestion {
  action: string;
  icon: React.ReactNode;
  priority: "high" | "medium" | "low";
}

interface AnticipatoryActionsProps {
  onActionSelect: (action: string) => void;
}

export function AnticipatoryActions({ onActionSelect }: AnticipatoryActionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setError(null);
        const [appointmentsRes, tasksRes] = await Promise.all([
          getAppointments({ upcoming: true, limit: 5 }),
          getTasks({ status: "pending", limit: 5 })
        ]);

        const newSuggestions: Suggestion[] = [];

        // Appointments today
        const todayAppts = appointmentsRes.appointments?.filter((a) => 
          new Date(a.scheduled_at).toDateString() === new Date().toDateString()
        ) || [];
        
        if (todayAppts.length > 0) {
          newSuggestions.push({
            action: `Review ${todayAppts.length} appointment${todayAppts.length > 1 ? 's' : ''} today`,
            icon: <Calendar className="h-4 w-4 mr-1" />,
            priority: "high"
          });
        }

        // Pending/overdue tasks
        const pendingTasks = tasksRes.tasks || [];
        if (pendingTasks.length > 0) {
          const overdue = pendingTasks.filter((t) => 
            t.due_date && new Date(t.due_date) < new Date()
          );
          if (overdue.length > 0) {
            newSuggestions.push({
              action: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} need attention`,
              icon: <CheckSquare className="h-4 w-4 mr-1" />,
              priority: "high"
            });
          } else {
            newSuggestions.push({
              action: `${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''} to review`,
              icon: <CheckSquare className="h-4 w-4 mr-1" />,
              priority: "medium"
            });
          }
        }

        // Default suggestion if nothing urgent
        if (newSuggestions.length === 0) {
          newSuggestions.push({
            action: "Search clients",
            icon: <Users className="h-4 w-4 mr-1" />,
            priority: "low"
          });
        }

        setSuggestions(newSuggestions);
      } catch (e) {
        console.error("Failed to fetch suggestions:", e);
        setError("Unable to load suggestions");
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, []);

  const visible = suggestions.filter((_, idx) => !dismissed.has(idx));

  // Don't render while loading or if all dismissed
  if (loading) {
    return (
      <div className="fixed bottom-28 left-1/2 z-30 -translate-x-1/2 md:bottom-32">
        <div className="flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-sm border shadow-lg px-4 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (error || visible.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-28 left-1/2 z-30 -translate-x-1/2 md:bottom-32">
      <div className="flex items-center gap-2 rounded-full bg-card/95 backdrop-blur-sm border shadow-lg px-2 py-1.5">
        <Sparkles className="h-4 w-4 text-primary ml-2" />
        
        {suggestions.map((suggestion, idx) => !dismissed.has(idx) && (
          <div
            key={idx}
            className="flex items-center gap-1"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onActionSelect(suggestion.action)}
              className={`rounded-full text-sm px-3 py-1 h-auto hover:bg-primary/10 flex items-center ${
                suggestion.priority === "high" ? "text-destructive" : ""
              }`}
            >
              {suggestion.icon}
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
