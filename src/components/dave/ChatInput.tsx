import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, FileText, Database, Calendar, Paperclip, X, Upload, Library, Calculator, Shield, MessageSquare, Mail, Mic, MicOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading: boolean;
  onProposalClick: () => void;
  onQueryClick: () => void;
  onCalendarClick: () => void;
  onChannelsClick: () => void;
  onContentLibraryClick: () => void;
  onCalculatorsClick: () => void;
  onGAARClick: () => void;
  onSMSClick: () => void;
  onEmailClick: () => void;
  onVoiceCallClick: () => void;
}

export function ChatInput({
  onSend,
  isLoading,
  onProposalClick,
  onQueryClick,
  onCalendarClick,
  onChannelsClick,
  onContentLibraryClick,
  onCalculatorsClick,
  onGAARClick,
  onSMSClick,
  onEmailClick,
  onVoiceCallClick,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Voice input hook
  const {
    isListening,
    interimTranscript,
    isSupported: voiceSupported,
    toggleListening,
  } = useVoiceInput({
    onTranscript: (text) => {
      setInput((prev) => prev + text);
    },
    onError: (error) => {
      toast({
        title: "Voice input error",
        description: error,
        variant: "destructive",
      });
    },
  });

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
    <div className="border-t border-zinc-800 bg-black p-4">
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-sm border border-dashed border-emerald-500/50">
            <div className="flex flex-col items-center gap-2 text-emerald-500">
              <Upload className="h-6 w-6" />
              <span className="text-xs font-mono uppercase tracking-wider">Drop files</span>
            </div>
          </div>
        )}

        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-sm border border-zinc-800 bg-zinc-900/50 px-2 py-1 text-xs font-mono"
              >
                <Paperclip className="h-3 w-3 text-zinc-500" />
                <span className="max-w-[120px] truncate text-zinc-400">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-zinc-600 hover:text-red-500 transition-colors duration-200"
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
            value={isListening ? input + interimTranscript : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "> Enter command..."}
            className={cn(
              "min-h-[44px] resize-none pr-20 rounded-sm border-none bg-zinc-900 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-all duration-200",
              isDragging && "ring-1 ring-emerald-500/50",
              isListening && "ring-1 ring-red-500/50"
            )}
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {voiceSupported && (
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                disabled={isLoading}
                className={cn(
                  "h-7 w-7 rounded-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
                  isListening && "text-red-500 hover:text-red-400"
                )}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? (
                  <MicOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </Button>
            )}
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              className="h-7 w-7 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
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

        <div className="flex flex-wrap gap-1">
          <QuickActionButton
            icon={<Paperclip className="h-3 w-3" strokeWidth={1.5} />}
            label="Attach"
            onClick={handleAttachClick}
          />
          <QuickActionButton
            icon={<Phone className="h-3 w-3" strokeWidth={1.5} />}
            label="Calls"
            onClick={onVoiceCallClick}
          />
          <QuickActionButton
            icon={<FileText className="h-3 w-3" strokeWidth={1.5} />}
            label="Proposal"
            onClick={onProposalClick}
          />
          <QuickActionButton
            icon={<Calculator className="h-3 w-3" strokeWidth={1.5} />}
            label="Calc"
            onClick={onCalculatorsClick}
          />
          <QuickActionButton
            icon={<Shield className="h-3 w-3" strokeWidth={1.5} />}
            label="GAAR"
            onClick={onGAARClick}
          />
          <QuickActionButton
            icon={<Database className="h-3 w-3" strokeWidth={1.5} />}
            label="Query"
            onClick={onQueryClick}
          />
          <QuickActionButton
            icon={<Calendar className="h-3 w-3" strokeWidth={1.5} />}
            label="Cal"
            onClick={onCalendarClick}
          />
          <QuickActionButton
            icon={<MessageSquare className="h-3 w-3" strokeWidth={1.5} />}
            label="SMS"
            onClick={onSMSClick}
          />
          <QuickActionButton
            icon={<Mail className="h-3 w-3" strokeWidth={1.5} />}
            label="Email"
            onClick={onEmailClick}
          />
          <QuickActionButton
            icon={<Library className="h-3 w-3" strokeWidth={1.5} />}
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
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-1 h-7 px-2 rounded-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 text-xs font-mono uppercase tracking-wide transition-colors duration-200"
    >
      {icon}
      {label}
    </Button>
  );
}