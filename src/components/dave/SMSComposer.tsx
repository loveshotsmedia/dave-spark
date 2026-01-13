import { useState, useEffect } from "react";
import { MessageSquare, Search, Send, Loader2, User, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { searchContacts, sendSMS, Contact } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SMSComposerProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContact?: Contact;
}

const MAX_SMS_LENGTH = 160;
const MAX_SEGMENTS = 10;

export function SMSComposer({ isOpen, onClose, preselectedContact }: SMSComposerProps) {
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(preselectedContact || null);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [manualPhone, setManualPhone] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedContact(preselectedContact || null);
      setContactSearch("");
      setContacts([]);
      setMessage("");
      setManualPhone("");
    }
  }, [isOpen, preselectedContact]);

  // Search contacts
  useEffect(() => {
    if (!contactSearch.trim()) {
      setContacts([]);
      return;
    }
    const debounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchContacts(contactSearch);
        setContacts(result.contacts || []);
      } catch (err) {
        console.error("Failed to search contacts:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [contactSearch]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactSearch("");
    setContacts([]);
  };

  const handleSend = async () => {
    const phoneNumber = selectedContact?.phone || manualPhone.trim();
    
    if (!phoneNumber) {
      toast({
        title: "No phone number",
        description: "Please select a contact with a phone number or enter one manually",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendSMS({
        to: phoneNumber,
        message: message.trim(),
        contactId: selectedContact?.id,
      });

      if (result.success) {
        toast({
          title: "SMS sent!",
          description: `Message sent to ${selectedContact?.full_name || phoneNumber}`,
        });
        onClose();
      } else {
        throw new Error(result.error || "Failed to send SMS");
      }
    } catch (err) {
      console.error("Send SMS failed:", err);
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const segments = Math.ceil(message.length / MAX_SMS_LENGTH);
  const isOverLimit = segments > MAX_SEGMENTS;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send SMS
          </DialogTitle>
          <DialogDescription>
            Send a text message to a contact or phone number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Selection */}
          {selectedContact ? (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedContact.full_name}</p>
                      {selectedContact.phone ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedContact.phone}
                        </p>
                      ) : (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          No phone number
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedContact(null)}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Search Contact</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {contacts.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border bg-popover">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                        onClick={() => handleSelectContact(contact)}
                      >
                        <span className="font-medium">{contact.full_name}</span>
                        {contact.phone ? (
                          <span className="text-sm text-muted-foreground">{contact.phone}</span>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No phone
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualPhone">Enter Phone Number</Label>
                <Input
                  id="manualPhone"
                  placeholder="+1 204 555 1234"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <span className={cn("text-xs", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
                {message.length} chars ({segments} segment{segments !== 1 ? "s" : ""})
              </span>
            </div>
            <Textarea
              id="message"
              placeholder="Type your message..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={cn(isOverLimit && "border-destructive")}
            />
            {isOverLimit && (
              <p className="text-xs text-destructive">Message too long. Maximum {MAX_SEGMENTS} segments ({MAX_SEGMENTS * MAX_SMS_LENGTH} characters).</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isOverLimit || (!selectedContact?.phone && !manualPhone.trim())}
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
