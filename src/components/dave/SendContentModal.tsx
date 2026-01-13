import { useState, useEffect } from "react";
import { Send, Search, Loader2, Video, FileText, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { listContent, sendContentSMS, Contact, ContentItem } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface SendContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
};

export function SendContentModal({ isOpen, onClose, contact }: SendContentModalProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch content on open
  useEffect(() => {
    if (!isOpen) return;

    async function fetchContent() {
      setIsLoading(true);
      try {
        const result = await listContent({ limit: 50 });
        setContent(result.content || []);
      } catch (error) {
        console.error("Failed to load content:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
    setSelectedContent(null);
    setMessage("");
  }, [isOpen]);

  const filteredContent = content.filter((item) =>
    searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleSend = async () => {
    if (!selectedContent || !contact) return;

    if (!contact.phone) {
      toast({
        title: "No phone number",
        description: "This contact doesn't have a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendContentSMS({
        contactId: contact.id,
        contentId: selectedContent.id,
        message: message || undefined,
      });

      if (result.success) {
        toast({
          title: "Content sent!",
          description: `"${selectedContent.title}" sent to ${contact.full_name}`,
        });
        onClose();
      } else {
        throw new Error(result.error || "Failed to send content");
      }
    } catch (error) {
      console.error("Send failed:", error);
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Failed to send content",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Content
          </DialogTitle>
          <DialogDescription>
            {contact ? (
              <span className="flex items-center gap-2">
                Send content to
                <span className="font-medium text-foreground">{contact.full_name}</span>
              </span>
            ) : (
              "Select content to send"
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Contact Info */}
        {contact && (
          <Card className="bg-muted/50 shrink-0">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{contact.full_name}</p>
                  <p className="text-sm text-muted-foreground">{contact.phone || "No phone"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {!selectedContent ? (
            <>
              {/* Search */}
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredContent.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No content found</p>
                  </div>
                ) : (
                  filteredContent.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedContent(item)}
                      className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {CONTENT_TYPE_ICONS[item.content_type] || (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.content_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Selected Content */}
              <Card className="bg-primary/5 border-primary/20 shrink-0">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{selectedContent.title}</p>
                      {selectedContent.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {selectedContent.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContent(null)}
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Custom Message (optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! I thought you might find this interesting..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedContent || !contact?.phone || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
