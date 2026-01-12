import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { Header } from "@/components/dave/Header";
import { ChatMessage } from "@/components/dave/ChatMessage";
import { ChatInput } from "@/components/dave/ChatInput";
import { AnticipatoryActions } from "@/components/dave/AnticipatoryActions";
import { ProposalPanel } from "@/components/dave/ProposalPanel";
import { QueryPanel } from "@/components/dave/QueryPanel";
import { CalendarPanel } from "@/components/dave/CalendarPanel";
import { ChannelsPanel } from "@/components/dave/ChannelsPanel";
import { SettingsPanel } from "@/components/dave/SettingsPanel";
import { PreCallModal } from "@/components/dave/PreCallModal";
import { DocumentCallModal } from "@/components/dave/DocumentCallModal";
import { Contact } from "@/lib/api";

export default function Chat() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { messages, isLoading, sendMessage } = useChat();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Panel states
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isQueryOpen, setIsQueryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal states
  const [preCallContact, setPreCallContact] = useState<{ id: string; name: string } | null>(null);
  const [documentCallContact, setDocumentCallContact] = useState<{ id: string; name: string } | null>(null);

  // Selected contact for proposal
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleGenerateProposal = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsProposalOpen(true);
  };

  const handleProposalGenerated = (proposal: string, contactName: string) => {
    sendMessage(`Generated proposal for ${contactName}:\n\n${proposal}`);
  };

  const handleContactSelect = (contact: Contact) => {
    sendMessage(`Tell me about ${contact.name}`);
  };

  const handleAnticipatorAction = (action: string) => {
    sendMessage(action);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header onLogout={handleLogout} onSettingsClick={() => setIsSettingsOpen(true)} />

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onGenerateProposal={handleGenerateProposal}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Anticipatory Actions */}
      <AnticipatoryActions onActionSelect={handleAnticipatorAction} />

      {/* Input Area */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        onProposalClick={() => setIsProposalOpen(true)}
        onQueryClick={() => setIsQueryOpen(true)}
        onCalendarClick={() => setIsCalendarOpen(true)}
        onChannelsClick={() => setIsChannelsOpen(true)}
      />

      {/* Slide Panels */}
      <ProposalPanel
        isOpen={isProposalOpen}
        onClose={() => {
          setIsProposalOpen(false);
          setSelectedContactId(undefined);
        }}
        preselectedContactId={selectedContactId}
        onProposalGenerated={handleProposalGenerated}
      />

      <QueryPanel
        isOpen={isQueryOpen}
        onClose={() => setIsQueryOpen(false)}
        onContactSelect={handleContactSelect}
      />

      <CalendarPanel
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      <ChannelsPanel
        isOpen={isChannelsOpen}
        onClose={() => setIsChannelsOpen(false)}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
      />

      {/* Pre-Call Modal */}
      {preCallContact && (
        <PreCallModal
          contactId={preCallContact.id}
          contactName={preCallContact.name}
          isOpen={!!preCallContact}
          onClose={() => setPreCallContact(null)}
        />
      )}

      {/* Document Call Modal */}
      {documentCallContact && (
        <DocumentCallModal
          contactId={documentCallContact.id}
          contactName={documentCallContact.name}
          isOpen={!!documentCallContact}
          onClose={() => setDocumentCallContact(null)}
          onDocumented={() => {
            sendMessage(`Documented call with ${documentCallContact.name}`);
          }}
        />
      )}
    </div>
  );
}