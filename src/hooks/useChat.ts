import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage as APIChatMessage, chat, ExtractionProgress } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = 'dave-conversations';
const CHAT_STORAGE_KEY = 'dave-current-chat';
const MAX_CONVERSATIONS = 20;

// Save current chat to localStorage
const saveToStorage = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save chat:', e);
  }
};

// Load current chat from localStorage
const loadFromStorage = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: ChatMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    }
  } catch (e) {
    console.error('Failed to load chat:', e);
  }
  return [];
};

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

export interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

const WORKING_MESSAGES = [
  "Dave is thinking...",
  "Analyzing your request...",
  "Gathering relevant information...",
  "Running calculations...",
  "Formulating response...",
  "Almost there..."
];

// Strip any working message artifacts and streaming JSON from the final response
function cleanStreamingArtifacts(response: string): string {
  let cleaned = response;
  
  // Remove any working messages that might have been prepended
  for (const msg of WORKING_MESSAGES) {
    // Remove exact matches at the start (with or without trailing whitespace/newlines)
    const patterns = [
      new RegExp(`^${escapeRegex(msg)}\\s*`, 'i'),
      new RegExp(`^${escapeRegex(msg.replace('...', ''))}\\.\\.\\.*\\s*`, 'i'),
    ];
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
  }
  
  // Remove streaming control JSON objects like {"type":"done","fullResponse":"..."}
  // These appear at the end of streamed responses
  cleaned = cleaned.replace(/\{"type"\s*:\s*"done"\s*,\s*"fullResponse"\s*:\s*"[^"]*"\s*\}\s*$/s, '');
  cleaned = cleaned.replace(/\{"type"\s*:\s*"done"[^}]*\}\s*$/s, '');
  
  return cleaned.trim();
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadFromStorage();
    if (saved.length > 0) {
      return saved;
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: "Good morning, Dave. How can I help you today?",
        timestamp: new Date(),
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');
  const [workingMessageIndex, setWorkingMessageIndex] = useState(0);
  const [conversationId, setConversationId] = useState<string>(() => {
    return `conv-${Date.now()}`;
  });
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
        
        // Clean any working message artifacts from streamed content in real-time
        const cleanedContent = cleanStreamingArtifacts(streamedContentRef.current);
        
        // Update message with streamed content - clear workingMessage to prevent artifacts
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMessageId
              ? { 
                  ...m, 
                  loadingPhase: 'streaming',
                  isLoading: true,
                  workingMessage: undefined,
                  content: cleanedContent,
                  typedContent: cleanedContent 
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

      // Clean the response of any working message artifacts
      const cleanedResponse = cleanStreamingArtifacts(response.response);

      // Finalize the message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: cleanedResponse,
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

  const saveConversation = useCallback(() => {
    if (messages.length <= 1) return; // Don't save if only welcome message

    const savedConversations: SavedConversation[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    // Generate title from first user message
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
      : 'New Conversation';

    const conversation: SavedConversation = {
      id: conversationId,
      title,
      messages: messages.filter(m => m.id !== 'welcome'),
      lastUpdated: new Date(),
    };

    // Update or add conversation
    const existingIndex = savedConversations.findIndex(c => c.id === conversationId);
    if (existingIndex >= 0) {
      savedConversations[existingIndex] = conversation;
    } else {
      savedConversations.unshift(conversation);
    }

    // Keep only last MAX_CONVERSATIONS
    const trimmed = savedConversations.slice(0, MAX_CONVERSATIONS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }, [conversationId, messages]);

  const loadConversation = useCallback((convId: string) => {
    const savedConversations: SavedConversation[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    const conversation = savedConversations.find(c => c.id === convId);
    if (conversation) {
      setConversationId(convId);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Good morning, Dave. How can I help you today?",
          timestamp: new Date(),
        },
        ...conversation.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      ]);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setConversationId(`conv-${Date.now()}`);
    clearMessages();
  }, [clearMessages]);

  const getSavedConversations = useCallback((): SavedConversation[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }, []);

  // Auto-save after messages change
  useEffect(() => {
    if (messages.length > 1 && !isLoading) {
      saveConversation();
    }
  }, [messages, isLoading, saveConversation]);

  // Save current chat to localStorage on every message change
  useEffect(() => {
    saveToStorage(messages);
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    conversationId,
    loadConversation,
    startNewConversation,
    getSavedConversations,
  };
}
