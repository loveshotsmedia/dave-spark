import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Upload,
  Video,
  FileText,
  Image as ImageIcon,
  Presentation,
  Sheet,
  File,
  Send,
  ExternalLink,
  Trash2,
  Plus,
  Loader2,
  X,
  Tag,
  Grid3X3,
  List,
  Filter,
  Users,
  ArrowLeft,
  Edit,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listContent,
  searchContent,
  uploadContent,
  deleteContent,
  sendContentSMS,
  searchContacts,
  ContentItem,
  ContentUploadRequest,
  Contact,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="h-5 w-5" />,
  article: <FileText className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  presentation: <Presentation className="h-5 w-5" />,
  spreadsheet: <Sheet className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  proposal: <File className="h-5 w-5" />,
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  video: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  article: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  document: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  presentation: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  spreadsheet: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  image: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  proposal: "bg-primary/10 text-primary",
};

const AUDIENCE_COLORS: Record<string, string> = {
  client: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  advisor: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  internal: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
};

export default function ContentLibraryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<Partial<ContentUploadRequest>>({
    content_type: "video",
    audience: "client",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  // Send to client modal state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [sendVia, setSendVia] = useState<"sms" | "email">("sms");

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<ContentItem | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch content on search/filter change
  useEffect(() => {
    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        if (searchQuery.trim()) {
          const result = await searchContent(searchQuery, 50);
          setContent(result.content || []);
        } else {
          const result = await listContent({
            content_type: filterType !== "all" ? filterType : undefined,
            audience: filterAudience !== "all" ? filterAudience : undefined,
            limit: 100,
          });
          setContent(result.content || []);
        }
      } catch (err) {
        console.error("Failed to load content:", err);
        toast({
          title: "Error",
          description: "Failed to load content library",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, filterType, filterAudience]);

  // Search contacts for sending
  useEffect(() => {
    if (!contactSearch.trim()) {
      setContacts([]);
      return;
    }
    const debounce = setTimeout(async () => {
      setIsSearchingContacts(true);
      try {
        const result = await searchContacts(contactSearch);
        setContacts(result.contacts || []);
      } catch (err) {
        console.error("Failed to search contacts:", err);
      } finally {
        setIsSearchingContacts(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [contactSearch]);

  const handleUpload = async () => {
    if (!uploadForm.title?.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for the content",
        variant: "destructive",
      });
      return;
    }

    if (!uploadForm.url?.trim() && !uploadForm.file_content) {
      toast({
        title: "Missing content",
        description: "Please enter a URL or upload a file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const keywords = keywordsInput.split(",").map((t) => t.trim()).filter(Boolean);

      await uploadContent({
        ...uploadForm,
        tags: tags.length > 0 ? tags : undefined,
        topic_keywords: keywords.length > 0 ? keywords : undefined,
      } as ContentUploadRequest);

      toast({
        title: "Content uploaded",
        description: "Your content has been added to the library",
      });
      setIsUploadOpen(false);
      setUploadForm({ content_type: "video", audience: "client" });
      setTagsInput("");
      setKeywordsInput("");
      // Refresh list
      const result = await listContent({ limit: 100 });
      setContent(result.content || []);
    } catch (err) {
      console.error("Upload failed:", err);
      toast({
        title: "Upload failed",
        description: "Failed to upload content",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: ContentItem) => {
    try {
      await deleteContent(item.id);
      setContent(content.filter((c) => c.id !== item.id));
      toast({
        title: "Content deleted",
        description: `"${item.title}" has been removed`,
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  const openSendModal = (item: ContentItem) => {
    setSelectedContent(item);
    setSelectedContact(null);
    setContactSearch("");
    setSmsMessage("");
    setSendVia("sms");
    setSendModalOpen(true);
  };

  const openPreview = (item: ContentItem) => {
    setPreviewContent(item);
    setPreviewModalOpen(true);
  };

  const handleSend = async () => {
    if (!selectedContent || !selectedContact) return;

    if (sendVia === "sms" && !selectedContact.phone) {
      toast({
        title: "No phone number",
        description: "This contact doesn't have a phone number",
        variant: "destructive",
      });
      return;
    }

    if (sendVia === "email" && !selectedContact.email) {
      toast({
        title: "No email",
        description: "This contact doesn't have an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      if (sendVia === "sms") {
        const result = await sendContentSMS({
          contactId: selectedContact.id,
          contentId: selectedContent.id,
          message: smsMessage || undefined,
        });

        if (result.success) {
          toast({
            title: "SMS sent!",
            description: `"${selectedContent.title}" sent to ${selectedContact.full_name}`,
          });
          setSendModalOpen(false);
        } else {
          throw new Error(result.error || "Failed to send SMS");
        }
      } else {
        // Email would be handled here
        toast({
          title: "Coming soon",
          description: "Email sending will be available soon",
        });
      }
    } catch (err) {
      console.error("Send failed:", err);
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Failed to send",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredContent = content.filter((c) => {
    if (filterType !== "all" && c.content_type !== filterType) return false;
    if (filterAudience !== "all" && c.audience !== filterAudience) return false;
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/chat")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Content Library</h1>
                <p className="text-sm text-muted-foreground">
                  Manage educational content and marketing materials
                </p>
              </div>
            </div>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="presentation">Presentations</SelectItem>
                <SelectItem value="proposal">Proposals</SelectItem>
                <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAudience} onValueChange={setFilterAudience}>
              <SelectTrigger className="w-[130px]">
                <Users className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="advisor">Advisor</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-md border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search or filters" : "Get started by uploading your first item"}
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl border bg-card p-4 transition-all hover:shadow-lg hover:border-primary/20 cursor-pointer"
                onClick={() => openPreview(item)}
              >
                {/* Type Icon & Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`rounded-lg p-2.5 ${CONTENT_TYPE_COLORS[item.content_type] || "bg-muted text-muted-foreground"}`}
                  >
                    {CONTENT_TYPE_ICONS[item.content_type] || <File className="h-5 w-5" />}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.url && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.url, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSendModal(item);
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Title & Description */}
                <h4 className="font-semibold truncate mb-1">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.content_type}
                  </Badge>
                  {item.audience && (
                    <Badge className={`text-xs capitalize ${AUDIENCE_COLORS[item.audience]}`}>
                      {item.audience}
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Date */}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-2">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20 cursor-pointer"
                onClick={() => openPreview(item)}
              >
                {/* Type Icon */}
                <div
                  className={`flex-shrink-0 rounded-lg p-2.5 ${CONTENT_TYPE_COLORS[item.content_type] || "bg-muted text-muted-foreground"}`}
                >
                  {CONTENT_TYPE_ICONS[item.content_type] || <File className="h-5 w-5" />}
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.content_type}
                  </Badge>
                  {item.audience && (
                    <Badge className={`text-xs capitalize ${AUDIENCE_COLORS[item.audience]}`}>
                      {item.audience}
                    </Badge>
                  )}
                </div>

                {/* Date */}
                <span className="hidden md:block text-sm text-muted-foreground">
                  {format(new Date(item.created_at), "MMM d, yyyy")}
                </span>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.url, "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSendModal(item);
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Content
            </DialogTitle>
            <DialogDescription>
              Add a video, document, or article to your content library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., IFA Strategy Explained"
                value={uploadForm.title || ""}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Type *</Label>
                <Select
                  value={uploadForm.content_type}
                  onValueChange={(v) =>
                    setUploadForm({
                      ...uploadForm,
                      content_type: v as ContentUploadRequest["content_type"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Audience</Label>
                <RadioGroup
                  value={uploadForm.audience || "client"}
                  onValueChange={(v) =>
                    setUploadForm({
                      ...uploadForm,
                      audience: v as ContentUploadRequest["audience"],
                    })
                  }
                  className="flex gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client" className="font-normal">Client</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advisor" id="advisor" />
                    <Label htmlFor="advisor" className="font-normal">Advisor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="internal" id="internal" />
                    <Label htmlFor="internal" className="font-normal">Internal</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL (YouTube, Vimeo, web articles, etc.)</Label>
              <Input
                id="url"
                placeholder="https://youtube.com/watch?v=... or https://..."
                value={uploadForm.url || ""}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, url: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this content..."
                rows={3}
                value={uploadForm.description || ""}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="ifa, tax planning, estate"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Topic Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="estate freeze, capital gains"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Used for AI matching</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Client Modal */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send to Client
            </DialogTitle>
            <DialogDescription>
              Send "{selectedContent?.title}" to a client via SMS or email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Contact Search */}
            {!selectedContact ? (
              <div className="space-y-2">
                <Label>Select Contact</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isSearchingContacts && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {contacts.length > 0 && (
                  <ScrollArea className="h-48 rounded-md border">
                    <div className="p-2 space-y-1">
                      {contacts.map((contact) => (
                        <button
                          key={contact.id}
                          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {contact.full_name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{contact.full_name}</p>
                            {contact.email && (
                              <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {contactSearch && !isSearchingContacts && contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contacts found
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Selected Contact */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedContact.full_name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedContact.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sendVia === "sms" ? selectedContact.phone : selectedContact.email}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Send Via Toggle */}
                <div className="space-y-2">
                  <Label>Send via</Label>
                  <RadioGroup
                    value={sendVia}
                    onValueChange={(v) => setSendVia(v as "sms" | "email")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="sms" disabled={!selectedContact.phone} />
                      <Label htmlFor="sms" className={`font-normal ${!selectedContact.phone ? "text-muted-foreground" : ""}`}>
                        SMS {!selectedContact.phone && "(no phone)"}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email" disabled={!selectedContact.email} />
                      <Label htmlFor="email" className={`font-normal ${!selectedContact.email ? "text-muted-foreground" : ""}`}>
                        Email {!selectedContact.email && "(no email)"}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Custom Message (optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal message..."
                    rows={3}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                  />
                </div>

                {/* Preview */}
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                  <p className="text-sm">
                    {smsMessage || "Check out this content I thought you'd find helpful:"}{" "}
                    <span className="text-primary font-medium">{selectedContent?.title}</span>
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !selectedContact}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send {sendVia.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {previewContent && (
                <div
                  className={`rounded-lg p-2 ${CONTENT_TYPE_COLORS[previewContent.content_type] || "bg-muted text-muted-foreground"}`}
                >
                  {CONTENT_TYPE_ICONS[previewContent.content_type] || <File className="h-5 w-5" />}
                </div>
              )}
              <span className="truncate">{previewContent?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {previewContent?.description || "No description available"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {previewContent?.content_type}
              </Badge>
              {previewContent?.audience && (
                <Badge className={`capitalize ${AUDIENCE_COLORS[previewContent.audience]}`}>
                  {previewContent.audience}
                </Badge>
              )}
              {previewContent?.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* URL Preview */}
            {previewContent?.url && (
              <div className="space-y-3">
                <Label>External Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={previewContent.url}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => window.open(previewContent.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Video Embed */}
                {previewContent.content_type === "video" && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted mt-4">
                    {(() => {
                      // YouTube
                      if (previewContent.url.includes("youtube.com") || previewContent.url.includes("youtu.be")) {
                        let videoId = "";
                        try {
                          if (previewContent.url.includes("youtu.be/")) {
                            videoId = previewContent.url.split("youtu.be/")[1].split(/[?&]/)[0];
                          } else if (previewContent.url.includes("youtube.com/watch")) {
                            const urlObj = new URL(previewContent.url);
                            videoId = urlObj.searchParams.get("v") || "";
                          } else if (previewContent.url.includes("youtube.com/embed/")) {
                            videoId = previewContent.url.split("youtube.com/embed/")[1].split(/[?&]/)[0];
                          }
                        } catch (e) {
                          console.error("Failed to parse YouTube URL:", e);
                        }

                        if (videoId) {
                          return (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        }
                      } else if (previewContent.url.includes("vimeo.com")) {
                        // Vimeo
                        let videoId = "";
                        try {
                          videoId = previewContent.url.split("vimeo.com/")[1].split(/[?&]/)[0];
                        } catch (e) {
                          console.error("Failed to parse Vimeo URL:", e);
                        }

                        if (videoId) {
                          return (
                            <iframe
                              src={`https://player.vimeo.com/video/${videoId}`}
                              className="w-full h-full"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        }
                      }

                      // Fallback
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                          <Video className="h-12 w-12" />
                          <p className="text-sm">Video preview not available</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(previewContent.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in New Tab
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* File Path */}
            {previewContent?.file_path && (
              <div className="space-y-2">
                <Label>File Location</Label>
                <Input
                  value={previewContent.file_path}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Created Date */}
            <div className="pt-4 border-t">
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm">
                {previewContent?.created_at
                  ? format(new Date(previewContent.created_at), "MMMM d, yyyy 'at' h:mm a")
                  : "Unknown"}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>
            {previewContent && (
              <>
                <Button
                  onClick={() => {
                    setPreviewModalOpen(false);
                    openSendModal(previewContent);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
                {previewContent.url && (
                  <Button
                    variant="secondary"
                    onClick={() => window.open(previewContent.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
