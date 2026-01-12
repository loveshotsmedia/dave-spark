import { useState } from "react";
import { X, FileText, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface DocumentCallModalProps {
  contactId: string;
  contactName: string;
  isOpen: boolean;
  onClose: () => void;
  onDocumented: () => void;
}

export function DocumentCallModal({
  contactId,
  contactName,
  isOpen,
  onClose,
  onDocumented,
}: DocumentCallModalProps) {
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    sentiment: string;
    followUpDate: string;
  } | null>(null);

  const handleProcess = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    try {
      const data = await api.documentCall(contactId, transcript);
      setResult(data);
    } catch (error) {
      console.error("Failed to document call:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    onDocumented();
    handleClose();
  };

  const handleClose = () => {
    setTranscript("");
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-message-in">
        <div className="rounded-2xl bg-card shadow-xl border">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Document Call</h2>
                <p className="text-sm text-muted-foreground">{contactName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-thin">
            {!result ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Call Transcript or Notes</Label>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste the call transcript or type your notes from the conversation..."
                    className="min-h-[200px]"
                  />
                </div>

                <Button
                  onClick={handleProcess}
                  disabled={!transcript.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Process & Extract
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Summary */}
                <div className="space-y-2">
                  <h3 className="font-medium">Summary</h3>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>

                {/* Key Points */}
                {result.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Key Points</h3>
                    <ul className="space-y-1.5">
                      {result.keyPoints.map((point, i) => (
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

                {/* Action Items */}
                {result.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Action Items</h3>
                    <ul className="space-y-1.5">
                      {result.actionItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle className="mt-0.5 h-4 w-4 text-success shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sentiment & Follow-up */}
                <div className="flex gap-4">
                  <div className="flex-1 rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Sentiment</p>
                    <p className="font-medium capitalize">{result.sentiment}</p>
                  </div>
                  <div className="flex-1 rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Follow-up Date</p>
                    <p className="font-medium">{result.followUpDate}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {result && (
            <div className="border-t px-6 py-4 flex gap-3">
              <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                Edit
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save to Contact
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}