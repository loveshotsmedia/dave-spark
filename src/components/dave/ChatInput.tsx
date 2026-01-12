import { useState, useRef, useEffect } from "react";
import { ArrowUp, FileText, Database, Calendar, Radio, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if ((input.trim() || attachedFiles.length > 0) && !isLoading) {
      onSend(input.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
      setInput("");
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...files]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
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
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm"
              >
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[150px] truncate text-foreground">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

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
            disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-lg"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp"
        />

        <div className="flex flex-wrap gap-2">
          <QuickActionButton
            icon={<Paperclip className="h-4 w-4" />}
            label="Attach"
            onClick={handleAttachClick}
          />
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