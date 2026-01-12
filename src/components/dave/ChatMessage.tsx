import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage as ChatMessageType } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import { TypingIndicator } from "./TypingIndicator";
import { ContactCard } from "./ContactCard";
import { Contact } from "@/lib/api";

interface ChatMessageProps {
  message: ChatMessageType;
  onGenerateProposal?: (contactId: string) => void;
}

export function ChatMessage({ message, onGenerateProposal }: ChatMessageProps) {
  const isUser = message.role === "user";

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
        className={`flex-1 space-y-3 ${isUser ? "flex justify-end" : ""}`}
      >
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground max-w-[80%]"
              : "bg-card border max-w-full"
          }`}
        >
          {message.isLoading ? (
            <TypingIndicator />
          ) : (
            <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : ""}`}>
              <ReactMarkdown>{cleanContent}</ReactMarkdown>
            </div>
          )}
        </div>

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