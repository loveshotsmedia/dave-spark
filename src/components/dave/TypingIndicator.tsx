import { FileText, Upload, Loader2, Brain, Sparkles } from "lucide-react";
import type { ExtractionProgress } from "@/lib/api";
import type { LoadingPhase } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";

interface TypingIndicatorProps {
  extractionProgress?: ExtractionProgress;
  loadingPhase?: LoadingPhase;
  workingMessage?: string;
  typedContent?: string;
  fullContent?: string;
}

export function TypingIndicator({ 
  extractionProgress, 
  loadingPhase = 'idle',
  workingMessage,
  typedContent,
}: TypingIndicatorProps) {
  // PRIORITY 1: Show streaming content (real-time response) - this takes precedence over everything
  if (typedContent && typedContent.length > 0) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          components={{
            p: ({ children }) => <span className="inline">{children}</span>,
          }}
        >
          {typedContent}
        </ReactMarkdown>
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  // PRIORITY 2: Show extraction progress if available
  if (extractionProgress && extractionProgress.stage !== 'complete') {
    const { stage, fileName, currentPage, totalPages, fileIndex, totalFiles } = extractionProgress;
    
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        {stage === 'extracting' ? (
          <>
            <FileText className="h-4 w-4 animate-pulse text-primary" />
            <span>
              Extracting text from <span className="font-medium text-foreground">{fileName}</span>
              {totalPages && totalPages > 0 && (
                <span className="ml-1">
                  (page {currentPage}/{totalPages})
                </span>
              )}
              {totalFiles > 1 && (
                <span className="ml-1 text-xs">
                  • File {fileIndex}/{totalFiles}
                </span>
              )}
            </span>
            <Loader2 className="h-3 w-3 animate-spin" />
          </>
        ) : stage === 'uploading' ? (
          <>
            <Upload className="h-4 w-4 animate-pulse text-primary" />
            <span>
              Adding <span className="font-medium text-foreground">{fileName}</span> to knowledge base...
            </span>
            <Loader2 className="h-3 w-3 animate-spin" />
          </>
        ) : null}
      </div>
    );
  }

  // PRIORITY 3: Show thinking state (initial wait)
  if (loadingPhase === 'thinking') {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
        <Brain className="h-4 w-4 animate-pulse text-primary" />
        <span className="flex items-center">
          Thinking
          <span className="inline-flex ml-1">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </span>
      </div>
    );
  }

  // PRIORITY 4: Show working state (longer wait, rotating messages)
  if (loadingPhase === 'working') {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 animate-pulse text-primary" />
        <span className="transition-opacity duration-300">
          {workingMessage || "Processing..."}
        </span>
        <Loader2 className="h-3 w-3 animate-spin ml-1" />
      </div>
    );
  }

  // Default: streaming phase without content yet, or idle - show simple indicator
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
    </div>
  );
}
