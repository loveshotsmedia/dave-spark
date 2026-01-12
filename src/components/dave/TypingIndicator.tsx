import { FileText, Upload, Loader2 } from "lucide-react";
import type { ExtractionProgress } from "@/lib/api";

interface TypingIndicatorProps {
  extractionProgress?: ExtractionProgress;
}

export function TypingIndicator({ extractionProgress }: TypingIndicatorProps) {
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

  // Default typing indicator
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
    </div>
  );
}