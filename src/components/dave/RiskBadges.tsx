import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getRisks, Risk } from "@/lib/api";

export function RiskBadges() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const { risks } = await getRisks();
        setRisks(risks);
      } catch (error) {
        // Silently fail - risks are not critical
        setRisks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRisks();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRisks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const warningCount = risks.filter((r) => r.severity === "warning").length;

  if (isLoading || (criticalCount === 0 && warningCount === 0)) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{criticalCount}</span>
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">{warningCount}</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <h4 className="font-medium">Attention Required</h4>
          <div className="space-y-2">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className={`rounded-lg border p-3 ${
                  risk.severity === "critical"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-warning/30 bg-warning/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {risk.severity === "critical" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{risk.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {risk.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}