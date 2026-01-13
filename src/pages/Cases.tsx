import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/dave/Header";
import {
  listCases,
  getCase,
  createCase,
  recordDecision,
  listDecisions,
  finalizeDecision,
  createTrustBuilderShare,
  listContacts,
  CaseFile,
  AdvisorDecision,
  Contact,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Briefcase,
  FileText,
  Eye,
  Scale,
  Link2,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Gavel,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

// Case type colors
const CASE_TYPE_COLORS: Record<string, string> = {
  estate_planning: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  corporate_restructuring: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  insurance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  investment: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  succession: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  tax_planning: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  general: "bg-muted text-muted-foreground",
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending_decision: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-muted/50 text-muted-foreground",
};

// Priority styles
const PRIORITY_STYLES: Record<string, string> = {
  urgent: "border-l-4 border-l-red-500",
  high: "border-l-4 border-l-orange-500",
  normal: "border-l-4 border-l-blue-500",
  low: "border-l-4 border-l-gray-300",
};

const CASE_TYPE_OPTIONS = [
  { value: "estate_planning", label: "Estate Planning" },
  { value: "corporate_restructuring", label: "Corporate Restructuring" },
  { value: "insurance", label: "Insurance" },
  { value: "investment", label: "Investment" },
  { value: "succession", label: "Succession" },
  { value: "tax_planning", label: "Tax Planning" },
  { value: "general", label: "General" },
];

const DECISION_TYPE_OPTIONS = [
  { value: "strategy_selection", label: "Strategy Selection" },
  { value: "risk_acknowledgment", label: "Risk Acknowledgment" },
  { value: "recommendation", label: "Recommendation" },
  { value: "client_direction", label: "Client Direction" },
  { value: "compliance_check", label: "Compliance Check" },
];

const DECISION_CATEGORY_OPTIONS = [
  { value: "insurance", label: "Insurance" },
  { value: "investment", label: "Investment" },
  { value: "tax", label: "Tax" },
  { value: "estate", label: "Estate" },
  { value: "corporate", label: "Corporate" },
];

const CONFIDENCE_LEVELS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function Cases() {
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [caseDecisions, setCaseDecisions] = useState<AdvisorDecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState(false);
  const [isRecordDecisionOpen, setIsRecordDecisionOpen] = useState(false);
  const [isTrustBuilderOpen, setIsTrustBuilderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const [finalizeConfirm, setFinalizeConfirm] = useState<AdvisorDecision | null>(null);

  // Create case form
  const [newCaseContactId, setNewCaseContactId] = useState("");
  const [newCaseName, setNewCaseName] = useState("");
  const [newCaseType, setNewCaseType] = useState("general");
  const [newCaseClientIntent, setNewCaseClientIntent] = useState("");
  const [newCaseAdvisorIntent, setNewCaseAdvisorIntent] = useState("");
  const [newCasePriority, setNewCasePriority] = useState("normal");
  const [newCaseValue, setNewCaseValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Record decision form
  const [decisionType, setDecisionType] = useState("strategy_selection");
  const [decisionCategory, setDecisionCategory] = useState("tax");
  const [decisionTitle, setDecisionTitle] = useState("");
  const [strategyChosen, setStrategyChosen] = useState("");
  const [rationale, setRationale] = useState("");
  const [alternatives, setAlternatives] = useState<Array<{ strategy: string; pros: string; cons: string; reasonNotChosen: string }>>([]);
  const [risksAcknowledged, setRisksAcknowledged] = useState("");
  const [riskMitigation, setRiskMitigation] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("medium");
  const [gaarReviewed, setGaarReviewed] = useState(false);
  const [gaarNotes, setGaarNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Trust builder
  const [shareUrl, setShareUrl] = useState("");
  const [showCaseSummary, setShowCaseSummary] = useState(true);
  const [showStrategies, setShowStrategies] = useState(true);
  const [showDecisions, setShowDecisions] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    loadCases();
    loadContacts();
  }, []);

  // Helper to extract error message from any error type
  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
    return fallback;
  };

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const result = await listCases();
      setCases(result.cases || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load cases"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const result = await listContacts();
      setContacts(result || []);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      const [caseResult, decisionsResult] = await Promise.all([
        getCase(caseId),
        listDecisions({ caseId }),
      ]);
      setSelectedCase(caseResult.caseFile);
      setCaseDecisions(decisionsResult.decisions || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load case details"));
    }
  };

  const handleOpenCase = async (caseFile: CaseFile) => {
    setSelectedCase(caseFile);
    setIsCaseDetailOpen(true);
    setActiveTab("overview");
    await loadCaseDetails(caseFile.id);
  };

  const handleCreateCase = async () => {
    if (!newCaseContactId || !newCaseName) {
      toast.error("Contact and case name are required");
      return;
    }

    setIsCreating(true);
    try {
      await createCase({
        contactId: newCaseContactId,
        caseName: newCaseName,
        caseType: newCaseType,
        clientIntent: newCaseClientIntent,
        advisorIntent: newCaseAdvisorIntent,
        priority: newCasePriority,
        estimatedValue: newCaseValue ? parseFloat(newCaseValue) : undefined,
      });
      toast.success("Case created successfully");
      setIsCreateDialogOpen(false);
      resetCreateForm();
      loadCases();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create case"));
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewCaseContactId("");
    setNewCaseName("");
    setNewCaseType("general");
    setNewCaseClientIntent("");
    setNewCaseAdvisorIntent("");
    setNewCasePriority("normal");
    setNewCaseValue("");
  };

  const handleRecordDecision = async () => {
    if (!selectedCase) return;
    if (!decisionTitle || !strategyChosen || !rationale) {
      toast.error("Title, strategy, and rationale are required");
      return;
    }

    setIsRecording(true);
    try {
      await recordDecision({
        caseId: selectedCase.id,
        decisionType,
        decisionCategory,
        decisionTitle,
        strategyChosen,
        rationale,
        alternativesConsidered: alternatives.filter((a) => a.strategy).map((a) => ({
          strategy: a.strategy,
          pros: a.pros.split(",").map((p) => p.trim()).filter(Boolean),
          cons: a.cons.split(",").map((c) => c.trim()).filter(Boolean),
          reasonNotChosen: a.reasonNotChosen,
        })),
        risksAcknowledged: risksAcknowledged.split(",").map((r) => r.trim()).filter(Boolean),
        riskMitigation,
        confidenceLevel,
        gaarReviewed,
        gaarNotes: gaarReviewed ? gaarNotes : undefined,
      });
      toast.success("Decision recorded successfully");
      setIsRecordDecisionOpen(false);
      resetDecisionForm();
      await loadCaseDetails(selectedCase.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to record decision"));
    } finally {
      setIsRecording(false);
    }
  };

  const resetDecisionForm = () => {
    setDecisionType("strategy_selection");
    setDecisionCategory("tax");
    setDecisionTitle("");
    setStrategyChosen("");
    setRationale("");
    setAlternatives([]);
    setRisksAcknowledged("");
    setRiskMitigation("");
    setConfidenceLevel("medium");
    setGaarReviewed(false);
    setGaarNotes("");
  };

  const handleFinalizeDecision = async () => {
    if (!finalizeConfirm) return;

    try {
      await finalizeDecision(finalizeConfirm.id);
      toast.success("Decision finalized");
      setFinalizeConfirm(null);
      if (selectedCase) {
        await loadCaseDetails(selectedCase.id);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to finalize decision"));
    }
  };

  const handleGenerateShareLink = async () => {
    if (!selectedCase) return;

    setIsGeneratingShare(true);
    try {
      const result = await createTrustBuilderShare(selectedCase.id, {
        showCaseSummary,
        showStrategies,
        showDecisions,
        welcomeMessage: welcomeMessage || undefined,
      });
      setShareUrl(result.shareUrl);
      toast.success("Share link generated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to generate share link"));
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const addAlternative = () => {
    setAlternatives([...alternatives, { strategy: "", pros: "", cons: "", reasonNotChosen: "" }]);
  };

  const updateAlternative = (index: number, field: string, value: string) => {
    const updated = [...alternatives];
    updated[index] = { ...updated[index], [field]: value };
    setAlternatives(updated);
  };

  const removeAlternative = (index: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== index));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header onLogout={handleLogout} onSettingsClick={() => {}} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-primary" />
                Case Files
              </h1>
              <p className="text-muted-foreground mt-1">
                Client cases and advisor judgment records
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </div>

          {/* Case Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cases.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No case files yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a case file to track client planning and record your decisions
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((caseFile) => (
                <Card
                  key={caseFile.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${PRIORITY_STYLES[caseFile.priority] || ""}`}
                  onClick={() => handleOpenCase(caseFile)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={CASE_TYPE_COLORS[caseFile.case_type] || CASE_TYPE_COLORS.general}>
                        {caseFile.case_type.replace("_", " ")}
                      </Badge>
                      <Badge className={STATUS_COLORS[caseFile.status] || STATUS_COLORS.active}>
                        {caseFile.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {caseFile.case_number}
                    </div>
                    <CardTitle className="text-base leading-tight">{caseFile.case_name}</CardTitle>
                    <CardDescription>
                      {caseFile.contact?.first_name} {caseFile.contact?.last_name}
                      {caseFile.contact?.company && ` • ${caseFile.contact.company}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {caseFile.client_intent && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {caseFile.client_intent}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {caseFile.estimated_value && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {(caseFile.estimated_value / 1000000).toFixed(1)}M
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Gavel className="h-3 w-3" />
                          {caseFile.decisions?.length || 0} decisions
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(caseFile.updated_at), "MMM d")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Case Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
            <DialogDescription>
              Open a new case file for a client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={newCaseContactId} onValueChange={setNewCaseContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
              <SelectContent>
                  {contacts
                    .filter((contact) => contact.id && contact.id.trim() !== "")
                    .map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.full_name}
                        {contact.company && ` (${contact.company})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Case Name *</Label>
              <Input
                placeholder="e.g., Smith Family Estate Freeze"
                value={newCaseName}
                onChange={(e) => setNewCaseName(e.target.value)}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Case Type</Label>
                <Select value={newCaseType} onValueChange={setNewCaseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newCasePriority} onValueChange={setNewCasePriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client Intent</Label>
              <Textarea
                placeholder="What does the client want to achieve?"
                value={newCaseClientIntent}
                onChange={(e) => setNewCaseClientIntent(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Advisor Intent</Label>
              <Textarea
                placeholder="What is the planning objective from your perspective?"
                value={newCaseAdvisorIntent}
                onChange={(e) => setNewCaseAdvisorIntent(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Value ($)</Label>
              <Input
                type="number"
                placeholder="e.g., 5000000"
                value={newCaseValue}
                onChange={(e) => setNewCaseValue(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCase} disabled={isCreating || !newCaseContactId || !newCaseName}>
              {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case Detail Dialog */}
      <Dialog open={isCaseDetailOpen} onOpenChange={setIsCaseDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={CASE_TYPE_COLORS[selectedCase?.case_type || "general"]}>
                {selectedCase?.case_type?.replace("_", " ")}
              </Badge>
              <Badge className={STATUS_COLORS[selectedCase?.status || "active"]}>
                {selectedCase?.status?.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedCase?.case_number}
              </span>
            </div>
            <DialogTitle>{selectedCase?.case_name}</DialogTitle>
            <DialogDescription>
              {selectedCase?.contact?.first_name} {selectedCase?.contact?.last_name}
              {selectedCase?.contact?.company && ` • ${selectedCase.contact.company}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="decisions">
                Decisions ({caseDecisions.length})
              </TabsTrigger>
              <TabsTrigger value="trust-builder">Trust Builder</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Client Intent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedCase?.client_intent || "Not specified"}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Advisor Intent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedCase?.advisor_intent || "Not specified"}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-lg font-bold">
                            ${((selectedCase?.estimated_value || 0) / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-xs text-muted-foreground">Estimated Value</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Gavel className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-lg font-bold">{caseDecisions.length}</p>
                          <p className="text-xs text-muted-foreground">Decisions Recorded</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-lg font-bold">
                            {selectedCase?.updated_at
                              ? format(new Date(selectedCase.updated_at), "MMM d")
                              : "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="strategies" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Included Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(selectedCase?.strategies_included || []).length > 0 ? (
                      <ul className="space-y-2">
                        {(selectedCase?.strategies_included as unknown[]).map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-sm">{String(s)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No strategies included yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Excluded Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(selectedCase?.strategies_excluded || []).length > 0 ? (
                      <ul className="space-y-2">
                        {(selectedCase?.strategies_excluded as unknown[]).map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <X className="h-4 w-4 text-red-500 mt-0.5" />
                            <span className="text-sm">{String(s)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No strategies excluded</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="decisions" className="mt-0 space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setIsRecordDecisionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Decision
                  </Button>
                </div>

                {caseDecisions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <Gavel className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No decisions recorded yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsRecordDecisionOpen(true)}>
                        Record First Decision
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {caseDecisions.map((decision) => (
                      <Card key={decision.id}>
                        <CardHeader
                          className="pb-2 cursor-pointer"
                          onClick={() => setExpandedDecision(expandedDecision === decision.id ? null : decision.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">
                                  {decision.decision_number}
                                </span>
                                <Badge variant="outline">{decision.decision_type.replace("_", " ")}</Badge>
                                {decision.status === "finalized" && (
                                  <Badge className="bg-green-100 text-green-800">Finalized</Badge>
                                )}
                              </div>
                              <CardTitle className="text-base">{decision.decision_title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              {expandedDecision === decision.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <CardDescription className="mt-1">{decision.strategy_chosen}</CardDescription>
                        </CardHeader>

                        {expandedDecision === decision.id && (
                          <CardContent className="space-y-4 pt-0">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Rationale</h4>
                              <p className="text-sm text-muted-foreground">{decision.rationale}</p>
                            </div>

                            {decision.alternatives_considered?.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Alternatives Considered</h4>
                                <div className="space-y-2">
                                  {decision.alternatives_considered.map((alt, i) => (
                                    <div key={i} className="p-2 bg-muted rounded-lg text-sm">
                                      <p className="font-medium">{alt.strategy}</p>
                                      <p className="text-muted-foreground text-xs mt-1">
                                        Not chosen: {alt.reason_not_chosen}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {decision.risks_acknowledged?.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  Risks Acknowledged
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {decision.risks_acknowledged.map((risk, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {risk}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {decision.gaar_reviewed && (
                              <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                                <h4 className="text-sm font-medium flex items-center gap-1 text-red-800 dark:text-red-200">
                                  <Scale className="h-4 w-4" />
                                  GAAR Reviewed
                                </h4>
                                {decision.gaar_notes && (
                                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    {decision.gaar_notes}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                Recorded {format(new Date(decision.decided_at), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                              {decision.status !== "finalized" && (
                                <Button variant="outline" size="sm" onClick={() => setFinalizeConfirm(decision)}>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Finalize
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trust-builder" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="h-5 w-5" />
                      Generate Client Share Link
                    </CardTitle>
                    <CardDescription>
                      Create a secure link for your client to view their case summary
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="showSummary"
                          checked={showCaseSummary}
                          onCheckedChange={(checked) => setShowCaseSummary(checked as boolean)}
                        />
                        <Label htmlFor="showSummary">Show case summary</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="showStrategies"
                          checked={showStrategies}
                          onCheckedChange={(checked) => setShowStrategies(checked as boolean)}
                        />
                        <Label htmlFor="showStrategies">Show strategies</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="showDecisions"
                          checked={showDecisions}
                          onCheckedChange={(checked) => setShowDecisions(checked as boolean)}
                        />
                        <Label htmlFor="showDecisions">Show decisions (advisor use)</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Welcome Message (optional)</Label>
                      <Textarea
                        placeholder="Hi [Client Name], I've prepared a summary of our planning discussion..."
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button onClick={handleGenerateShareLink} disabled={isGeneratingShare} className="w-full">
                      {isGeneratingShare ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      Generate Share Link
                    </Button>

                    {shareUrl && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="text-sm font-medium">Share Link Generated:</p>
                        <div className="flex gap-2">
                          <Input value={shareUrl} readOnly className="font-mono text-xs" />
                          <Button variant="outline" size="icon" onClick={copyShareUrl}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Record Decision Dialog */}
      <Dialog open={isRecordDecisionOpen} onOpenChange={setIsRecordDecisionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Record Decision
            </DialogTitle>
            <DialogDescription>
              Capture your professional judgment for {selectedCase?.case_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Decision Title *</Label>
              <Input
                placeholder="e.g., Proceed with Section 86 Estate Freeze"
                value={decisionTitle}
                onChange={(e) => setDecisionTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Decision Type</Label>
                <Select value={decisionType} onValueChange={setDecisionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={decisionCategory} onValueChange={setDecisionCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Strategy Chosen *</Label>
              <Textarea
                placeholder="Describe the strategy or approach that was decided upon..."
                value={strategyChosen}
                onChange={(e) => setStrategyChosen(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Rationale * (Why was this chosen?)</Label>
              <Textarea
                placeholder="Explain why this strategy was selected over others. This is critical for defensibility."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Alternatives Considered</Label>
                <Button variant="outline" size="sm" onClick={addAlternative}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Alternative
                </Button>
              </div>

              {alternatives.map((alt, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Alternative {index + 1}</Label>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAlternative(index)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Alternative strategy name"
                      value={alt.strategy}
                      onChange={(e) => updateAlternative(index, "strategy", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Pros (comma-separated)"
                        value={alt.pros}
                        onChange={(e) => updateAlternative(index, "pros", e.target.value)}
                      />
                      <Input
                        placeholder="Cons (comma-separated)"
                        value={alt.cons}
                        onChange={(e) => updateAlternative(index, "cons", e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Reason not chosen"
                      value={alt.reasonNotChosen}
                      onChange={(e) => updateAlternative(index, "reasonNotChosen", e.target.value)}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Risks Acknowledged (comma-separated)</Label>
              <Input
                placeholder="e.g., market risk, timing risk, regulatory risk"
                value={risksAcknowledged}
                onChange={(e) => setRisksAcknowledged(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Risk Mitigation</Label>
              <Textarea
                placeholder="How will the identified risks be addressed?"
                value={riskMitigation}
                onChange={(e) => setRiskMitigation(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCE_LEVELS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="gaarReviewed"
                  checked={gaarReviewed}
                  onCheckedChange={(checked) => setGaarReviewed(checked as boolean)}
                />
                <Label htmlFor="gaarReviewed" className="font-medium flex items-center gap-1">
                  <Scale className="h-4 w-4" />
                  Reviewed for GAAR Compliance
                </Label>
              </div>

              {gaarReviewed && (
                <Textarea
                  placeholder="Document your GAAR analysis and any concerns..."
                  value={gaarNotes}
                  onChange={(e) => setGaarNotes(e.target.value)}
                  rows={3}
                  className="bg-background"
                />
              )}
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordDecisionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordDecision}
              disabled={isRecording || !decisionTitle || !strategyChosen || !rationale}
            >
              {isRecording ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Record Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize Confirmation Dialog */}
      <AlertDialog open={!!finalizeConfirm} onOpenChange={() => setFinalizeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Finalize Decision
            </AlertDialogTitle>
            <AlertDialogDescription>
              Finalizing a decision is permanent and cannot be undone. This marks the decision as
              officially recorded and locks it from further edits.
              <br />
              <br />
              Are you sure you want to finalize "{finalizeConfirm?.decision_title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizeDecision}>Finalize Decision</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
