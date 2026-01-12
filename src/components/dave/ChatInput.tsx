import { useState, useRef, useEffect } from "react";
import { ArrowUp, FileText, Database, Calendar, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onProposalClick: () => void;
  onQueryClick: () => void;
  onCalendarClick: () => void;
  onChannelsClick: () => void;
}

export function ChatInput({
  onSend,
  isLoading,
  onProposalClick,
  onQueryClick,
  onCalendarClick,
  onChannelsClick,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="border-t bg-card p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Dave 2.0..."
            className="min-h-[52px] resize-none pr-14 rounded-2xl border-border bg-background"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-lg"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <QuickActionButton
            icon={<FileText className="h-4 w-4" />}
            label="Proposal"
            onClick={onProposalClick}
          />
          <QuickActionButton
            icon={<Database className="h-4 w-4" />}
            label="Query"
            onClick={onQueryClick}
          />
          <QuickActionButton
            icon={<Calendar className="h-4 w-4" />}
            label="Calendar"
            onClick={onCalendarClick}
          />
          <QuickActionButton
            icon={<Radio className="h-4 w-4" />}
            label="Channels"
            onClick={onChannelsClick}
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-1.5 rounded-full border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {icon}
      {label}
    </Button>
  );
}