import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
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
  User,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  client_request: "bg-blue-900/50 text-blue-300 border-blue-700",
  proposal: "bg-purple-900/50 text-purple-300 border-purple-700",
  meeting: "bg-green-900/50 text-green-300 border-green-700",
  tax_question: "bg-amber-900/50 text-amber-300 border-amber-700",
  insurance: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
  succession: "bg-pink-900/50 text-pink-300 border-pink-700",
  general: "bg-zinc-800 text-zinc-400 border-zinc-700"
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
  const isMobile = useIsMobile();

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

  const handleBackToList = () => {
    setSelectedEmail(null);
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  // Email List Component
  const EmailList = () => (
    <div className="w-full flex flex-col h-full bg-zinc-950 border-r border-zinc-800 md:max-w-sm">
      <div className="p-3 md:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InboxIcon className="h-4 w-4 text-emerald-500" />
            <h1 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">Inbox</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs rounded-sm">{unreadCount}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSync} disabled={isSyncing} className="h-7 px-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-sm">
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-800 rounded-sm placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <Button
            variant={filterCategory === "" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterCategory("")}
            className="h-6 px-2 text-xs rounded-sm shrink-0"
          >
            All
          </Button>
          <Button
            variant={filterCategory === "client_request" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterCategory("client_request")}
            className="h-6 px-2 text-xs rounded-sm shrink-0"
          >
            Requests
          </Button>
          {actionRequiredCount > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs shrink-0 rounded-sm">
              <AlertCircle className="h-3 w-3 mr-1" />
              {actionRequiredCount}
            </Badge>
          )}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-zinc-600">
            <MailOpen className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-xs font-mono">No emails found</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                className={`p-3 cursor-pointer hover:bg-zinc-900/50 transition-colors ${
                  selectedEmail?.id === email.id ? 'bg-zinc-900' : ''
                } ${!email.is_read ? 'bg-emerald-950/20' : ''}`}
                onClick={() => handleEmailClick(email)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!email.is_read ? (
                        <Mail className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <MailOpen className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                      )}
                      <span className={`truncate text-xs ${!email.is_read ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}>
                        {email.from_name || email.from_address}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${!email.is_read ? 'font-medium text-zinc-300' : 'text-zinc-500'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-zinc-600 truncate mt-1 font-mono">
                      {email.snippet}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm border ${CATEGORY_COLORS[email.category] || CATEGORY_COLORS.general}`}>
                        {email.category}
                      </Badge>
                      <span className="text-xs">{PRIORITY_ICONS[email.priority]}</span>
                      <span className="text-[10px] text-zinc-600 ml-auto font-mono">
                        {format(new Date(email.received_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 rounded-sm"
                    onClick={(e) => handleStar(email, e)}
                  >
                    <Star className={`h-3.5 w-3.5 ${email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Email Detail Component
  const EmailDetail = () => (
    <div className="flex-1 flex flex-col bg-black">
      {selectedEmail ? (
        <>
          <div className="p-4 md:p-6 border-b border-zinc-800">
            {/* Mobile back button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="mb-3 -ml-2 text-zinc-400 hover:text-zinc-200 rounded-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="text-xs uppercase tracking-wide">Back</span>
              </Button>
            )}
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-zinc-200 truncate">{selectedEmail.subject}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">{selectedEmail.from_name || selectedEmail.from_address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono">{format(new Date(selectedEmail.received_at), 'PPp')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button variant="ghost" size="icon" onClick={(e) => handleStar(selectedEmail, e)} className="h-8 w-8 rounded-sm text-zinc-500 hover:text-zinc-300">
                  <Star className={`h-4 w-4 ${selectedEmail.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleArchive} className="h-8 w-8 rounded-sm text-zinc-500 hover:text-zinc-300">
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="outline" className={`text-xs rounded-sm border ${CATEGORY_COLORS[selectedEmail.category] || CATEGORY_COLORS.general}`}>
                {selectedEmail.category}
              </Badge>
              <Badge variant="outline" className="text-xs rounded-sm border-zinc-700 text-zinc-400">{selectedEmail.priority}</Badge>
              {selectedEmail.requires_response && (
                <Badge variant="destructive" className="text-xs rounded-sm">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Action Required
                </Badge>
              )}
              {selectedEmail.contact && (
                <Badge variant="secondary" className="text-xs rounded-sm bg-zinc-800 text-zinc-400">
                  <User className="h-3 w-3 mr-1" />
                  {selectedEmail.contact.first_name} {selectedEmail.contact.last_name}
                </Badge>
              )}
            </div>

            {selectedEmail.ai_summary && (
              <Card className="mt-4 p-3 bg-zinc-900 border-zinc-800 rounded-sm">
                <h3 className="text-xs font-medium mb-1.5 text-zinc-400 uppercase tracking-wide">AI Summary</h3>
                <p className="text-xs text-zinc-500">{selectedEmail.ai_summary}</p>
              </Card>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 md:p-6">
              <p className="whitespace-pre-wrap text-sm text-zinc-300 font-mono">{selectedEmail.snippet}</p>
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-zinc-600">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs font-mono uppercase tracking-wide">Select an email</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PageTransition className="flex min-h-screen flex-col bg-black">
      <Header onLogout={handleLogout} onSettingsClick={() => setShowSettings(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile: Show list OR detail */}
        {isMobile ? (
          selectedEmail ? <EmailDetail /> : <EmailList />
        ) : (
          /* Desktop: Show both side by side */
          <>
            <EmailList />
            <EmailDetail />
          </>
        )}
      </div>
    </PageTransition>
  );
}