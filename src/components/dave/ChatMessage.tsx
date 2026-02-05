import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage as ChatMessageType } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TypingIndicator } from "./TypingIndicator";
import { ContactCard } from "./ContactCard";
import { Contact } from "@/lib/api";
import { GaarWarningBadge, useGaarCheck } from "./GaarWarningBadge";
import { DiagramRenderer, type Diagram } from "./DiagramRenderer";
import { useMemo } from "react";
// Extract mermaid diagrams from markdown content
function extractMermaidDiagrams(content: string): { cleanContent: string; diagrams: Diagram[] } {
  const diagrams: Diagram[] = [];
  
  // Match mermaid code blocks: ```mermaid ... ``` 
  const mermaidBlockPattern = /```mermaid\n([\s\S]*?)```/g;
  
  let cleanContent = content;
  let diagramIndex = 0;
  
  // Extract ```mermaid``` code blocks only
  let match;
  while ((match = mermaidBlockPattern.exec(content)) !== null) {
    const diagramContent = (match[1] ?? '').trim();
    // Only add if content is non-empty and looks like valid mermaid
    if (diagramContent && /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey)/i.test(diagramContent)) {
      diagrams.push({
        type: 'flowchart',
        format: 'mermaid',
        content: diagramContent,
        title: `Diagram ${++diagramIndex}`
      });
    }
  }
  cleanContent = cleanContent.replace(mermaidBlockPattern, '\n\n');
  
  // Clean up multiple newlines
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();
  
  return { cleanContent, diagrams };
}

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
  const jsonCleanedContent = message.content.replace(/```json\n[\s\S]*?\n```/g, "").trim();
  
  // Extract and render mermaid diagrams
  const { cleanContent, diagrams: mermaidDiagrams } = useMemo(
    () => extractMermaidDiagrams(jsonCleanedContent),
    [jsonCleanedContent]
  );

  return (
    <div
      className={`flex gap-3 animate-message-in ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
          <span className="text-xs font-mono text-emerald-500">&gt;</span>
        </div>
      )}

      <div
        className={`flex-1 space-y-2 ${isUser ? "flex flex-col items-end" : ""}`}
      >
        <div
          className={`inline-block font-mono text-sm ${
            isUser
              ? "text-emerald-400 max-w-[80%]"
              : "text-zinc-300 max-w-full"
          }`}
        >
          {isUser && <span className="text-zinc-500 mr-2">&gt;</span>}
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
              className="prose prose-invert max-w-none prose-sm prose-zinc
                prose-headings:text-zinc-200 prose-headings:font-semibold prose-headings:tracking-tight
                prose-p:text-zinc-400 prose-p:leading-relaxed
                prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-zinc-200 prose-strong:font-semibold
                prose-code:text-emerald-400 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-xs
                prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-sm
                prose-li:text-zinc-400
                prose-blockquote:border-l-emerald-500 prose-blockquote:text-zinc-500
                prose-hr:border-zinc-800
              "
            >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                    h1: ({ children }) => <h1 className="text-base font-semibold mb-3 mt-4 text-zinc-200">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 mt-3 text-zinc-200">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-medium mb-2 mt-3 text-zinc-300">{children}</h3>,
                    ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed text-zinc-400">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-emerald-500/50 pl-3 my-3 text-zinc-500 italic">{children}</blockquote>,
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      const codeContent = String(children).replace(/\n$/, '');

                      // Render Mermaid diagrams
                      if (language === 'mermaid' && !inline) {
                        return (
                          <div className="my-3">
                            <DiagramRenderer
                              diagram={{
                                type: 'mermaid',
                                format: 'mermaid',
                                content: codeContent
                              }}
                            />
                          </div>
                        );
                      }

                      // Regular code blocks
                      if (!inline && match) {
                        return (
                          <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-sm overflow-x-auto my-3 text-xs">
                            <code className={`${className} text-emerald-400`} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      }

                      // Inline code
                      return <code className="bg-zinc-900 px-1 py-0.5 rounded-sm text-xs text-emerald-400" {...props}>{children}</code>;
                    },
                    hr: () => <hr className="my-4 border-zinc-800" />,
                    table: ({ children }) => (
                      <div className="my-3 overflow-x-auto rounded-sm border border-zinc-800">
                        <table className="w-full text-xs font-mono">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-zinc-900/50 border-b border-zinc-800">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-zinc-800">{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-zinc-900/30 transition-colors duration-200">{children}</tr>,
                    th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-zinc-400 uppercase tracking-wider text-xs">{children}</th>,
                    td: ({ children }) => <td className="px-3 py-2 text-zinc-300 tabular-nums">{children}</td>,
                  }}
                >
                  {cleanContent}
                </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Mermaid Diagrams */}
        {!isUser && mermaidDiagrams.length > 0 && !message.isLoading && (
          <div className="space-y-3 max-w-full">
            {mermaidDiagrams.map((diagram, index) => (
              <DiagramRenderer key={`diagram-${index}`} diagram={diagram} />
            ))}
          </div>
        )}

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
        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
          <span className="text-xs font-mono text-zinc-600">$</span>
        </div>
      )}
    </div>
  );
}