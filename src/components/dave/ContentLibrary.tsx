import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SlidePanel } from "./SlidePanel";
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

interface ContentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function ContentLibrary({ isOpen, onClose }: ContentLibraryProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<Partial<ContentUploadRequest>>({
    content_type: "video",
    audience: "client",
  });
  const [isUploading, setIsUploading] = useState(false);

  // Send SMS modal state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<ContentItem | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);

  // Fetch content on search/filter change
  useEffect(() => {
    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        if (searchQuery.trim()) {
          const result = await searchContent(searchQuery, 20);
          setContent(result.content || []);
        } else {
          const result = await listContent({
            content_type: filterType !== "all" ? filterType : undefined,
            limit: 50,
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
  }, [searchQuery, filterType]);

  // Search contacts for SMS
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
      await uploadContent(uploadForm as ContentUploadRequest);
      toast({
        title: "Content uploaded",
        description: "Your content has been added to the library",
      });
      setIsUploadOpen(false);
      setUploadForm({ content_type: "video", audience: "client" });
      // Refresh list
      const result = await listContent({ limit: 50 });
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
    setSendModalOpen(true);
  };

  const openPreview = (item: ContentItem) => {
    setPreviewContent(item);
    setPreviewModalOpen(true);
  };

  const handleSendSMS = async () => {
    if (!selectedContent || !selectedContact) return;

    setIsSending(true);
    try {
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

  const filteredContent = filterType === "all"
    ? content
    : content.filter((c) => c.content_type === filterType);

  return (
    <>
      <SlidePanel title="Content Library" isOpen={isOpen} onClose={onClose}>
        <div className="space-y-4">
          {/* Search & Filter Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="presentation">Presentations</SelectItem>
                <SelectItem value="proposal">Proposals</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsUploadOpen(true)} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No content found</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setIsUploadOpen(true)}
              >
                Upload your first item
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredContent.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md cursor-pointer"
                  onClick={() => openPreview(item)}
                >
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div
                      className={`rounded-lg p-2 ${CONTENT_TYPE_COLORS[item.content_type] || "bg-muted text-muted-foreground"}`}
                    >
                      {CONTENT_TYPE_ICONS[item.content_type] || <File className="h-5 w-5" />}
                    </div>

                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.content_type}
                        </Badge>
                        {item.audience && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {item.audience}
                          </Badge>
                        )}
                        {item.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="default" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

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
                </div>
              ))}
            </div>
          )}
        </div>
      </SlidePanel>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Add Content
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
                <Select
                  value={uploadForm.audience}
                  onValueChange={(v) =>
                    setUploadForm({
                      ...uploadForm,
                      audience: v as ContentUploadRequest["audience"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL (YouTube, Vimeo, etc.)</Label>
              <Input
                id="url"
                placeholder="https://youtube.com/watch?v=..."
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="ifa, tax planning, estate"
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewContent && (
                <div className={`rounded-lg p-2 ${CONTENT_TYPE_COLORS[previewContent.content_type] || "bg-muted"}`}>
                  {CONTENT_TYPE_ICONS[previewContent.content_type] || <File className="h-5 w-5" />}
                </div>
              )}
              {previewContent?.title}
            </DialogTitle>
            <DialogDescription>
              {previewContent?.description || "No description available"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {previewContent?.content_type}
              </Badge>
              {previewContent?.audience && (
                <Badge variant="secondary" className="capitalize">
                  {previewContent.audience}
                </Badge>
              )}
              {previewContent?.tags?.map((tag) => (
                <Badge key={tag} variant="default">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* URL Preview */}
            {previewContent?.url && (
              <div className="space-y-2">
                <Label>External Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={previewContent.url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(previewContent.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Embed preview for videos */}
                {previewContent.content_type === "video" && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    {(() => {
                      // Extract YouTube video ID
                      if (previewContent.url.includes("youtube.com") || previewContent.url.includes("youtu.be")) {
                        let videoId = "";
                        try {
                          if (previewContent.url.includes("youtu.be/")) {
                            // youtu.be/VIDEO_ID format
                            videoId = previewContent.url.split("youtu.be/")[1].split(/[?&]/)[0];
                          } else if (previewContent.url.includes("youtube.com/watch")) {
                            // youtube.com/watch?v=VIDEO_ID format
                            const urlObj = new URL(previewContent.url);
                            videoId = urlObj.searchParams.get("v") || "";
                          } else if (previewContent.url.includes("youtube.com/embed/")) {
                            // Already embed format
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
                        // Extract Vimeo video ID
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

                      // Fallback for unsupported video platforms
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

            {/* File Content Preview */}
            {previewContent?.file_content && (
              <div className="space-y-2">
                <Label>File Content</Label>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    File content available (base64 encoded)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = `data:application/octet-stream;base64,${previewContent.file_content}`;
                      link.download = `${previewContent.title}.pdf`;
                      link.click();
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}

            {/* Storage Path */}
            {previewContent?.storage_path && !previewContent.file_content && (
              <div className="space-y-2">
                <Label>Storage Location</Label>
                <Input
                  value={previewContent.storage_path}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Additional Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {previewContent?.created_at
                    ? new Date(previewContent.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Updated</Label>
                <p className="text-sm">
                  {previewContent?.updated_at
                    ? new Date(previewContent.updated_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>
            {previewContent && (
              <>
                <Button
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewModalOpen(false);
                    openSendModal(previewContent);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
                {previewContent.url && (
                  <Button
                    variant="default"
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

      {/* Send SMS Modal */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send to Client
            </DialogTitle>
            <DialogDescription>
              {selectedContent && (
                <span>
                  Send "<strong>{selectedContent.title}</strong>" via SMS
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Contact Search */}
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

              {/* Selected Contact */}
              {selectedContact && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="flex-1 text-sm font-medium">
                    {selectedContact.full_name}
                  </span>
                  {selectedContact.phone && (
                    <span className="text-xs text-muted-foreground">
                      {selectedContact.phone}
                    </span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setSelectedContact(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Contact Results */}
              {!selectedContact && contacts.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedContact(contact);
                        setContacts([]);
                        setContactSearch("");
                      }}
                    >
                      <div className="font-medium text-sm">{contact.full_name}</div>
                      {contact.phone && (
                        <div className="text-xs text-muted-foreground">{contact.phone}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {isSearchingContacts && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="smsMessage">Custom Message (optional)</Label>
              <Textarea
                id="smsMessage"
                placeholder="Add a personal note..."
                rows={2}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The content link will be automatically included.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendSMS}
              disabled={!selectedContact || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewContent && (
                <div
                  className={`rounded-lg p-2 ${CONTENT_TYPE_COLORS[previewContent.content_type] || "bg-muted text-muted-foreground"}`}
                >
                  {CONTENT_TYPE_ICONS[previewContent.content_type] || <File className="h-5 w-5" />}
                </div>
              )}
              {previewContent?.title}
            </DialogTitle>
            <DialogDescription>
              {previewContent?.description || "No description available"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {previewContent?.content_type}
              </Badge>
              {previewContent?.audience && (
                <Badge variant="secondary" className="capitalize">
                  {previewContent.audience}
                </Badge>
              )}
              {previewContent?.tags?.map((tag) => (
                <Badge key={tag} variant="default">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* URL Preview */}
            {previewContent?.url && (
              <div className="space-y-2">
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

                {/* Embed preview for videos */}
                {previewContent.content_type === "video" && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted mt-4">
                    {(() => {
                      // Extract YouTube video ID
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

                      // Fallback for unsupported video platforms
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

            {/* File Path Preview */}
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

            {/* Additional Metadata */}
            <div className="pt-4 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {previewContent?.created_at
                    ? new Date(previewContent.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>
            {previewContent && (
              <>
                <Button
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewModalOpen(false);
                    openSendModal(previewContent);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
                {previewContent.url && (
                  <Button
                    variant="default"
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
    </>
  );
}
