import { useState } from "react";
import { Search, Users, CheckSquare, Calendar, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { SlidePanel } from "./SlidePanel";
import { api, Contact } from "@/lib/api";
import { ContactCard } from "./ContactCard";

interface QueryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSelect: (contact: Contact) => void;
}

type FilterType = "contacts" | "tasks" | "appointments" | "files";

export function QueryPanel({ isOpen, onClose, onContactSelect }: QueryPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("contacts");
  const [searchQuery, setSearchQuery] = useState("");
  const [netWorthRange, setNetWorthRange] = useState([0, 50]);
  const [statusFilters, setStatusFilters] = useState({
    lead: true,
    client: true,
    whale: false,
  });
  const [results, setResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const { contacts } = await api.searchContacts(searchQuery || "*");
      // Apply client-side filters
      const filtered = contacts.filter((contact) => {
        // Net worth filter
        const netWorthM = (contact.netWorth || 0) / 1000000;
        if (netWorthM < netWorthRange[0] || netWorthM > netWorthRange[1]) {
          return false;
        }
        // Status filter
        if (contact.status) {
          const status = contact.status.toLowerCase();
          if (status === "lead" && !statusFilters.lead) return false;
          if (status === "client" && !statusFilters.client) return false;
          if (status === "whale" && !statusFilters.whale) return false;
        }
        return true;
      });
      setResults(filtered);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const filterButtons: { type: FilterType; icon: React.ReactNode; label: string }[] = [
    { type: "contacts", icon: <Users className="h-4 w-4" />, label: "Contacts" },
    { type: "tasks", icon: <CheckSquare className="h-4 w-4" />, label: "Tasks" },
    { type: "appointments", icon: <Calendar className="h-4 w-4" />, label: "Appointments" },
    { type: "files", icon: <FolderOpen className="h-4 w-4" />, label: "Files" },
  ];

  return (
    <SlidePanel title="Query Database" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Quick Filters */}
        <div className="space-y-2">
          <Label>Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map(({ type, icon, label }) => (
              <Button
                key={type}
                variant={activeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(type)}
                className="gap-1.5"
              >
                {icon}
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search anything..."
              className="pl-9"
            />
          </div>
        </div>

        {activeFilter === "contacts" && (
          <>
            {/* Net Worth Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Net Worth Filter</Label>
                <span className="text-sm text-muted-foreground">
                  ${netWorthRange[0]}M - ${netWorthRange[1]}M+
                </span>
              </div>
              <Slider
                value={netWorthRange}
                onValueChange={setNetWorthRange}
                min={0}
                max={50}
                step={1}
                className="py-2"
              />
            </div>

            {/* Status Filters */}
            <div className="space-y-3">
              <Label>Status</Label>
              <div className="space-y-2">
                {Object.entries(statusFilters).map(([key, checked]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={checked}
                      onCheckedChange={(value) =>
                        setStatusFilters((prev) => ({
                          ...prev,
                          [key]: !!value,
                        }))
                      }
                    />
                    <label
                      htmlFor={key}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {key}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Run Query Button */}
        <Button onClick={handleSearch} disabled={isSearching} className="w-full" size="lg">
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Run Query
            </>
          )}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <Label>Results ({results.length})</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {results.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    onContactSelect(contact);
                    onClose();
                  }}
                  className="w-full text-left"
                >
                  <ContactCard contact={contact} compact />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}