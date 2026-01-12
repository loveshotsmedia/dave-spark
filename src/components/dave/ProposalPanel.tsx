import { useState } from "react";
import { Search, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidePanel } from "./SlidePanel";
import { api, Contact } from "@/lib/api";
import { ContactCard } from "./ContactCard";

const PROPOSAL_TYPES = [
  "Succession Planning",
  "Estate Planning",
  "Business Valuation",
  "Retirement Strategy",
  "Insurance Review",
  "Wealth Transfer",
];

interface ProposalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContactId?: string;
  onProposalGenerated: (proposal: string, contactName: string) => void;
}

export function ProposalPanel({
  isOpen,
  onClose,
  preselectedContactId,
  onProposalGenerated,
}: ProposalPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [proposalType, setProposalType] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { contacts } = await api.searchContacts(searchQuery);
      setSearchResults(contacts);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedContact || !proposalType) return;

    setIsGenerating(true);
    try {
      const { proposal } = await api.generateProposal(
        selectedContact.id,
        proposalType,
        additionalContext
      );
      onProposalGenerated(proposal, selectedContact.name);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedContact(null);
    setProposalType("");
    setAdditionalContext("");
  };

  return (
    <SlidePanel title="Generate Proposal" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Client Search */}
        <div className="space-y-2">
          <Label>Client</Label>
          {selectedContact ? (
            <div className="space-y-2">
              <ContactCard contact={selectedContact} compact />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContact(null)}
                className="text-muted-foreground"
              >
                Change client
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search contacts..."
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="w-full text-left"
                    >
                      <ContactCard contact={contact} compact />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Proposal Type */}
        <div className="space-y-2">
          <Label>Proposal Type</Label>
          <Select value={proposalType} onValueChange={setProposalType}>
            <SelectTrigger>
              <SelectValue placeholder="Select proposal type" />
            </SelectTrigger>
            <SelectContent>
              {PROPOSAL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional Context */}
        <div className="space-y-2">
          <Label>Additional Context (Optional)</Label>
          <Textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any specific requirements or focus areas..."
            className="min-h-[100px]"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedContact || !proposalType || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Proposal
            </>
          )}
        </Button>
      </div>
    </SlidePanel>
  );
}