import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage as APIChatMessage, chat, ExtractionProgress } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export type LoadingPhase = 'idle' | 'thinking' | 'working' | 'streaming';

export interface ChatMessage extends APIChatMessage {
  id: string;
  timestamp: Date;
  isLoading?: boolean;
  loadingPhase?: LoadingPhase;
  workingMessage?: string;
  extractionProgress?: ExtractionProgress;
  typedContent?: string;
  embeddedData?: {
    type: "contacts" | "appointments" | "tasks" | "proposal";
    data: unknown;
  };
}

const WORKING_MESSAGES = [
  "Dave is thinking...",
  "Analyzing your request...",
  "Gathering relevant information...",
  "Running calculations...",
  "Formulating response...",
  "Almost there..."
];

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Good morning, Dave. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');
  const [workingMessageIndex, setWorkingMessageIndex] = useState(0);
  const loadingMessageIdRef = useRef<string | null>(null);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const workingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamedContentRef = useRef<string>('');

  // Update working message rotation
  useEffect(() => {
    if (loadingPhase === 'working') {
      workingIntervalRef.current = setInterval(() => {
        setWorkingMessageIndex((prev) => (prev + 1) % WORKING_MESSAGES.length);
      }, 3000);
      return () => {
        if (workingIntervalRef.current) {
          clearInterval(workingIntervalRef.current);
        }
      };
    }
  }, [loadingPhase]);

  // Update loading message with current phase and working message
  useEffect(() => {
    if (loadingMessageIdRef.current && loadingPhase !== 'streaming') {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMessageIdRef.current
            ? { 
                ...m, 
                loadingPhase, 
                workingMessage: WORKING_MESSAGES[workingMessageIndex] 
              }
            : m
        )
      );
    }
  }, [loadingPhase, workingMessageIndex]);

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    // Build user message content with file info if attached
    let displayContent = content;
    if (files && files.length > 0) {
      const fileNames = files.map(f => f.name).join(", ");
      displayContent = content 
        ? `${content}\n\n📎 Attached: ${fileNames}`
        : `📎 Attached: ${fileNames}`;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: displayContent,
      timestamp: new Date(),
    };

    const loadingMessageId = `loading-${Date.now()}`;
    const loadingMessage: ChatMessage = {
      id: loadingMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
      loadingPhase: 'thinking',
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);
    setLoadingPhase('thinking');
    loadingMessageIdRef.current = loadingMessageId;
    setWorkingMessageIndex(0);
    streamedContentRef.current = '';

    // Clear any existing timeouts
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
    }

    // Switch to "working" phase after 2 seconds if still waiting
    phaseTimeoutRef.current = setTimeout(() => {
      setLoadingPhase((current) => current === 'thinking' ? 'working' : current);
    }, 2000);

    try {
      // Progress callback to update loading message
      const onProgress = (progress: ExtractionProgress) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMessageId
              ? { ...m, extractionProgress: progress }
              : m
          )
        );
      };

      // Streaming callback - update message in real-time as content arrives
      const onStream = (chunk: string) => {
        // Clear phase timeout on first chunk
        if (phaseTimeoutRef.current) {
          clearTimeout(phaseTimeoutRef.current);
          phaseTimeoutRef.current = null;
        }
        
        // Clear working interval
        if (workingIntervalRef.current) {
          clearInterval(workingIntervalRef.current);
          workingIntervalRef.current = null;
        }

        // Switch to streaming phase
        setLoadingPhase('streaming');

        // Accumulate content
        streamedContentRef.current += chunk;
        
        // Update message with streamed content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMessageId
              ? { 
                  ...m, 
                  loadingPhase: 'streaming',
                  isLoading: true,
                  content: streamedContentRef.current,
                  typedContent: streamedContentRef.current 
                }
              : m
          )
        );
      };

      // Convert messages to API format (exclude loading messages and welcome)
      const apiMessages: APIChatMessage[] = messages
        .filter(m => !m.isLoading && m.id !== "welcome" && m.content.trim() !== "")
        .map(m => ({ role: m.role, content: m.content }));

      const response = await chat(content, files, onProgress, apiMessages, onStream);

      // Show toast if documents were uploaded to knowledge base
      if (response.documentsUploaded && response.documentsUploaded > 0) {
        toast({
          title: "Document added to knowledge base",
          description: `${response.documentsUploaded} document${response.documentsUploaded > 1 ? 's' : ''} uploaded. The chat can now reference this content.`,
        });
      }

      // Finalize the message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.filter((m) => m.id !== loadingMessageId).concat(assistantMessage)
      );

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.filter((m) => m.id !== loadingMessageId).concat(errorMessage)
      );
    } finally {
      setIsLoading(false);
      setLoadingPhase('idle');
      loadingMessageIdRef.current = null;
      streamedContentRef.current = '';
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
      if (workingIntervalRef.current) {
        clearInterval(workingIntervalRef.current);
      }
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Good morning, Dave. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
