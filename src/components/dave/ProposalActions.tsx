import { useState } from "react";
import { Printer, Send, ExternalLink, Loader2, FileCheck, Download, Mail, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { getContact, sendEmail, type DiagramData } from "@/lib/api";
import { buildProposalMarkdownWithDiagrams, safeFilename } from "@/lib/proposalMarkdownExport";
import JSZip from "jszip";

interface ProposalActionsProps {
  proposalId?: string;
  contactId?: string;
  contactName?: string;
  onSendComplete?: () => void;
  proposalMarkdown?: string;
  diagrams?: DiagramData[];
}

export function ProposalActions({ 
  proposalId, 
  contactId, 
  contactName,
  onSendComplete,
  proposalMarkdown,
  diagrams,
}: ProposalActionsProps) {
  const [isSending, setIsSending] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSendingMarkdown, setIsSendingMarkdown] = useState(false);
  const [isExportingPackage, setIsExportingPackage] = useState(false);

  const hasMarkdown = !!(proposalMarkdown || "").trim();

  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const buildMarkdown = () =>
    buildProposalMarkdownWithDiagrams({
      title: contactName ? `Proposal - ${contactName}` : "Proposal",
      proposalMarkdown: proposalMarkdown || "",
      diagrams,
    });

  const handleDownloadMarkdown = () => {
    if (!hasMarkdown) {
      toast({
        title: "Nothing to export",
        description: "Generate a proposal first.",
        variant: "destructive",
      });
      return;
    }

    const md = buildMarkdown();
    const filename = safeFilename(
      contactName ? `proposal-${contactName}.md` : "proposal.md"
    );

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Downloaded", description: "Saved full proposal as Markdown." });
  };

  const handleExportPackage = async () => {
    if (!hasMarkdown) {
      toast({
        title: "Nothing to export",
        description: "Generate a proposal first.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingPackage(true);

    try {
      const zip = new JSZip();
      const md = buildMarkdown();
      const baseName = contactName ? `proposal-${safeFilename(contactName)}` : "proposal";

      // Add markdown file
      zip.file(`${baseName}.md`, md);

      // Extract SVGs from rendered Mermaid diagrams in the DOM
      const svgElements = document.querySelectorAll('[data-diagram-id] svg');
      svgElements.forEach((svg, index) => {
        const diagramId = svg.closest('[data-diagram-id]')?.getAttribute('data-diagram-id') || `diagram-${index + 1}`;
        const svgString = new XMLSerializer().serializeToString(svg);
        const svgWithXmlns = svgString.includes('xmlns') 
          ? svgString 
          : svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        zip.file(`diagrams/${safeFilename(diagramId)}.svg`, svgWithXmlns);
      });

      // If no DOM SVGs found, try to render from diagram data
      if (svgElements.length === 0 && diagrams && diagrams.length > 0) {
        const mermaid = await import("mermaid");
        mermaid.default.initialize({ startOnLoad: false, theme: "default" });

        for (let i = 0; i < diagrams.length; i++) {
          const diagram = diagrams[i];
          if (diagram.format === 'mermaid' && diagram.content) {
            try {
              const { svg } = await mermaid.default.render(`export-diagram-${i}`, diagram.content);
              const filename = safeFilename(diagram.title || `diagram-${i + 1}`);
              zip.file(`diagrams/${filename}.svg`, svg);
            } catch (err) {
              console.warn(`Failed to render diagram ${i}:`, err);
            }
          }
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Package Exported",
        description: "Downloaded ZIP with Markdown + SVG diagrams.",
      });
    } catch (error) {
      console.error("Export package error:", error);
      toast({
        title: "Export Failed",
        description: "Could not create the package. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPackage(false);
    }
  };

  const handleEmailMarkdown = async () => {
    if (!contactId) {
      toast({
        title: "Missing client",
        description: "Select a client to email this proposal.",
        variant: "destructive",
      });
      return;
    }
    if (!hasMarkdown) {
      toast({
        title: "Nothing to send",
        description: "Generate a proposal first.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMarkdown(true);
    try {
      const { contact } = await getContact(contactId);
      const email = (contact.email || "").trim();
      if (!email) {
        toast({
          title: "No email address",
          description: "This contact does not have an email on file.",
          variant: "destructive",
        });
        return;
      }

      const md = buildMarkdown();
      const subject = contactName
        ? `Proposal (Markdown) - ${contactName}`
        : "Proposal (Markdown)";

      const html = `
        <p>Hi${contactName ? ` ${escapeHtml(contactName)}` : ""},</p>
        <p>Below is your full proposal in <strong>Markdown</strong> (including the Mermaid diagram blocks).</p>
        <p style="margin:0 0 8px 0; color:#666; font-size:12px;">Tip: copy into a Markdown viewer that supports Mermaid to render the diagrams.</p>
        <pre style="white-space:pre-wrap; word-wrap:break-word; padding:12px; background:#0b0b0b; color:#e5e7eb; border-radius:8px; border:1px solid #222;">${escapeHtml(md)}</pre>
      `;

      const result = await sendEmail({ to: email, subject, html });
      if (!result.success) {
        throw new Error(result.error || "Failed to send");
      }

      toast({
        title: "Sent",
        description: `Markdown proposal emailed to ${email}`,
        duration: 5000,
      });

      onSendComplete?.();
    } catch (error) {
      console.error("Email markdown error:", error);
      toast({
        title: "Error",
        description: "Failed to email Markdown proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMarkdown(false);
    }
  };

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

    const printUrl = `https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api/content/view/${proposalId}?print=true`;
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
          headers: { 'Content-Type': 'application/json' },
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
        onSendComplete?.();
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
      <div className="absolute inset-0 rounded-sm bg-gradient-to-r from-emerald-500/20 via-primary/20 to-emerald-500/20 blur-sm" />
      
      <div className="relative bg-zinc-950/80 backdrop-blur-md border border-emerald-500/30 rounded-sm p-4 space-y-4">
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
              <p className="text-sm text-zinc-300 mt-0.5">{contactName}</p>
            )}
          </div>
        </div>
        
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

          <Button
            onClick={handleExportPackage}
            variant="outline"
            size="sm"
            className="gap-2 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10"
            disabled={isExportingPackage || !hasMarkdown}
          >
            {isExportingPackage ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Package className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            Export Package
          </Button>

          <Button
            onClick={handleDownloadMarkdown}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!hasMarkdown}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Download Markdown
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

          {contactId && (
            <Button
              onClick={handleEmailMarkdown}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isSendingMarkdown || !hasMarkdown}
            >
              {isSendingMarkdown ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              Email Markdown
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

        <p className="text-xs text-zinc-500 font-mono">
          Export Package downloads a ZIP with Markdown + SVG diagrams.
        </p>
      </div>
    </motion.div>
  );
}