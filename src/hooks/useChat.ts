import { useState, useCallback } from "react";
import { Message, chat } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
  isLoading?: boolean;
  embeddedData?: {
    type: "contacts" | "appointments" | "tasks" | "proposal";
    data: unknown;
  };
}

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

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const response = await chat(content, files);

      // Show toast if documents were uploaded to knowledge base
      if (response.documentsUploaded && response.documentsUploaded > 0) {
        toast({
          title: "Document added to knowledge base",
          description: `${response.documentsUploaded} document${response.documentsUploaded > 1 ? 's' : ''} uploaded. The chat can now reference this content.`,
        });
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.filter((m) => !m.isLoading).concat(assistantMessage)
      );
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.filter((m) => !m.isLoading).concat(errorMessage)
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

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