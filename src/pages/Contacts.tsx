import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ArrowUpDown,
  Users,
  Loader2,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchContacts, Contact } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { AddContactModal } from "@/components/dave/AddContactModal";

const STATUS_OPTIONS = ["All", "Prospect", "Active", "Inactive", "VIP", "Whale"];
const NET_WORTH_RANGES = [
  { label: "All", min: 0, max: Infinity },
  { label: "< $500K", min: 0, max: 500000 },
  { label: "$500K - $1M", min: 500000, max: 1000000 },
  { label: "$1M - $5M", min: 1000000, max: 5000000 },
  { label: "$5M - $10M", min: 5000000, max: 10000000 },
  { label: "> $10M", min: 10000000, max: Infinity },
];

type SortField = "full_name" | "updated_at" | "net_worth";
type SortDirection = "asc" | "desc";

function formatNetWorth(value?: number): string {
  if (!value) return "—";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

function getStatusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case "vip":
    case "whale":
      return "bg-primary text-primary-foreground";
    case "active":
    case "client":
      return "bg-success text-success-foreground";
    case "prospect":
      return "bg-warning text-warning-foreground";
    case "inactive":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

export default function Contacts() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [netWorthRange, setNetWorthRange] = useState(NET_WORTH_RANGES[0]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortField, setSortField] = useState<SortField>("full_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showAddModal, setShowAddModal] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Helper to extract error message from any error type
  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
    return fallback;
  };

  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      setIsLoading(true);
      try {
        const result = await searchContacts(searchQuery);
        setContacts(result.contacts || []);
      } catch (error) {
        console.error("Failed to fetch contacts:", getErrorMessage(error, "Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchContacts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Filter and sort contacts
  const filteredContacts = contacts
    .filter((contact) => {
      // Status filter
      if (statusFilter !== "All" && contact.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Net worth filter
      const netWorth = contact.net_worth || 0;
      if (netWorth < netWorthRange.min || netWorth > netWorthRange.max) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "full_name":
          comparison = (a.full_name || "").localeCompare(b.full_name || "");
          break;
        case "updated_at":
          comparison = new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
          break;
        case "net_worth":
          comparison = (a.net_worth || 0) - (b.net_worth || 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Contacts</h1>
              </div>
              <Badge variant="secondary" className="ml-2">
                {filteredContacts.length}
              </Badge>
            </div>
            <Button onClick={() => setShowAddModal(true)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          </div>
        </div>
      </header>

      {/* Add Contact Modal */}
      <AddContactModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onContactAdded={(newContact) => {
          setContacts((prev) => [newContact, ...prev]);
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, company, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={netWorthRange.label}
              onValueChange={(label) => {
                const range = NET_WORTH_RANGES.find((r) => r.label === label);
                if (range) setNetWorthRange(range);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NET_WORTH_RANGES.map((range) => (
                  <SelectItem key={range.label} value={range.label}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-lg border bg-card p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No contacts found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {contact.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{contact.full_name}</h4>
                      {(contact.title || contact.company) && (
                        <p className="text-sm text-muted-foreground">
                          {contact.title}
                          {contact.title && contact.company && ", "}
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                  {contact.status && (
                    <Badge className={getStatusColor(contact.status)}>
                      {contact.status}
                    </Badge>
                  )}
                </div>

                {contact.net_worth && (
                  <p className="mt-3 text-sm font-medium text-success">
                    Net Worth: {formatNetWorth(contact.net_worth)}
                  </p>
                )}

                {contact.email && (
                  <p className="mt-2 text-sm text-muted-foreground truncate">{contact.email}</p>
                )}

                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {contact.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{contact.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("full_name")}
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("net_worth")}
                    >
                      Net Worth
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <TableCell className="font-medium">{contact.full_name}</TableCell>
                    <TableCell>{contact.company || "—"}</TableCell>
                    <TableCell>
                      {contact.status && (
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-success font-medium">
                      {formatNetWorth(contact.net_worth)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contact.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{contact.phone || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
