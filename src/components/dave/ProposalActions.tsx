import { useState } from "react";
import { Printer, Send, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ProposalActionsProps {
  proposalId: string;
  contactId?: string;
  contactName?: string;
  onSendComplete?: () => void;
}

export function ProposalActions({ 
  proposalId, 
  contactId, 
  contactName,
  onSendComplete 
}: ProposalActionsProps) {
  const [isSending, setIsSending] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrintProposal = () => {
    if (!proposalId) {
      toast({
        title: "Error",
        description: "No proposal available to print",
        variant: "destructive"
      });
      return;
    }

    setIsPrinting(true);

    // Open backend-rendered page with auto-print
    const printUrl = `https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api/content/view/${proposalId}?print=true`;

    // Open in new window
    const printWindow = window.open(printUrl, '_blank');

    if (!printWindow) {
      toast({
        title: "Pop-up Blocked",
        description: "Please allow pop-ups to print the proposal",
        variant: "destructive"
      });
      setIsPrinting(false);
      return;
    }

    toast({
      title: "Opening Print Dialog",
      description: "The proposal will open with diagrams. Choose 'Save as PDF' or 'Print'.",
      duration: 6000
    });

    // Reset state after a delay
    setTimeout(() => setIsPrinting(false), 2000);
  };

  const handleSendToClient = async () => {
    if (!proposalId || !contactId) {
      toast({
        title: "Error",
        description: "Missing proposal or contact information",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(
        'https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'proposals/send',
            proposalId,
            contactId,
            customMessage: "I've prepared a personalized wealth planning proposal for you. Please review the strategies outlined and let me know if you have any questions."
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Proposal Sent!",
          description: `Email sent to ${contactName || 'client'} successfully`,
          duration: 5000
        });

        if (onSendComplete) {
          onSendComplete();
        }
      } else {
        throw new Error(result.error || 'Failed to send proposal');
      }
    } catch (error) {
      console.error('Send proposal error:', error);
      toast({
        title: "Error",
        description: "Failed to send proposal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleViewProposal = () => {
    if (!proposalId) return;

    const viewUrl = `https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api/content/view/${proposalId}`;
    window.open(viewUrl, '_blank');

    toast({
      title: "Opening Proposal",
      description: "Proposal opened in new tab. Use Ctrl+P (Cmd+P on Mac) to print.",
      duration: 4000
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
      <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
        {contactName ? `Proposal for ${contactName}` : 'Proposal Actions'}
      </p>
      
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handlePrintProposal}
          variant="default"
          size="sm"
          className="gap-2"
          disabled={isPrinting}
        >
          {isPrinting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Printer className="h-3.5 w-3.5" />
          )}
          Print Entire Proposal
        </Button>

        {contactId && (
          <Button
            onClick={handleSendToClient}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send to Client
          </Button>
        )}

        <Button
          onClick={handleViewProposal}
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Full Page
        </Button>
      </div>

      <p className="text-xs text-zinc-600">
        Print: Opens complete proposal with all diagrams. Choose "Save as PDF" from print dialog.
        {contactId && <> Send: Emails proposal link to client.</>}
      </p>
    </div>
  );
}
