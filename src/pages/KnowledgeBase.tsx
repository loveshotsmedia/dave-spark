import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageTransition } from "@/components/effects/PageTransition";
import { Header } from "@/components/dave/Header";
import {
  listKnowledge,
  searchKnowledge,
  uploadKnowledge,
  bulkImportKnowledge,
  deleteKnowledge,
  updateKnowledge,
  KnowledgeEntry,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Plus,
  FileText,
  FileSignature,
  Scale,
  Briefcase,
  Mail,
  Edit,
  File,
  Trash2,
  Eye,
  Upload,
  Database,
  Filter,
  BookOpen,
  X,
} from "lucide-react";
import { format } from "date-fns";

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  tax: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  insurance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  estate: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  investment: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  corporate: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  gaar: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  compliance: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  general: "bg-muted text-muted-foreground",
};

// Source type icons
const SOURCE_ICONS: Record<string, typeof FileText> = {
  article: FileText,
  proposal_template: FileSignature,
  regulation: Scale,
  case_study: Briefcase,
  client_communication: Mail,
  manual_entry: Edit,
  file: File,
};

const SOURCE_TYPE_OPTIONS = [
  { value: "article", label: "Article" },
  { value: "proposal_template", label: "Proposal Template" },
  { value: "regulation", label: "Regulation" },
  { value: "case_study", label: "Case Study" },
  { value: "client_communication", label: "Client Communication" },
  { value: "manual_entry", label: "Manual Entry" },
];

const CATEGORY_OPTIONS = ["tax", "insurance", "estate", "investment", "corporate", "gaar", "compliance"];

// Radix Select reserves "" for clearing; never use it as an item value.
const ALL_FILTER_VALUE = "__all__";

const SAMPLE_CONTENT = [
  {
    title: "What is an Insured Financing Arrangement (IFA)?",
    content: "An Insured Financing Arrangement (IFA) is a sophisticated tax planning strategy that combines corporate-owned life insurance with leveraged borrowing. The corporation purchases a permanent life insurance policy and uses the cash surrender value as collateral for loans from a third-party lender. This allows shareholders to access tax-free funds during their lifetime while maintaining the death benefit for estate planning purposes. Key benefits include tax-efficient wealth extraction, estate equalization, and creditor protection. However, IFAs require careful structuring to avoid GAAR concerns and must demonstrate legitimate business purposes beyond tax savings.",
    sourceType: "article",
    tags: ["ifa", "insurance", "tax_planning"],
  },
  {
    title: "Estate Freeze - Section 86 Overview",
    content: "Section 86 of the Income Tax Act provides for tax-deferred reorganization of share capital. An estate freeze allows a business owner to 'freeze' the current value of their shares by exchanging them for fixed-value preferred shares, while new common shares with future growth potential are issued to the next generation or a family trust. This strategy defers capital gains tax until the preferred shares are disposed of and shifts future growth to successors. Key requirements include: the exchange must be for shares only (no boot), the FMV of preferred shares cannot exceed the FMV of original shares, and the PUC of new shares cannot exceed the PUC of old shares.",
    sourceType: "article",
    tags: ["estate_freeze", "section_86", "succession"],
  },
  {
    title: "Capital Dividend Account (CDA) Explained",
    content: "The Capital Dividend Account is a notional account that tracks the tax-free portion of a private corporation's capital gains and certain other tax-free receipts. The CDA allows corporations to distribute these tax-free amounts to Canadian resident shareholders as capital dividends, which are received tax-free. CDA credits arise from: (1) the non-taxable portion of capital gains minus the non-deductible portion of capital losses, (2) capital dividends received from other corporations, (3) the proceeds of life insurance policies minus the adjusted cost basis. Special elections under s.83(2) must be filed to designate dividends as capital dividends.",
    sourceType: "article",
    tags: ["cda", "corporate", "tax_planning"],
  },
];

export default function KnowledgeBase() {
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("library");
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<KnowledgeEntry | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("");

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [uploadSourceType, setUploadSourceType] = useState("manual_entry");
  const [uploadCategories, setUploadCategories] = useState<string[]>([]);
  const [uploadTags, setUploadTags] = useState("");
  const [uploadIsTemplate, setUploadIsTemplate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Bulk import state
  const [bulkJson, setBulkJson] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    loadEntries();
  }, [categoryFilter, sourceTypeFilter]);

  // Helper to extract error message from any error type
  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
    return fallback;
  };

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const result = await listKnowledge({
        category: categoryFilter || undefined,
        sourceType: sourceTypeFilter || undefined,
        limit: 100,
      });
      setEntries(result.entries || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load knowledge entries"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchKnowledge(searchQuery, 20);
      setSearchResults(result.results || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Search failed"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsUploading(true);
    try {
      await uploadKnowledge({
        title: uploadTitle,
        content: uploadContent,
        sourceType: uploadSourceType as "article" | "manual_entry" | "proposal_template" | "regulation" | "case_study" | "client_communication" | "file",
        tags: uploadTags.split(",").map((t) => t.trim()).filter(Boolean),
        isTemplate: uploadIsTemplate,
      });
      toast.success("Knowledge entry uploaded successfully");
      setUploadTitle("");
      setUploadContent("");
      setUploadSourceType("manual_entry");
      setUploadCategories([]);
      setUploadTags("");
      setUploadIsTemplate(false);
      loadEntries();
      setActiveTab("library");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload knowledge entry"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkJson.trim()) {
      toast.error("Please enter JSON data to import");
      return;
    }

    setIsImporting(true);
    try {
      let entries;
      try {
        entries = JSON.parse(bulkJson);
      } catch {
        // Try parsing as --- separated entries
        entries = bulkJson.split("---").filter(Boolean).map((block) => {
          const lines = block.trim().split("\n");
          const title = lines[0]?.replace(/^#+\s*/, "").trim();
          const content = lines.slice(1).join("\n").trim();
          return { title, content };
        });
      }

      const result = await bulkImportKnowledge(entries);
      toast.success(`Imported ${result.success} entries (${result.failed} failed)`);
      if (result.errors.length > 0) {
        result.errors.forEach(err => toast.error(err));
      }
      setBulkJson("");
      loadEntries();
      setActiveTab("library");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to import entries"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadSampleContent = async () => {
    setIsImporting(true);
    try {
      const result = await bulkImportKnowledge(SAMPLE_CONTENT);
      toast.success(`Loaded ${result.success} sample entries`);
      loadEntries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load sample content"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmEntry) return;

    try {
      await deleteKnowledge(deleteConfirmEntry.id);
      toast.success("Entry deleted");
      setDeleteConfirmEntry(null);
      loadEntries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete entry"));
    }
  };

  const handleViewEntry = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content_summary || entry.content_text || "");
    setIsEditMode(false);
    setIsViewDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;

    try {
      await updateKnowledge(selectedEntry.id, {
        title: editTitle,
        content: editContent,
      });
      toast.success("Entry updated");
      setIsViewDialogOpen(false);
      loadEntries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update entry"));
    }
  };

  const handleQuickAdd = (preset: { sourceType: string; tags: string[]; title?: string }) => {
    setUploadSourceType(preset.sourceType);
    setUploadTags(preset.tags.join(", "));
    if (preset.title) setUploadTitle(preset.title);
    setActiveTab("upload");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Stats
  const totalEntries = entries.length;
  const categoryBreakdown = entries.reduce((acc, entry) => {
    (entry.category || []).forEach((cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const SourceIcon = SOURCE_ICONS[selectedEntry?.source_type || "manual_entry"] || FileText;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition className="flex h-screen flex-col bg-background">
      <Header onLogout={handleLogout} onSettingsClick={() => {}} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Header Section */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                Knowledge Base
              </h1>
              <p className="text-muted-foreground mt-1">
                Dave's expertise library - powers AI responses
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4">
              <Card className="flex-1 min-w-[150px]">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{totalEntries}</p>
                      <p className="text-xs text-muted-foreground">Total Entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {Object.entries(categoryBreakdown).slice(0, 4).map(([cat, count]) => (
                <Card key={cat} className="flex-1 min-w-[120px]">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Badge className={CATEGORY_COLORS[cat] || CATEGORY_COLORS.general}>
                        {cat}
                      </Badge>
                      <span className="text-lg font-semibold">{count}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search knowledge base (semantic search)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handleViewEntry(result)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {result.content_summary || "No summary available"}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {result.source_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Add Templates */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd({ sourceType: "article", tags: ["ifa", "insured_financing"], title: "" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add IFA Article
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd({ sourceType: "proposal_template", tags: ["estate_freeze", "section_86"], title: "" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Estate Freeze Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd({ sourceType: "regulation", tags: ["gaar", "compliance"], title: "" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add GAAR Regulation
            </Button>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filters:</span>
                </div>
                <Select
                  value={categoryFilter || ALL_FILTER_VALUE}
                  onValueChange={(value) => setCategoryFilter(value === ALL_FILTER_VALUE ? "" : value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sourceTypeFilter || ALL_FILTER_VALUE}
                  onValueChange={(value) => setSourceTypeFilter(value === ALL_FILTER_VALUE ? "" : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Source Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>All Source Types</SelectItem>
                    {SOURCE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(categoryFilter || sourceTypeFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter("");
                      setSourceTypeFilter("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Empty State */}
              {!isLoading && entries.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No knowledge entries yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your knowledge base or load sample content
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setActiveTab("upload")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                      </Button>
                      <Button variant="outline" onClick={handleLoadSampleContent} disabled={isImporting}>
                        {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        Load Sample Content
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Entry Grid */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry) => {
                    const Icon = SOURCE_ICONS[entry.source_type] || FileText;
                    return (
                      <Card key={entry.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {(entry.category || []).map((cat) => (
                                <Badge key={cat} className={CATEGORY_COLORS[cat] || CATEGORY_COLORS.general}>
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                            <Badge variant="outline" className="shrink-0 flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              {entry.source_type}
                            </Badge>
                          </div>
                          <CardTitle className="text-base leading-tight mt-2">{entry.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {entry.content_summary || "No summary available"}
                          </p>

                          <div className="flex flex-wrap gap-1">
                            {(entry.tags || []).slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {(entry.tags || []).length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{entry.tags.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), "MMM d, yyyy")}
                            </span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewEntry(entry)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteConfirmEntry(entry)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Knowledge Entry</CardTitle>
                  <CardDescription>Add new content to Dave's knowledge base</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Estate Freeze Best Practices"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content * (supports markdown)</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter the knowledge content here..."
                      value={uploadContent}
                      onChange={(e) => setUploadContent(e.target.value)}
                      rows={10}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Source Type</Label>
                      <Select value={uploadSourceType} onValueChange={setUploadSourceType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        placeholder="e.g., ifa, insurance, tax_planning"
                        value={uploadTags}
                        onChange={(e) => setUploadTags(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <Badge
                          key={cat}
                          className={`cursor-pointer ${
                            uploadCategories.includes(cat)
                              ? CATEGORY_COLORS[cat]
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          onClick={() => {
                            setUploadCategories((prev) =>
                              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                            );
                          }}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isTemplate"
                      checked={uploadIsTemplate}
                      onCheckedChange={(checked) => setUploadIsTemplate(checked as boolean)}
                    />
                    <Label htmlFor="isTemplate" className="cursor-pointer">
                      This is a reusable template
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleUpload} disabled={isUploading || !uploadTitle || !uploadContent}>
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Entry
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadTitle("");
                        setUploadContent("");
                        setUploadSourceType("manual_entry");
                        setUploadCategories([]);
                        setUploadTags("");
                        setUploadIsTemplate(false);
                      }}
                    >
                      Clear Form
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload - Coming Soon */}
              <Card className="mt-4 border-dashed opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    File Upload
                    <Badge variant="secondary">Coming Soon</Badge>
                  </CardTitle>
                  <CardDescription>
                    Drag & drop PDF, DOCX, TXT, or MD files to auto-extract text
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p>Drag files here or click to browse</p>
                    <p className="text-xs mt-1">PDF, DOCX, TXT, MD accepted</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Import</CardTitle>
                  <CardDescription>
                    Import multiple entries at once using JSON format or markdown separated by ---
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>JSON Array or Markdown Entries</Label>
                    <Textarea
                      placeholder={`[
  {
    "title": "Entry Title",
    "content": "Entry content here...",
    "sourceType": "article",
    "tags": ["tag1", "tag2"]
  }
]

OR separate entries with ---

# First Entry Title
Content of the first entry...

---

# Second Entry Title
Content of the second entry...`}
                      value={bulkJson}
                      onChange={(e) => setBulkJson(e.target.value)}
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleBulkImport} disabled={isImporting || !bulkJson.trim()}>
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import All
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setBulkJson("")}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedEntry?.category?.map((cat) => (
                <Badge key={cat} className={CATEGORY_COLORS[cat] || CATEGORY_COLORS.general}>
                  {cat}
                </Badge>
              ))}
              <Badge variant="outline" className="flex items-center gap-1">
                <SourceIcon className="h-3 w-3" />
                {selectedEntry?.source_type}
              </Badge>
            </div>
            <DialogTitle>
              {isEditMode ? (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-xl font-bold" />
              ) : (
                selectedEntry?.title
              )}
            </DialogTitle>
            <DialogDescription>
              Created {selectedEntry && format(new Date(selectedEntry.created_at), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            {isEditMode ? (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={15}
                className="font-mono"
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">
                  {selectedEntry?.content_text || selectedEntry?.content_summary || "No content available"}
                </p>
              </div>
            )}
          </ScrollArea>

          {selectedEntry?.tags && selectedEntry.tags.length > 0 && !isEditMode && (
            <div className="flex flex-wrap gap-1 pt-2">
              {selectedEntry.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <DialogFooter>
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmEntry} onOpenChange={() => setDeleteConfirmEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Knowledge Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirmEntry?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmEntry(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
