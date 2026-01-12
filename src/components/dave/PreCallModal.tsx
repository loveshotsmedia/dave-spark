import { useState, useEffect } from "react";
import { X, PhoneCall, AlertTriangle, Target, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPreCallBriefing } from "@/lib/api";

interface PreCallModalProps {
  contactId: string;
  contactName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PreCallModal({ contactId, contactName, isOpen, onClose }: PreCallModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [briefing, setBriefing] = useState<{
    briefing: string;
    keyPoints: string[];
    landmines: string[];
    bestOutcome: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && contactId) {
      fetchBriefing();
    }
  }, [isOpen, contactId]);

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const data = await getPreCallBriefing(contactId);
      setBriefing(data);
    } catch (error) {
      console.error("Failed to fetch briefing:", error);
      // Provide fallback data
      setBriefing({
        briefing: "Unable to load briefing. Please try again.",
        keyPoints: [],
        landmines: [],
        bestOutcome: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-message-in">
        <div className="rounded-2xl bg-card shadow-xl border">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2">
                <PhoneCall className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Pre-Call Briefing</h2>
                <p className="text-sm text-muted-foreground">{contactName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : briefing ? (
              <div className="space-y-6">
                {/* Main Briefing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">30-Second Summary</h3>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Volume2 className="h-4 w-4" />
                      Read Aloud
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {briefing.briefing}
                  </p>
                </div>

                {/* Key Points */}
                {briefing.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Key Points to Remember</h3>
                    <ul className="space-y-1.5">
                      {briefing.keyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Landmines */}
                {briefing.landmines.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <h3 className="font-medium">Landmines to Avoid</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {briefing.landmines.map((landmine, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                          {landmine}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best Outcome */}
                {briefing.bestOutcome && (
                  <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-success" />
                      <h3 className="font-medium text-success">Best Possible Outcome</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {briefing.bestOutcome}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Failed to load briefing
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            <Button onClick={onClose} className="w-full">
              Ready for Call
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}