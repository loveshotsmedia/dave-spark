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
      <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 max-w-[95vw] md:bottom-32">
        <div className="flex items-center gap-2 rounded-sm bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 shadow-lg px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500 font-mono">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || visible.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 max-w-[95vw] md:bottom-32">
      <div className="flex items-center gap-1 md:gap-2 rounded-sm bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 shadow-lg px-2 py-1.5 overflow-x-auto scrollbar-thin">
        <Sparkles className="h-4 w-4 text-emerald-500 ml-1 shrink-0" />
        
        {suggestions.map((suggestion, idx) => !dismissed.has(idx) && (
          <div
            key={idx}
            className="flex items-center gap-1 shrink-0"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onActionSelect(suggestion.action)}
              className={`rounded-sm text-xs px-2 py-1 h-auto hover:bg-zinc-800 flex items-center font-mono ${
                suggestion.priority === "high" ? "text-red-400" : "text-zinc-400"
              }`}
            >
              {suggestion.icon}
              <span className="hidden sm:inline">{suggestion.action}</span>
              <span className="sm:hidden">{suggestion.action.split(' ').slice(0, 3).join(' ')}...</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed((prev) => new Set([...prev, idx]))}
              className="h-5 w-5 rounded-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
