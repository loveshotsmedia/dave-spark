import { useState } from "react";
import { Search, FileText, Loader2, BarChart3 } from "lucide-react";
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
import { DiagramRenderer, type Diagram } from "./DiagramRenderer";
import { 
  searchContacts, 
  generateProposal, 
  uploadContent, 
  Contact, 
  getContact,
  generateTimelineDiagram,
  generateSuccessionDiagram,
  generateIFADiagram,
  type DiagramData,
  type ClientFile 
} from "@/lib/api";
import { ContactCard } from "./ContactCard";
import { toast } from "@/hooks/use-toast";
import { PROPOSAL_SYSTEM_PROMPT, cleanProposalContent } from "@/lib/proposalSystemPrompt";

// Helper to detect if client needs succession planning
function detectSuccessionNeeds(clientFile: ClientFile | null, proposalType: string): boolean {
  if (!clientFile) return false;
  
  // Has children data
  if (clientFile.children && clientFile.children.length > 0) return true;
  
  // Planning needs mention succession
  if (clientFile.planning_needs?.some(need => 
    need.toLowerCase().includes('succession') || 
    need.toLowerCase().includes('estate') ||
    need.toLowerCase().includes('transfer')
  )) return true;
  
  // Proposal type is succession-related
  if (['Succession Planning', 'Estate Planning', 'Wealth Transfer'].includes(proposalType)) return true;
  
  return false;
}

// Helper to detect if client needs IFA strategy
function detectIFANeeds(clientFile: ClientFile | null, proposalType: string): boolean {
  if (!clientFile) return false;
  
  // Planning needs mention IFA or retirement
  if (clientFile.planning_needs?.some(need => 
    need.toLowerCase().includes('ifa') || 
    need.toLowerCase().includes('insured') ||
    need.toLowerCase().includes('retirement') ||
    need.toLowerCase().includes('corporate insurance')
  )) return true;
  
  // Has significant business value (potential for corporate insurance strategy)
  if (clientFile.business_value && clientFile.business_value > 1000000) return true;
  
  // Proposal type is IFA-related
  if (['Retirement Strategy', 'Insurance Review'].includes(proposalType)) return true;
  
  return false;
}
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
  onProposalGenerated: (proposal: string, contactName: string, diagrams?: DiagramData[]) => void;
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
      const { contacts } = await searchContacts(searchQuery);
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
      // Get full contact details for proposal context
      const { contact: fullContact, clientFile } = await getContact(selectedContact.id);
      
      // Build client details string
      const clientDetails = [
        fullContact.company && `Company: ${fullContact.company}`,
        fullContact.title && `Title: ${fullContact.title}`,
        clientFile?.business_value && `Business Value: $${clientFile.business_value.toLocaleString()}`,
        clientFile?.acb && `ACB: $${clientFile.acb.toLocaleString()}`,
        clientFile?.planning_needs?.length && `Planning Needs: ${clientFile.planning_needs.join(', ')}`,
        additionalContext && `Additional Context: ${additionalContext}`,
      ].filter(Boolean).join('\n');

      // Map proposal type to API format
      const proposalTypeMap: Record<string, "estate_freeze" | "ifa" | "insurance" | "corporate_restructuring" | "general"> = {
        "Succession Planning": "corporate_restructuring",
        "Estate Planning": "estate_freeze",
        "Business Valuation": "general",
        "Retirement Strategy": "ifa",
        "Insurance Review": "insurance",
        "Wealth Transfer": "estate_freeze",
      };

      // Use the proper generateProposal API endpoint with canonical structure
      const result = await generateProposal({
        contactId: selectedContact.id,
        clientName: selectedContact.full_name,
        clientDetails: clientDetails || `Contact for ${proposalType}`,
        proposalType: proposalTypeMap[proposalType] || "general",
        additionalContext,
        systemPrompt: PROPOSAL_SYSTEM_PROMPT,
      });

      // Clean the proposal content to remove any forbidden technical content
      const cleanedProposal = cleanProposalContent(result.proposal);

      // Generate diagrams based on client data
      const diagrams: DiagramData[] = result.diagrams || [];
      
      // Auto-detect and generate succession diagram if needed
      if (detectSuccessionNeeds(clientFile, proposalType)) {
        try {
          const children = clientFile?.children?.map(child => ({
            name: child.name,
            inBusiness: child.in_business,
            sharePercent: child.in_business ? Math.floor(100 / (clientFile.children?.filter(c => c.in_business).length || 1)) : undefined
          })) || [];
          
          // If no children data, create placeholder based on proposal context
          const childrenData = children.length > 0 ? children : [
            { name: 'Child 1', inBusiness: true, sharePercent: 50 },
            { name: 'Child 2', inBusiness: false }
          ];
          
          const successionDiagram = await generateSuccessionDiagram({
            parentNames: [fullContact.full_name],
            children: childrenData,
            companyName: clientFile?.business_name || fullContact.company || 'Operating Company',
            freezeValue: clientFile?.business_value
          });
          diagrams.push(successionDiagram);
        } catch (error) {
          console.error('Failed to generate succession diagram:', error);
        }
      }
      
      // Auto-detect and generate IFA diagram if needed
      if (detectIFANeeds(clientFile, proposalType)) {
        try {
          const ifaDiagram = await generateIFADiagram({
            corporationName: clientFile?.business_name || fullContact.company || 'HoldCo',
            policyValue: clientFile?.business_value ? Math.round(clientFile.business_value * 0.5) : 5000000,
            annualBorrowing: 200000,
            years: 20
          });
          diagrams.push(ifaDiagram);
        } catch (error) {
          console.error('Failed to generate IFA diagram:', error);
        }
      }

      // Always generate implementation timeline
      try {
        const timelineDiagram = await generateTimelineDiagram({
          phases: [
            {
              name: 'Phase 1 - Structuring & Review',
              duration: '2 weeks',
              tasks: ['USA review', 'Tax coordination', 'Legal documentation']
            },
            {
              name: 'Phase 2 - Insurance & Underwriting',
              duration: '6 weeks',
              tasks: ['Medical examinations', 'Policy placement', 'Coverage approval']
            },
            {
              name: 'Phase 3 - Implementation',
              duration: '4 weeks',
              tasks: ['Corporate restructuring', 'Share exchange', 'Policy funding']
            },
            {
              name: 'Phase 4 - Ongoing Management',
              duration: 'Annual',
              tasks: ['Annual valuation review', 'Tax planning updates', 'Beneficiary review']
            }
          ]
        });
        diagrams.push(timelineDiagram);
      } catch (error) {
        console.error('Failed to generate timeline diagram:', error);
      }

      // Save proposal to content library for future reference
      await uploadContent({
        title: `${proposalType} Proposal - ${selectedContact.full_name}`,
        content_type: "proposal",
        description: `Generated ${proposalType} proposal for ${selectedContact.full_name} on ${new Date().toLocaleDateString()}`,
        tags: [proposalType.toLowerCase().replace(/ /g, '_'), 'proposal', 'generated'],
        topic_keywords: [proposalType.toLowerCase()],
        audience: "client",
        file_content: cleanedProposal, // Store the cleaned proposal text
      });

      toast({
        title: "Proposal saved",
        description: `Proposal saved to Content Library for ${selectedContact.full_name}`,
      });

      onProposalGenerated(cleanedProposal, selectedContact.full_name, diagrams);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate proposal",
        variant: "destructive",
      });
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