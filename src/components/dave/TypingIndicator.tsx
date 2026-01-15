import { FileText, Upload, Loader2, Brain, Sparkles } from "lucide-react";
import type { ExtractionProgress } from "@/lib/api";
import type { LoadingPhase } from "@/hooks/useChat";
import { Progress } from "@/components/ui/progress";

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
  fullContent
}: TypingIndicatorProps) {
  // Show streaming content (real-time response) - prioritize this over all other states
  if (loadingPhase === 'streaming' && typedContent) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <span>{typedContent}</span>
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
      </div>
    );
  }

  // If we have typed content but phase hasn't updated yet, still show it
  if (typedContent && typedContent.length > 0) {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <span>{typedContent}</span>
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
      </div>
    );
  }

  // Show extraction progress if available
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

  // Show thinking state
  if (loadingPhase === 'thinking') {
    return (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4 animate-pulse text-primary" />
          <span className="flex items-center">
            Dave is thinking
            <span className="inline-flex ml-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </span>
        </div>
      </div>
    );
  }

  // Show working state with rotating messages
  if (loadingPhase === 'working') {
    return (
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          <span className="transition-opacity duration-300">
            {workingMessage || "Dave is thinking..."}
          </span>
        </div>
        {/* Indeterminate progress bar */}
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 animate-progress rounded-full" />
        </div>
      </div>
    );
  }

  // Default typing indicator (3 dots)
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
    </div>
  );
}
