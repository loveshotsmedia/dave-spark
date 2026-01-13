import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, FileText, Database, Calendar, Radio, Paperclip, X, Upload, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading: boolean;
  onProposalClick: () => void;
  onQueryClick: () => void;
  onCalendarClick: () => void;
  onChannelsClick: () => void;
  onContentLibraryClick: () => void;
}

export function ChatInput({
  onSend,
  isLoading,
  onProposalClick,
  onQueryClick,
  onCalendarClick,
  onChannelsClick,
  onContentLibraryClick,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const addFiles = useCallback((files: File[]) => {
    const validFiles = files.filter((file) => {
      const validTypes = [
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt",
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
      ];
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      return validTypes.includes(extension);
    });
    
    if (validFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...validFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
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

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles]);

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
      <div 
        ref={dropZoneRef}
        className="mx-auto max-w-3xl space-y-3"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-primary">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="h-8 w-8 animate-bounce" />
              <span className="text-sm font-medium">Drop files here</span>
            </div>
          </div>
        )}

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
            placeholder="Message Dave 2.0... (drag & drop files here)"
            className={cn(
              "min-h-[52px] resize-none pr-14 rounded-2xl border-border bg-background transition-all",
              isDragging && "border-primary ring-2 ring-primary/20"
            )}
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
          <QuickActionButton
            icon={<Library className="h-4 w-4" />}
            label="Content"
            onClick={onContentLibraryClick}
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