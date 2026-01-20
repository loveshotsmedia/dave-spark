import { useState } from "react";
import { Printer, Send, ExternalLink, Loader2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-4 relative overflow-hidden"
    >
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-sm bg-gradient-to-r from-emerald-500/20 via-primary/20 to-emerald-500/20 blur-sm" />
      
      <div className="relative bg-zinc-950/80 backdrop-blur-md border border-emerald-500/30 rounded-sm p-4 space-y-4">
        {/* Header with success indicator */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/30"
          >
            <FileCheck className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
          </motion.div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Proposal Ready
            </p>
            {contactName && (
              <p className="text-sm text-zinc-300 mt-0.5">
                {contactName}
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          <Button
            onClick={handlePrintProposal}
            variant="default"
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
            disabled={isPrinting}
          >
            {isPrinting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            Print / Download PDF
          </Button>

          {contactId && (
            <Button
              onClick={handleSendToClient}
              variant="outline"
              size="sm"
              className="gap-2 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10"
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              Email to Client
            </Button>
          )}

          <Button
            onClick={handleViewProposal}
            variant="ghost"
            size="sm"
            className="gap-2 text-zinc-400 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            View Online
          </Button>
        </motion.div>

        {/* Helper text */}
        <p className="text-xs text-zinc-500 font-mono">
          Print opens the full proposal with diagrams. Choose "Save as PDF" to download.
        </p>
      </div>
    </motion.div>
  );
}
