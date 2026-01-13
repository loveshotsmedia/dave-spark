import { useState, useEffect } from "react";
import { Phone, PhoneCall, PhoneOff, Clock, User, Loader2, Search } from "lucide-react";
import { SlidePanel } from "./SlidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCallHistory, initiateCall, searchContacts, CallRecord, Contact } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface VoiceCallPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceCallPanel({ isOpen, onClose }: VoiceCallPanelProps) {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [callingContactId, setCallingContactId] = useState<string | null>(null);

  // Load call history when panel opens
  useEffect(() => {
    if (isOpen) {
      loadCallHistory();
    }
  }, [isOpen]);

  const loadCallHistory = async () => {
    setIsLoading(true);
    try {
      const result = await getCallHistory(undefined, 20);
      setCallHistory(result.calls || []);
    } catch (error) {
      console.error("Failed to load call history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setContacts([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchContacts(query);
      setContacts(result.contacts || []);
    } catch (error) {
      console.error("Failed to search contacts:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInitiateCall = async (contact: Contact) => {
    setCallingContactId(contact.id);
    try {
      const result = await initiateCall(contact.id);
      if (result.success) {
        toast({
          title: "Call initiated",
          description: `Calling ${contact.full_name}...`,
        });
        // Refresh call history
        setTimeout(loadCallHistory, 2000);
      } else {
        toast({
          title: "Call failed",
          description: result.error || "Could not initiate call",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Call failed",
        description: "Could not initiate call",
        variant: "destructive",
      });
    } finally {
      setCallingContactId(null);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    if (diffHours < 48) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/20 text-success";
      case "in-progress":
        return "bg-warning/20 text-warning";
      case "failed":
      case "no-answer":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Voice Calls">
      <Tabs defaultValue="dial" className="h-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="dial">Make a Call</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
        </TabsList>

        <TabsContent value="dial" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts to call..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <Card key={contact.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.full_name}</p>
                          {contact.phone && (
                            <p className="text-sm text-muted-foreground">{contact.phone}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleInitiateCall(contact)}
                        disabled={callingContactId === contact.id || !contact.phone}
                        className="gap-2"
                      >
                        {callingContactId === contact.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PhoneCall className="h-4 w-4" />
                        )}
                        Call
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contacts found
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Search for a contact to initiate a call</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Button variant="outline" size="sm" onClick={loadCallHistory} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : callHistory.length > 0 ? (
              <div className="space-y-2">
                {callHistory.map((call) => (
                  <Card key={call.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {call.direction === "outbound" ? (
                            <PhoneCall className="h-4 w-4 text-primary" />
                          ) : (
                            <Phone className="h-4 w-4 text-success" />
                          )}
                          <span className="font-medium">
                            {call.contacts?.full_name || "Unknown"}
                          </span>
                        </div>
                        <Badge className={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(call.created_at)}
                        </span>
                        {call.duration_seconds && (
                          <span>{formatDuration(call.duration_seconds)}</span>
                        )}
                      </div>
                      {call.summary && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {call.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PhoneOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No call history yet</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </SlidePanel>
  );
}
