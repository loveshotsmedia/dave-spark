import { useRef, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { ContentLibrary } from "@/components/dave/ContentLibrary";
import { CalculatorsPanel } from "@/components/dave/CalculatorsPanel";
import { GAARAnalysisPanel } from "@/components/dave/GAARAnalysisPanel";
import { SMSComposer } from "@/components/dave/SMSComposer";
import { EmailComposer } from "@/components/dave/EmailComposer";
import { PreCallModal } from "@/components/dave/PreCallModal";
import { DocumentCallModal } from "@/components/dave/DocumentCallModal";
import { VoiceCallPanel } from "@/components/dave/VoiceCallPanel";
import { DiagramRenderer } from "@/components/dave/DiagramRenderer";
import { Contact, type DiagramData } from "@/lib/api";
import { Loader2, BarChart3 } from "lucide-react";

export default function Chat() {
  const { isAuthenticated, isLoading: authLoading, onboardingComplete, signOut } = useAuth();
  const { messages, isLoading, sendMessage } = useChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Panel states
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isQueryOpen, setIsQueryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContentLibraryOpen, setIsContentLibraryOpen] = useState(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState(false);
  const [isGAAROpen, setIsGAAROpen] = useState(false);
  const [isSMSOpen, setIsSMSOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);

  // Modal states
  const [preCallContact, setPreCallContact] = useState<{ id: string; name: string } | null>(null);
  const [documentCallContact, setDocumentCallContact] = useState<{ id: string; name: string } | null>(null);

  // Selected contact for proposal
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();
  
  // Generated diagrams for display
  const [proposalDiagrams, setProposalDiagrams] = useState<DiagramData[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/auth");
      } else if (onboardingComplete === false) {
        navigate("/onboarding");
      }
    }
  }, [isAuthenticated, authLoading, onboardingComplete, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle pre-filled message from URL query parameter
  const prefillHandledRef = useRef(false);
  useEffect(() => {
    const prefillMessage = searchParams.get("message");
    if (prefillMessage && !authLoading && isAuthenticated && !prefillHandledRef.current) {
      prefillHandledRef.current = true;
      sendMessage(prefillMessage);
      // Clear the query parameter
      setSearchParams({});
    }
  }, [searchParams, authLoading, isAuthenticated, sendMessage, setSearchParams]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleGenerateProposal = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsProposalOpen(true);
  };

  const handleProposalGenerated = (proposal: string, contactName: string, diagrams?: DiagramData[]) => {
    sendMessage(`Generated proposal for ${contactName}:\n\n${proposal}`, undefined);
    if (diagrams && diagrams.length > 0) {
      setProposalDiagrams(diagrams);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    sendMessage(`Tell me about ${contact.full_name}`);
  };

  const handleAnticipatorAction = (action: string) => {
    sendMessage(action);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          
          {/* Proposal Diagrams Section */}
          {proposalDiagrams.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Visual Illustrations</span>
                <button 
                  onClick={() => setProposalDiagrams([])}
                  className="ml-auto text-xs hover:text-foreground"
                >
                  Clear diagrams
                </button>
              </div>
              {proposalDiagrams.map((diagram, index) => (
                <DiagramRenderer key={index} diagram={diagram} />
              ))}
            </div>
          )}
          
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
        onContentLibraryClick={() => setIsContentLibraryOpen(true)}
        onCalculatorsClick={() => setIsCalculatorsOpen(true)}
        onGAARClick={() => setIsGAAROpen(true)}
        onSMSClick={() => setIsSMSOpen(true)}
        onEmailClick={() => setIsEmailOpen(true)}
        onVoiceCallClick={() => setIsVoiceCallOpen(true)}
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

      <ContentLibrary
        isOpen={isContentLibraryOpen}
        onClose={() => setIsContentLibraryOpen(false)}
      />

      <CalculatorsPanel
        isOpen={isCalculatorsOpen}
        onClose={() => setIsCalculatorsOpen(false)}
      />

      <GAARAnalysisPanel
        isOpen={isGAAROpen}
        onClose={() => setIsGAAROpen(false)}
      />

      <SMSComposer
        isOpen={isSMSOpen}
        onClose={() => setIsSMSOpen(false)}
      />

      <EmailComposer
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
      />

      <VoiceCallPanel
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
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