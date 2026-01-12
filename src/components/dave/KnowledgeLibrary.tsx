import { useState, useEffect } from "react";
import { Search, Book, Tag, Clock, Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listKnowledge, searchKnowledge, KnowledgeEntry } from "@/lib/api";
import { KnowledgeUploadForm } from "./KnowledgeUploadForm";
import { format } from "date-fns";

interface KnowledgeLibraryProps {
  onClose?: () => void;
}

export function KnowledgeLibrary({ onClose }: KnowledgeLibraryProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const fetchEntries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listKnowledge();
      setEntries(result.entries || []);
    } catch (err) {
      console.error("Failed to fetch knowledge entries:", err);
      setError("Failed to load knowledge library");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchEntries();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await searchKnowledge(searchQuery);
      setEntries(result.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        fetchEntries();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    fetchEntries();
  };

  if (showUploadForm) {
    return (
      <div className="h-full p-4">
        <KnowledgeUploadForm
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Knowledge Library</h3>
          </div>
          <Button size="sm" onClick={() => setShowUploadForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge base..."
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
              <Button variant="outline" size="sm" onClick={fetchEntries}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No knowledge entries found</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowUploadForm(true)}
                className="mt-2"
              >
                Add your first entry
              </Button>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border bg-card p-3 space-y-2 hover:bg-accent/50 transition-colors"
              >
                <h4 className="font-medium text-foreground">{entry.title}</h4>
                {entry.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{entry.summary}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs capitalize">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {entry.createdAt ? format(new Date(entry.createdAt), "MMM d, yyyy") : "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
