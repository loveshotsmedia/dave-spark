import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage as ChatMessageType } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import { TypingIndicator } from "./TypingIndicator";
import { ContactCard } from "./ContactCard";
import { Contact } from "@/lib/api";
import { GaarWarningBadge, useGaarCheck } from "./GaarWarningBadge";

interface ChatMessageProps {
  message: ChatMessageType;
  onGenerateProposal?: (contactId: string) => void;
}

export function ChatMessage({ message, onGenerateProposal }: ChatMessageProps) {
  const isUser = message.role === "user";
  
  // Check for GAAR-related content in assistant messages
  const { showWarning, level } = useGaarCheck(!isUser ? message.content : "");

  // Try to parse embedded contact data from the message
  const parseEmbeddedContacts = (content: string): Contact[] => {
    // Simple pattern matching - in production this would be more sophisticated
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);
        if (Array.isArray(data)) return data;
        if (data.contacts) return data.contacts;
      }
    } catch {
      // Not JSON, that's fine
    }
    return [];
  };

  const embeddedContacts = !isUser ? parseEmbeddedContacts(message.content) : [];
  const cleanContent = message.content.replace(/```json\n[\s\S]*?\n```/g, "").trim();

  return (
    <div
      className={`flex gap-4 animate-message-in ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            2.0
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`flex-1 space-y-3 ${isUser ? "flex flex-col items-end" : ""}`}
      >
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground max-w-[80%]"
              : "bg-card border max-w-full"
          }`}
        >
          {message.isLoading ? (
            <TypingIndicator 
              extractionProgress={message.extractionProgress}
              loadingPhase={message.loadingPhase}
              workingMessage={message.workingMessage}
              typedContent={message.typedContent}
              fullContent={message.content}
            />
          ) : (
            <div
              className={`prose max-w-none ${isUser ? "prose-invert" : "dark:prose-invert"}`}
              style={{
                lineHeight: '1.7',
              }}
            >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mb-3 mt-4">{children}</h3>,
                    ul: ({ children }) => <ul className="mb-4 ml-4 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-4 ml-4 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 my-4 italic">{children}</blockquote>,
                    code: ({ children, inline }: any) =>
                      inline
                        ? <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
                        : <code className="block bg-muted p-4 rounded my-4 overflow-x-auto">{children}</code>,
                    hr: () => <hr className="my-6 border-border" />,
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted/50 border-b border-border">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
                    th: ({ children }) => <th className="px-4 py-3 text-left font-semibold text-foreground">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-3 text-muted-foreground">{children}</td>,
                  }}
                >
                  {cleanContent}
                </ReactMarkdown>
            </div>
          )}
        </div>

        {/* GAAR Warning Badge */}
        {!isUser && showWarning && !message.isLoading && (
          <GaarWarningBadge 
            level={level} 
            message="This response mentions tax planning strategies that may be subject to GAAR review."
            details={[
              "Consult with a tax professional before proceeding",
              "Document the business purpose clearly",
              "Ensure compliance with CRA guidelines"
            ]}
          />
        )}

        {/* Embedded contact cards */}
        {embeddedContacts.length > 0 && (
          <div className="space-y-2 max-w-lg">
            {embeddedContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onGenerateProposal={onGenerateProposal}
              />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
            DW
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}