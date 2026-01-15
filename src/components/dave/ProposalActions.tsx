import { Download, ExternalLink, Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ProposalActionsProps {
  proposalId: string;
  contactName?: string;
}

export function ProposalActions({ proposalId, contactName }: ProposalActionsProps) {
  const handleDownloadPDF = () => {
    const proposalUrl = `https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api/content/view/${proposalId}`;
    const printWindow = window.open(proposalUrl, '_blank', 'width=1024,height=768');
    
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }

    toast({
      title: "Opening Print Dialog",
      description: "Choose 'Save as PDF' to download the complete proposal",
    });
  };

  const handleViewProposal = () => {
    const viewUrl = `https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api/content/view/${proposalId}`;
    window.open(viewUrl, '_blank');

    toast({
      title: "Opening Proposal",
      description: "Use Ctrl+P to print or save as PDF",
    });
  };

  const handleSendToClient = async () => {
    const proposalUrl = `https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api/content/view/${proposalId}`;

    try {
      await navigator.clipboard.writeText(proposalUrl);
      toast({
        title: "Proposal Link Copied!",
        description: "Paste this link into an email to share with your client",
        duration: 8000,
      });
    } catch {
      toast({
        title: "Share Proposal",
        description: proposalUrl,
        duration: 15000,
      });
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
      <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
        {contactName ? `Proposal for ${contactName}` : 'Proposal Actions'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleDownloadPDF}
          variant="default"
          size="sm"
          className="gap-2"
        >
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </Button>
        <Button
          onClick={handleSendToClient}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Mail className="h-3.5 w-3.5" />
          Send to Client
        </Button>
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
        Click "Download PDF" and choose "Save as PDF" from the print dialog
      </p>
    </div>
  );
}