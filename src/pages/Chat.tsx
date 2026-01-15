import { useRef, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/effects/PageTransition";
import { useChat, SavedConversation } from "@/hooks/useChat";
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
import { ConversationSidebar } from "@/components/dave/ConversationSidebar";
import { Contact, type DiagramData } from "@/lib/api";
import { Loader2, BarChart3, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Chat() {
  const { isAuthenticated, isLoading: authLoading, onboardingComplete, signOut } = useAuth();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    conversationId, 
    loadConversation, 
    startNewConversation, 
    getSavedConversations,
    clearChatAndStorage 
  } = useChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Conversation sidebar state
  const [showConversations, setShowConversations] = useState(!isMobile);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);

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
  const [proposalDiagrams, setProposalDiagrams] = useState<DiagramData[]>();

  // Load conversations on mount and when messages change
  useEffect(() => {
    setSavedConversations(getSavedConversations());
  }, [getSavedConversations]);

  // Refresh conversations when messages change
  useEffect(() => {
    setSavedConversations(getSavedConversations());
  }, [messages, getSavedConversations]);

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

  const handleDeleteConversation = (id: string) => {
    const saved = JSON.parse(localStorage.getItem('dave-conversations') || '[]');
    const filtered = saved.filter((c: SavedConversation) => c.id !== id);
    localStorage.setItem('dave-conversations', JSON.stringify(filtered));
    setSavedConversations(filtered);

    // If deleting current conversation, start new one
    if (id === conversationId) {
      startNewConversation();
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition className="flex h-screen flex-col bg-black">
      <Header onLogout={handleLogout} onSettingsClick={() => setIsSettingsOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation Sidebar - Desktop */}
        {showConversations && !isMobile && (
          <ConversationSidebar
            currentConversationId={conversationId}
            conversations={savedConversations}
            onLoadConversation={loadConversation}
            onNewConversation={startNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onClearChat={() => {
              clearChatAndStorage();
              setSavedConversations([]);
            }}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Toggle Sidebar Button */}
          <div className="border-b border-zinc-800 px-3 py-2 md:block hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConversations(!showConversations)}
              className="gap-2 text-zinc-400 hover:text-white"
            >
              {showConversations ? (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="text-xs">Hide History</span>
                </>
              ) : (
                <>
                  <PanelLeft className="h-4 w-4" />
                  <span className="text-xs">Show History</span>
                </>
              )}
            </Button>
          </div>

          {/* Messages Area */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-3xl px-4 py-4 space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onGenerateProposal={handleGenerateProposal}
                />
              ))}
              
              {/* Proposal Diagrams Section */}
              {proposalDiagrams && proposalDiagrams.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wider">
                    <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>Diagrams</span>
                    <button 
                      onClick={() => setProposalDiagrams([])}
                      className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
                    >
                      Clear
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
      </div>
    </PageTransition>
  );
}