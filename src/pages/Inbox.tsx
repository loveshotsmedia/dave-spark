import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/effects/PageTransition";
import { Header } from "@/components/dave/Header";
import { listEmails, syncEmails, markEmailRead, starEmail, archiveEmail, Email } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  MailOpen,
  Star,
  Archive,
  RefreshCw,
  Search,
  Inbox as InboxIcon,
  AlertCircle,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  client_request: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  proposal: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  meeting: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  tax_question: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  insurance: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  succession: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

const PRIORITY_ICONS: Record<string, string> = {
  urgent: "🔴",
  high: "🟠",
  normal: "🟢",
  low: "⚪"
};

export default function Inbox() {
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  // Hardcoded account ID for now - replace with actual account selection
  const accountId = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setIsLoading(true);
    try {
      const data = await listEmails(accountId);
      setEmails(data);
    } catch (error) {
      toast.error("Failed to load emails");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncEmails(accountId);
      toast.success("Emails synced successfully");
      await loadEmails();
    } catch (error) {
      toast.error("Failed to sync emails");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      await markEmailRead(email.id);
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
    }
  };

  const handleStar = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    await starEmail(email.id, !email.is_starred);
    setEmails(prev => prev.map(em => em.id === email.id ? { ...em, is_starred: !em.is_starred } : em));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail({ ...selectedEmail, is_starred: !selectedEmail.is_starred });
    }
  };

  const handleArchive = async () => {
    if (!selectedEmail) return;
    await archiveEmail(selectedEmail.id);
    setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
    setSelectedEmail(null);
    toast.success("Email archived");
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = searchQuery === "" ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "" || email.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const unreadCount = emails.filter(e => !e.is_read).length;
  const actionRequiredCount = emails.filter(e => e.requires_response).length;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background">
      <Header onLogout={handleLogout} onSettingsClick={() => setShowSettings(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Email List Sidebar */}
        <div className="w-full max-w-md border-r border-border bg-card flex flex-col">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <InboxIcon className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Inbox</h1>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={filterCategory === "" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterCategory("")}
              >
                All
              </Button>
              <Button
                variant={filterCategory === "client_request" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterCategory("client_request")}
              >
                Requests
              </Button>
              {actionRequiredCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {actionRequiredCount} actions
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <MailOpen className="h-12 w-12 mb-4 opacity-50" />
                <p>No emails found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-muted' : ''
                    } ${!email.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleEmailClick(email)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!email.is_read ? (
                            <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={`truncate text-sm ${!email.is_read ? 'font-semibold' : ''}`}>
                            {email.from_name || email.from_address}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${!email.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {email.snippet}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={CATEGORY_COLORS[email.category] || CATEGORY_COLORS.general}>
                            {email.category}
                          </Badge>
                          <span className="text-xs">{PRIORITY_ICONS[email.priority]}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(email.received_at), 'MMM d')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => handleStar(email, e)}
                      >
                        <Star className={`h-4 w-4 ${email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Email Detail View */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedEmail ? (
            <>
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedEmail.from_name || selectedEmail.from_address}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(selectedEmail.received_at), 'PPp')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => handleStar(selectedEmail, e)}>
                      <Star className={`h-4 w-4 ${selectedEmail.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleArchive}>
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className={CATEGORY_COLORS[selectedEmail.category] || CATEGORY_COLORS.general}>
                    {selectedEmail.category}
                  </Badge>
                  <Badge variant="outline">{selectedEmail.priority} priority</Badge>
                  {selectedEmail.requires_response && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Action Required
                    </Badge>
                  )}
                  {selectedEmail.contact && (
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      {selectedEmail.contact.first_name} {selectedEmail.contact.last_name}
                    </Badge>
                  )}
                </div>

                {selectedEmail.ai_summary && (
                  <Card className="mt-4 p-4 bg-muted/50">
                    <h3 className="text-sm font-medium mb-2">AI Summary</h3>
                    <p className="text-sm text-muted-foreground">{selectedEmail.ai_summary}</p>
                  </Card>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <p className="whitespace-pre-wrap text-sm">{selectedEmail.snippet}</p>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}