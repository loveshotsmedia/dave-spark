import { useState, useEffect } from "react";
import { Mail, Search, Send, Loader2, User, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { searchContacts, sendEmail, Contact } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContact?: Contact;
  initialSubject?: string;
  initialBody?: string;
}

export function EmailComposer({
  isOpen,
  onClose,
  preselectedContact,
  initialSubject = "",
  initialBody = "",
}: EmailComposerProps) {
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(preselectedContact || null);
  const [isSearching, setIsSearching] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedContact(preselectedContact || null);
      setContactSearch("");
      setContacts([]);
      setSubject(initialSubject);
      setBody(initialBody);
      setManualEmail("");
    }
  }, [isOpen, preselectedContact, initialSubject, initialBody]);

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
    const emailAddress = selectedContact?.email || manualEmail.trim();

    if (!emailAddress) {
      toast({
        title: "No email address",
        description: "Please select a contact with an email or enter one manually",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Missing subject",
        description: "Please enter a subject line",
        variant: "destructive",
      });
      return;
    }

    if (!body.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message body",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Convert plain text to simple HTML
      const htmlBody = body
        .split("\n\n")
        .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      const result = await sendEmail({
        to: emailAddress,
        subject: subject.trim(),
        html: htmlBody,
      });

      if (result.success) {
        toast({
          title: "Email sent!",
          description: `Email sent to ${selectedContact?.full_name || emailAddress}`,
        });
        onClose();
      } else {
        throw new Error(result.error || "Failed to send email");
      }
    } catch (err) {
      console.error("Send email failed:", err);
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Send an email to a contact or email address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient Selection */}
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
                      {selectedContact.email ? (
                        <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                      ) : (
                        <p className="text-sm text-destructive">No email address</p>
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
                <Label>To (Search Contact)</Label>
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
                        {contact.email && (
                          <span className="text-sm text-muted-foreground">{contact.email}</span>
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
                <Label htmlFor="manualEmail">Enter Email Address</Label>
                <Input
                  id="manualEmail"
                  type="email"
                  placeholder="client@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Type your email message..."
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || (!selectedContact?.email && !manualEmail.trim())}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
