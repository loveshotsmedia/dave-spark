// Dave 2.0 API Client for Lovable Frontend
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path for PDF.js using the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DAVE_API_URL = "https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api";
const AUTH_HEADER = "I love Cameron";

// Public anon key for the dave-api backend (safe to ship in the frontend)
const DAVE_API_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljb3BxZm9oYnJkc2RxZ3BhamR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTcxNzAsImV4cCI6MjA1MzIzMzE3MH0.2SjkOJF5_1TkKBBJ3cWToMB1LhPHVOMfjBuQigRlDKE";

async function daveAPI<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  } = {}
): Promise<T> {
  const response = await fetch(`${DAVE_API_URL}/${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",

      // Required by the edge-function gateway (prevents: "Missing authorization header")
      apikey: DAVE_API_ANON_KEY,
      Authorization: `Bearer ${DAVE_API_ANON_KEY}`,

      // Existing custom auth used by your dave-api function
      "x-owner-auth": AUTH_HEADER,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" as string }));

    throw new Error(error.error || error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// ========== PDF EXTRACTION ==========
export type ExtractionProgress = {
  stage: 'extracting' | 'uploading' | 'complete';
  fileName: string;
  currentPage?: number;
  totalPages?: number;
  fileIndex: number;
  totalFiles: number;
};

async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: unknown) => (item as { str: string }).str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

// ========== CHAT TYPES ==========
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatFile {
  name: string;
  type: string;
  content: string; // base64 encoded or extracted text
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: string;
  contactId?: string;
  files?: ChatFile[];
}

export interface ChatResponse {
  response: string;
  thinking?: string;
  context?: string;
}

// ========== CHAT ==========
export async function chat(
  message: string,
  files?: File[],
  onProgress?: (progress: ExtractionProgress) => void,
  conversationHistory?: ChatMessage[],
  onStream?: (chunk: string) => void
): Promise<{ response: string; context?: string; thinking?: string; documentsUploaded?: number }> {
  let documentsUploaded = 0;
  const processedFiles: ChatFile[] = [];

  if (files && files.length > 0) {
    const pdfFiles = files.filter(f => f.type === 'application/pdf');

    for (let fileIdx = 0; fileIdx < pdfFiles.length; fileIdx++) {
      const file = pdfFiles[fileIdx];

      onProgress?.({
        stage: 'extracting',
        fileName: file.name,
        currentPage: 0,
        totalPages: 0,
        fileIndex: fileIdx + 1,
        totalFiles: pdfFiles.length,
      });

      const content = await extractTextFromPDF(file, (currentPage, totalPages) => {
        onProgress?.({
          stage: 'extracting',
          fileName: file.name,
          currentPage,
          totalPages,
          fileIndex: fileIdx + 1,
          totalFiles: pdfFiles.length,
        });
      });

      onProgress?.({
        stage: 'uploading',
        fileName: file.name,
        fileIndex: fileIdx + 1,
        totalFiles: pdfFiles.length,
      });

      await uploadKnowledge({
        title: file.name.replace('.pdf', ''),
        content,
        sourceType: 'file',
        fileName: file.name,
        fileType: file.type,
        tags: ['uploaded', 'document'],
      });
      
      processedFiles.push({
        name: file.name,
        type: file.type,
        content: content.substring(0, 5000),
      });
      
      documentsUploaded++;
    }

    onProgress?.({
      stage: 'complete',
      fileName: '',
      fileIndex: pdfFiles.length,
      totalFiles: pdfFiles.length,
    });
  }

  // Build messages with conversation history
  let messages: ChatMessage[];
  if (conversationHistory && conversationHistory.length > 0) {
    messages = [
      ...conversationHistory.filter(m => m.content.trim() !== "" && !m.content.includes("Good morning, Dave")),
      { role: "user", content: message }
    ];
  } else {
    messages = [{ role: "user", content: message }];
  }

  if (documentsUploaded > 0) {
    const fileNames = files!.filter(f => f.type === 'application/pdf').map(f => f.name).join(', ');
    messages[messages.length - 1].content = `I just uploaded "${fileNames}". ${message}`;
  }

  // Try streaming if callback provided
  if (onStream) {
    try {
      const streamResponse = await fetch(`${DAVE_API_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": DAVE_API_ANON_KEY,
          "Authorization": `Bearer ${DAVE_API_ANON_KEY}`,
          "x-owner-auth": AUTH_HEADER,
        },
        body: JSON.stringify({
          messages,
          files: processedFiles.length > 0 ? processedFiles : undefined,
        }),
      });

      if (streamResponse.ok && streamResponse.body) {
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'text' && parsed.content) {
                  onStream(parsed.content);
                  fullResponse += parsed.content;
                } else if (parsed.type === 'done' && parsed.fullResponse) {
                  fullResponse = parsed.fullResponse;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        return { response: fullResponse, documentsUploaded };
      }
    } catch (streamError) {
      console.warn('Streaming failed, falling back to regular endpoint:', streamError);
    }
  }

  // Fallback to regular endpoint
  const response = await daveAPI<ChatResponse>("chat", {
    method: "POST",
    body: {
      messages,
      files: processedFiles.length > 0 ? processedFiles : undefined,
    },
  });

  return { ...response, documentsUploaded };
}

// Chat with full message history support
export async function chatWithHistory(request: ChatRequest): Promise<ChatResponse> {
  return daveAPI<ChatResponse>("chat", {
    method: "POST",
    body: request,
  });
}

// ========== CONTACTS ==========
export interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: string;
  net_worth?: number;
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Booking fields
  booking_status?: 'not_sent' | 'link_sent' | 'booked' | 'completed' | 'cancelled';
  booking_link_sent_at?: string;
  booking_scheduled_at?: string;
  booking_completed_at?: string;
  booking_notes?: string;
}

export async function searchContacts(query: string): Promise<{ contacts: Contact[] }> {
  return daveAPI("contacts/search", {
    method: "POST",
    body: { query },
  });
}

// Client file interface for detailed financial data
export interface ClientFile {
  id: string;
  contact_id: string;
  business_name?: string;
  business_value?: number;
  acb?: number;
  planning_needs?: string[];
  children?: Array<{
    name: string;
    age: number;
    in_business: boolean;
  }>;
  existing_policies?: Array<{
    type: string;
    face_amount: number;
    carrier: string;
  }>;
  coi_accountant?: string;
  coi_lawyer?: string;
  notes?: string;
  updated_at?: string;
}

// Conversation interface for communication history
export interface Conversation {
  id: string;
  contact_id: string;
  channel: "sms" | "email" | "voice" | "in_person";
  direction: "inbound" | "outbound";
  transcript: string;
  outcome?: string;
  created_at: string;
}

export async function getContact(id: string): Promise<{ contact: Contact; clientFile: ClientFile | null }> {
  return daveAPI("contacts/get", {
    method: "POST",
    body: { id },
  });
}

export async function createContact(data: Partial<Contact>): Promise<{ success: boolean; contact: Contact }> {
  return daveAPI("contacts/create", {
    method: "POST",
    body: data,
  });
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<{ success: boolean; contact?: Contact }> {
  return daveAPI("contacts/update", {
    method: "POST",
    body: { id, ...data },
  });
}

export async function updateClientFile(contactId: string, data: Partial<ClientFile>): Promise<{ success: boolean; clientFile?: ClientFile }> {
  return daveAPI("contacts/update-file", {
    method: "POST",
    body: { contactId, ...data },
  });
}

export async function getConversations(contactId: string, limit?: number): Promise<{ conversations: Conversation[] }> {
  return daveAPI("contact/conversations", {
    method: "POST",
    body: { contactId, limit: limit || 20 },
  });
}

export async function quickAddContact(description: string): Promise<{ success: boolean; contact?: Contact; message: string }> {
  return daveAPI("quick-add", {
    method: "POST",
    body: { description },
  });
}

// ========== APPOINTMENTS ==========
export interface Appointment {
  id: string;
  title?: string;
  contact_id?: string;
  scheduled_at?: string;  // Some places use this
  start_time?: string;    // Some places use this
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  notes?: string;
  status?: string;
  contacts?: { full_name: string; email?: string; phone?: string };
}

export async function getAppointments(options?: {
  contactId?: string;
  upcoming?: boolean;
  limit?: number;
}): Promise<{ appointments: Appointment[] }> {
  return daveAPI("appointments", {
    method: "POST",
    body: options || {},
  });
}

// ========== TASKS ==========
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  due_date?: string;
  contact_id?: string;
  contacts?: { full_name: string };
}

export async function getTasks(options?: {
  status?: string;
  contactId?: string;
  limit?: number;
}): Promise<{ tasks: Task[] }> {
  return daveAPI("tasks", {
    method: "POST",
    body: options || {},
  });
}

// ========== FINANCIAL CALCULATIONS ==========
export interface EstateFreezeRequest {
  businessValue: number;
  acb: number;
  ownerAge: number;
  growthRate?: number;
  province?: "ontario" | "manitoba" | "alberta" | "bc";
}

export interface EstateFreezeResult {
  currentValue: number;
  acb: number;
  unrealizedGain: number;
  estimatedTaxOnDeath: number;
  preferredShareValue: number;
  commonShareGrowthPotential: string;
  taxDeferralBenefit: number;
  lcgeAvailable: number;
  lcgeApplied: number;
  netTaxableGain: number;
  recommendation: string;
}

export interface IFARequest {
  annualDistribution: number;
  years: number;
  interestRate?: number;
  initialLoan?: number;
}

export interface IFAResult {
  initialLoanAmount: number;
  annualDistribution: number;
  interestRate: number;
  years: number;
  projectedLoanBalance: number;
  totalInterestPaid: number;
  requiredDeathBenefit: number;
  netToEstate: number;
  yearByYear: Array<{
    year: number;
    distribution: number;
    interest: number;
    loanBalance: number;
  }>;
}

export interface TaxCalculationRequest {
  income: number;
  province?: "ontario" | "manitoba" | "alberta" | "bc";
}

export interface TaxCalculationResult {
  federalRate: number;
  provincialRate: number;
  combinedRate: number;
  taxOnIncome: number;
}

export interface EstateEqualizationRequest {
  businessValue: number;
  totalChildren: number;
  childrenInBusiness: number;
  otherAssets?: number;
  ifaLoanBalance?: number;
}

export interface EstateEqualizationResult {
  businessValue: number;
  totalChildren: number;
  childrenInBusiness: number;
  childrenOutsideBusiness: number;
  totalEstateValue: number;
  equalSharePerChild: number;
  businessChildrenReceive: number;
  nonBusinessChildrenNeed: number;
  insuranceRequired: number;
  recommendation: string;
}

export async function calculateEstateFreeze(request: EstateFreezeRequest): Promise<EstateFreezeResult> {
  return daveAPI<EstateFreezeResult>("calculate/estate-freeze", {
    method: "POST",
    body: request,
  });
}

export async function calculateIFA(request: IFARequest): Promise<IFAResult> {
  return daveAPI<IFAResult>("calculate/ifa", {
    method: "POST",
    body: request,
  });
}

export async function calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
  return daveAPI<TaxCalculationResult>("calculate/tax", {
    method: "POST",
    body: request,
  });
}

export async function calculateEqualization(request: EstateEqualizationRequest): Promise<EstateEqualizationResult> {
  return daveAPI<EstateEqualizationResult>("calculate/equalization", {
    method: "POST",
    body: request,
  });
}

// ========== GAAR ANALYSIS ==========
export interface GAARCase {
  name: string;
  citation: string;
  year: number;
  principle: string;
  key_quote?: string;
  outcome: string;
  relevance: string[];
}

export interface GAARAnalysisResult {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  triggeredRedFlags: string[];
  relevantCases: Array<{
    name: string;
    citation: string;
    relevance: string;
  }>;
  itaSections: Array<{
    section: string;
    title: string;
    relevance: string;
  }>;
  recommendations: string[];
  safeHarbors: string[];
}

export async function analyzeGAAR(scenario: string): Promise<GAARAnalysisResult> {
  return daveAPI<GAARAnalysisResult>("gaar/analyze", {
    method: "POST",
    body: { scenario },
  });
}

export async function getGAARCases(): Promise<{ cases: GAARCase[] }> {
  return daveAPI<{ cases: GAARCase[] }>("gaar/cases");
}

export async function getITASections(): Promise<{ sections: Record<string, unknown> }> {
  return daveAPI<{ sections: Record<string, unknown> }>("gaar/sections");
}

// ========== EMAIL ==========
export interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(request: EmailRequest): Promise<EmailResult> {
  return daveAPI<EmailResult>("email/send", {
    method: "POST",
    body: request,
  });
}

// ========== PROPOSALS ==========
export interface ProposalRequest {
  contactId?: string;
  clientName: string;
  clientDetails: string;
  proposalType: "estate_freeze" | "ifa" | "insurance" | "corporate_restructuring" | "general";
  templateId?: string;
  additionalContext?: string;
  sendEmail?: boolean;
  emailTo?: string;
  systemPrompt?: string; // Canonical structure prompt
}

export interface DiagramData {
  type: string;
  format: 'mermaid' | 'html' | 'chartjs' | 'svg';
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface ProposalResult {
  proposal: string;
  calculations?: unknown;
  gaarAnalysis?: GAARAnalysisResult;
  diagrams?: DiagramData[];
  emailSent?: boolean;
  emailId?: string;
}

export async function generateProposal(request: ProposalRequest): Promise<ProposalResult> {
  return daveAPI<ProposalResult>("proposal/generate", {
    method: "POST",
    body: request,
  });
}

// ========== KNOWLEDGE BASE ==========
export interface KnowledgeEntry {
  id: string;
  title: string;
  source_type: string;
  file_name?: string;
  file_type?: string;
  content_text?: string;
  content_summary?: string;
  category: string[];
  tags: string[];
  client_specific: boolean;
  related_contact_id?: string;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeUploadRequest {
  title: string;
  content: string;
  sourceType?: "file" | "article" | "proposal_template" | "regulation" | "case_study" | "client_communication" | "manual_entry";
  fileName?: string;
  fileType?: string;
  tags?: string[];
  isTemplate?: boolean;
}

export async function uploadKnowledge(request: KnowledgeUploadRequest): Promise<{ success: boolean; id?: string; message?: string }> {
  return daveAPI("knowledge/upload", {
    method: "POST",
    body: request,
  });
}

export async function listKnowledge(options?: {
  category?: string;
  sourceType?: string;
  limit?: number;
}): Promise<{ entries: KnowledgeEntry[] }> {
  return daveAPI("knowledge/list", {
    method: "POST",
    body: options || {},
  });
}

export async function searchKnowledge(query: string, limit?: number): Promise<{ results: KnowledgeEntry[] }> {
  return daveAPI("knowledge/search", {
    method: "POST",
    body: { query, limit: limit || 5 },
  });
}

export async function bulkImportKnowledge(entries: Array<{
  title: string;
  content: string;
  sourceType?: string;
  tags?: string[];
}>): Promise<{ success: number; failed: number; errors: string[] }> {
  return daveAPI("knowledge/bulk-import", {
    method: "POST",
    body: { entries },
  });
}

export async function deleteKnowledge(id: string): Promise<{ success: boolean }> {
  return daveAPI("knowledge/delete", {
    method: "POST",
    body: { id },
  });
}

export async function updateKnowledge(id: string, updates: Partial<KnowledgeUploadRequest>): Promise<{ success: boolean; entry?: KnowledgeEntry }> {
  return daveAPI("knowledge/update", {
    method: "POST",
    body: { id, ...updates },
  });
}

// ========== CASE FILES ==========
export interface CaseFile {
  id: string;
  contact_id: string;
  case_number: string;
  case_name: string;
  case_type: string;
  status: string;
  confirmed_facts: unknown[];
  assumptions: unknown[];
  client_intent: string;
  advisor_intent: string;
  strategies_included: unknown[];
  strategies_excluded: unknown[];
  strategies_deferred: unknown[];
  dependencies: string[];
  constraints: string[];
  priority: string;
  estimated_value: number;
  complexity_level: string;
  version: number;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
    full_name?: string;
  };
  decisions?: AdvisorDecision[];
}

export interface AdvisorDecision {
  id: string;
  case_id: string;
  contact_id: string;
  decision_number: string;
  decision_type: string;
  decision_category: string;
  decision_title: string;
  strategy_chosen: string;
  rationale: string;
  alternatives_considered: Array<{
    strategy: string;
    pros: string[];
    cons: string[];
    reason_not_chosen: string;
  }>;
  risks_acknowledged: string[];
  risk_mitigation: string;
  confidence_level: string;
  confidence_factors: string[];
  caveats: string[];
  gaar_reviewed: boolean;
  gaar_notes: string;
  status: string;
  decided_at: string;
  finalized_at: string;
}

export async function listCases(options?: { contactId?: string; status?: string }): Promise<{ cases: CaseFile[] }> {
  return daveAPI("cases/list", {
    method: "POST",
    body: options || {},
  });
}

export async function getCase(id: string): Promise<{ caseFile: CaseFile }> {
  return daveAPI("cases/get", {
    method: "POST",
    body: { id },
  });
}

export async function createCase(data: {
  contactId: string;
  caseName: string;
  caseType?: string;
  clientIntent?: string;
  advisorIntent?: string;
  priority?: string;
  estimatedValue?: number;
}): Promise<{ caseFile: CaseFile; message: string }> {
  return daveAPI("cases/create", {
    method: "POST",
    body: data,
  });
}

export async function updateCase(id: string, updates: Partial<CaseFile>): Promise<{ caseFile: CaseFile }> {
  return daveAPI("cases/update", {
    method: "POST",
    body: { id, ...updates },
  });
}

export async function recordDecision(data: {
  caseId: string;
  decisionType: string;
  decisionCategory?: string;
  decisionTitle: string;
  strategyChosen: string;
  rationale: string;
  alternativesConsidered?: Array<{
    strategy: string;
    pros?: string[];
    cons?: string[];
    reasonNotChosen: string;
  }>;
  risksAcknowledged?: string[];
  riskMitigation?: string;
  confidenceLevel?: string;
  gaarReviewed?: boolean;
  gaarNotes?: string;
}): Promise<{ decision: AdvisorDecision; message: string }> {
  return daveAPI("decisions/record", {
    method: "POST",
    body: data,
  });
}

export async function listDecisions(options?: { caseId?: string; contactId?: string }): Promise<{ decisions: AdvisorDecision[] }> {
  return daveAPI("decisions/list", {
    method: "POST",
    body: options || {},
  });
}

export async function finalizeDecision(id: string): Promise<{ decision: AdvisorDecision }> {
  return daveAPI("decisions/finalize", {
    method: "POST",
    body: { id },
  });
}

export async function createTrustBuilderShare(caseId: string, options?: {
  showCaseSummary?: boolean;
  showStrategies?: boolean;
  showDecisions?: boolean;
  welcomeMessage?: string;
  educationalTopics?: string[];
  expiresInDays?: number;
}): Promise<{ share: unknown; shareUrl: string; message: string }> {
  return daveAPI("trust-builder/create-share", {
    method: "POST",
    body: { caseId, ...options },
  });
}

// Trust Builder PUBLIC endpoints (no auth)
const DAVE_API_URL_PUBLIC = "https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api";

export async function getTrustBuilderView(token: string): Promise<{
  contact?: { firstName: string; lastName: string };
  welcomeMessage?: string;
  caseSummary?: {
    caseName: string;
    caseType: string;
    status: string;
    clientIntent: string;
  };
  strategies?: unknown[];
  nextSteps?: string[];
  decisions?: unknown[];
  educationalTopics?: string[];
  error?: string;
}> {
  const response = await fetch(`${DAVE_API_URL_PUBLIC}/trust-builder/view`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      apikey: DAVE_API_ANON_KEY,
      Authorization: `Bearer ${DAVE_API_ANON_KEY}`,
    },
    body: JSON.stringify({ token })
  });
  return response.json();
}

export async function submitTrustBuilderFeedback(token: string, feedback: {
  type: 'question' | 'objection';
  content: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${DAVE_API_URL_PUBLIC}/trust-builder/feedback`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      apikey: DAVE_API_ANON_KEY,
      Authorization: `Bearer ${DAVE_API_ANON_KEY}`,
    },
    body: JSON.stringify({ token, ...feedback })
  });
  return response.json();
}

// ========== CANADIAN FINANCIAL DATA ==========
export interface CanadianFinancialData {
  rrsp_limit: number;
  tfsa_limit: number;
  tfsa_cumulative: number;
  fhsa_annual_limit: number;
  fhsa_lifetime_limit: number;
  cpp_max_pensionable: number;
  cpp_contribution_rate_employee: number;
  ei_max_insurable: number;
  oas_clawback_threshold: number;
  capital_gains_inclusion_rate: number;
  capital_gains_inclusion_rate_over_250k: number;
  lifetime_capital_gains_exemption: number;
  prescribed_rate_q1: number;
  federal_tax_brackets: Array<{ min: number; max: number; rate: number }>;
  manitoba_tax_brackets: Array<{ min: number; max: number; rate: number }>;
  ontario_tax_brackets: Array<{ min: number; max: number; rate: number }>;
}

export interface ContributionLimits {
  rrsp: { limit: number; rate: number };
  tfsa: { limit: number; cumulative: number };
  fhsa: { annual: number; lifetime: number };
  cpp: { max_pensionable: number; max_contribution: number };
  year: number;
}

export async function getFinancialData(): Promise<{ data: CanadianFinancialData }> {
  return daveAPI<{ data: CanadianFinancialData }>("financial/current");
}

export async function getTaxBrackets(): Promise<{
  federal: unknown[];
  ontario: unknown[];
  manitoba: unknown[];
  year: number;
}> {
  return daveAPI("financial/tax-brackets");
}

export async function getContributionLimits(): Promise<ContributionLimits> {
  return daveAPI("financial/contribution-limits");
}

// ========== COMPLIANCE ==========
export interface ComplianceCheck {
  warning: boolean;
  triggered_keywords?: string[];
  relevant_rules?: unknown[];
  recommendation?: string;
  message?: string;
}

export interface ComplianceAnalysis {
  gaarAlert: unknown;
  relatedRules: unknown[];
  analysis: string;
}

export async function checkCompliance(message: string): Promise<ComplianceCheck> {
  return daveAPI("compliance/check", {
    method: "POST",
    body: { message },
  });
}

export async function getComplianceRules(ruleType?: string): Promise<{ rules: unknown[] }> {
  return daveAPI("compliance/rules", {
    method: "POST",
    body: { ruleType },
  });
}

export async function analyzeCompliance(scenario: string): Promise<ComplianceAnalysis> {
  return daveAPI("compliance/analyze", {
    method: "POST",
    body: { scenario },
  });
}

// ========== SYSTEM ==========
export interface SystemStatus {
  contactCount: number;
  appointmentCount: number;
  taskCount: number;
  knowledgeCount?: number;
  model?: string;
  isNewAccount?: boolean;
  suggestions?: string[];
  features?: {
    emailEnabled: boolean;
    thinkingEnabled: boolean;
    gaarAnalysis: boolean;
    financialCalculations: boolean;
    templateExtraction: boolean;
  };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return daveAPI<SystemStatus>("status");
}

export async function bootstrapSampleData(): Promise<{
  success: boolean;
  message: string;
  created: { contacts?: number; tasks?: number; appointments?: number };
}> {
  return daveAPI("bootstrap", {
    method: "POST",
    body: {},
  });
}

// ========== LEGACY ALIEN FEATURES (kept for compatibility) ==========
export interface Suggestion {
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface Risk {
  severity: "critical" | "warning" | "info";
  type: string;
  description: string;
  contactName?: string;
  recommendedAction: string;
}

export async function getPreCallBriefing(contactId: string): Promise<{ briefing: string }> {
  return daveAPI("alien/precall", {
    method: "POST",
    body: { contactId },
  });
}

export async function getAnticipatoryActions(context?: {
  lastAction?: string;
  currentScreen?: string;
  currentContactId?: string;
}): Promise<{ suggestions: Suggestion[] }> {
  return daveAPI("alien/anticipate", {
    method: "POST",
    body: { context: context || {} },
  });
}

export async function documentCall(transcript: string, contactId?: string): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: Array<{ task: string; owner: string; deadline?: string }>;
  sentiment: "positive" | "neutral" | "negative";
  followUpDate?: string;
  tags: string[];
}> {
  return daveAPI("alien/document", {
    method: "POST",
    body: { transcript, contactId },
  });
}

export async function getRisks(): Promise<{ risks: Risk[] }> {
  return daveAPI("alien/risks", {
    method: "POST",
    body: {},
  });
}

export async function getRelationships(query: string): Promise<{ analysis: string }> {
  return daveAPI("alien/relationships", {
    method: "POST",
    body: { query },
  });
}

export async function getSentimentTrajectory(contactId: string): Promise<{ analysis: string }> {
  return daveAPI("alien/sentiment", {
    method: "POST",
    body: { contactId },
  });
}

export async function orchestrate(command: string): Promise<{
  interpretation: string;
  actions: Array<{ type: string; details: string; status: string }>;
  summary: string;
}> {
  return daveAPI("alien/orchestrate", {
    method: "POST",
    body: { command },
  });
}

export async function getOpportunities(): Promise<{
  opportunities: Array<{
    type: string;
    description: string;
    contactName: string;
    potentialValue: string;
    suggestedAction: string;
    confidence: "high" | "medium" | "low";
  }>;
}> {
  return daveAPI("alien/opportunities", {
    method: "POST",
    body: {},
  });
}

export async function analyzeCounterfactual(scenario: string): Promise<{ analysis: string }> {
  return daveAPI("alien/counterfactual", {
    method: "POST",
    body: { scenario },
  });
}

export async function getDraft(recipientId: string, purpose: string, keyPoints: string[]): Promise<{
  draft: string;
  styleNotes: string;
}> {
  return daveAPI("alien/draft", {
    method: "POST",
    body: { recipientId, purpose, keyPoints },
  });
}

// ========== SMS ==========
export interface SMSRequest {
  to: string;
  message: string;
  contactId?: string;
}

export interface SMSContentRequest {
  contactId: string;
  contentId: string;
  message?: string;
}

export interface SMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendSMS(request: SMSRequest): Promise<SMSResult> {
  return daveAPI<SMSResult>("sms/send", { method: "POST", body: request });
}

export async function sendContentSMS(request: SMSContentRequest): Promise<SMSResult> {
  return daveAPI<SMSResult>("sms/send-content", { method: "POST", body: request });
}

// ========== CONTENT LIBRARY ==========
export interface ContentItem {
  id: string;
  title: string;
  content_type: "proposal" | "video" | "article" | "document" | "presentation" | "spreadsheet" | "image";
  description?: string;
  url?: string;
  file_path?: string;
  file_content?: string;
  storage_path?: string;
  tags?: string[];
  topic_keywords?: string[];
  audience?: "client" | "advisor" | "internal";
  created_at: string;
  updated_at?: string;
}

export interface ContentUploadRequest {
  title: string;
  content_type: "proposal" | "video" | "article" | "document" | "presentation" | "spreadsheet" | "image";
  description?: string;
  url?: string;
  file_content?: string;
  file_name?: string;
  tags?: string[];
  topic_keywords?: string[];
  audience?: "client" | "advisor" | "internal";
  is_template?: boolean;
  extract_to_knowledge?: boolean;
}

export async function uploadContent(request: ContentUploadRequest): Promise<{
  success: boolean;
  id?: string;
  knowledge_id?: string;
  extracted_text?: boolean;
  error?: string;
}> {
  return daveAPI("content/upload", { method: "POST", body: request });
}

export async function listContent(filters?: {
  content_type?: string;
  audience?: string;
  tags?: string[];
  limit?: number;
}): Promise<{ content: ContentItem[] }> {
  return daveAPI("content/list", { method: "POST", body: filters || {} });
}

export async function getContent(id: string): Promise<{ content: ContentItem | null }> {
  return daveAPI("content/get", { method: "POST", body: { id } });
}

export async function deleteContent(id: string): Promise<{ success: boolean }> {
  return daveAPI("content/delete", { method: "POST", body: { id } });
}

export async function searchContent(query: string, limit?: number): Promise<{ content: ContentItem[] }> {
  return daveAPI("content/search", { method: "POST", body: { query, limit } });
}

// ========== DRIP CAMPAIGNS ==========
export interface DripCampaign {
  id: string;
  name: string;
  topic: string;
  channel: 'email' | 'sms';
  step_count: number;
  description?: string;
  is_active: boolean;
}

export interface DripEnrollment {
  id: string;
  contact_id: string;
  campaign_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  enrolled_at: string;
  next_step_due_at?: string;
  drip_campaigns?: DripCampaign;
}

export async function listCampaigns(filters?: { topic?: string; channel?: string }): Promise<{ campaigns: DripCampaign[] }> {
  return daveAPI("campaigns/list", { method: "POST", body: filters || {} });
}

// Campaign step with full content
export interface DripCampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  delay_days: number;
  subject?: string;
  content: string;
  content_library_id?: string;
  is_active: boolean;
  created_at?: string;
}

// Campaign with steps
export interface DripCampaignWithSteps extends DripCampaign {
  steps: DripCampaignStep[];
}

export async function getCampaign(id: string): Promise<{ campaign: DripCampaignWithSteps }> {
  return daveAPI("campaigns/get", { method: "POST", body: { id } });
}

// List all contacts (for dropdowns)
export async function listContacts(limit?: number): Promise<Contact[]> {
  const result = await searchContacts("");
  return result.contacts || [];
}

export async function enrollInCampaign(contactId: string, campaignId: string): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
  return daveAPI("campaigns/enroll", { method: "POST", body: { contactId, campaignId } });
}

export async function enrollByTopic(contactName: string, topic: string, channel: 'email' | 'sms' = 'email'): Promise<{ success: boolean; message: string }> {
  return daveAPI("campaigns/enroll-by-name", { method: "POST", body: { contactName, topic, channel } });
}

export async function unenrollFromCampaign(contactId: string, campaignId?: string): Promise<{ success: boolean; count: number }> {
  return daveAPI("campaigns/unenroll", { method: "POST", body: { contactId, campaignId } });
}

export async function getContactEnrollments(contactId: string): Promise<{ enrollments: DripEnrollment[] }> {
  return daveAPI("campaigns/contact-enrollments", { method: "POST", body: { contactId } });
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: 'active' | 'paused' | 'completed' | 'cancelled'
): Promise<{ success: boolean; enrollment?: DripEnrollment }> {
  return daveAPI("campaigns/update-status", { method: "POST", body: { enrollmentId, status } });
}

// ========== VOICE CALLS ==========
export interface CallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

export interface CallRecord {
  id: string;
  contact_id?: string;
  direction: 'inbound' | 'outbound';
  status: string;
  duration_seconds?: number;
  transcript?: string;
  summary?: string;
  created_at: string;
  contacts?: { full_name: string };
}

export async function initiateCall(contactId: string, context?: string, firstMessage?: string): Promise<CallResult> {
  return daveAPI("call/initiate", { method: "POST", body: { contactId, context, firstMessage } });
}

export async function getCallHistory(contactId?: string, limit?: number): Promise<{ calls: CallRecord[] }> {
  return daveAPI("call/history", { method: "POST", body: { contactId, limit } });
}

export async function getCall(id: string): Promise<{ call: CallRecord }> {
  return daveAPI("call/get", { method: "POST", body: { id } });
}

// ========== ONBOARDING ==========
export interface OnboardingData {
  firstName: string;
  lastName: string;
  company?: string;
  role?: string;
}

export async function completeOnboarding(data: OnboardingData): Promise<{ success: boolean }> {
  return daveAPI("auth/onboarding", { method: "POST", body: { ...data, completed: true } });
}

// ========== DIAGRAM GENERATION ==========
export interface SuccessionDiagramRequest {
  parentNames: string[];
  children: Array<{ name: string; inBusiness: boolean; sharePercent?: number }>;
  companyName: string;
  freezeValue?: number;
}

export interface IFADiagramRequest {
  corporationName: string;
  policyValue: number;
  annualBorrowing?: number;
  years?: number;
}

export interface TimelineDiagramRequest {
  phases: Array<{
    name: string;
    duration: string;
    tasks: string[];
  }>;
}

export async function generateSuccessionDiagram(data: SuccessionDiagramRequest): Promise<DiagramData> {
  return daveAPI<DiagramData>("diagram/succession", {
    method: "POST",
    body: data,
  });
}

export async function generateIFADiagram(data: IFADiagramRequest): Promise<DiagramData> {
  return daveAPI<DiagramData>("diagram/ifa", {
    method: "POST",
    body: data,
  });
}

export async function generateTimelineDiagram(data: TimelineDiagramRequest): Promise<DiagramData> {
  return daveAPI<DiagramData>("diagram/timeline", {
    method: "POST",
    body: data,
  });
}

export async function generateBalanceSheetDiagram(data: Record<string, unknown>): Promise<DiagramData> {
  return daveAPI<DiagramData>("diagram/balance-sheet", {
    method: "POST",
    body: data,
  });
}

export async function generateComparisonDiagram(data: Record<string, unknown>): Promise<DiagramData> {
  return daveAPI<DiagramData>("diagram/comparison", {
    method: "POST",
    body: data,
  });
}

// ========== CALENDLY BOOKING ==========
export async function sendBookingLink(contactId: string, customMessage?: string): Promise<{ success: boolean; message?: string }> {
  return daveAPI("booking/send-link", {
    method: "POST",
    body: { contactId, message: customMessage },
  });
}

export async function updateBookingStatus(
  contactId: string,
  status: 'not_sent' | 'link_sent' | 'booked' | 'completed' | 'cancelled',
  notes?: string
): Promise<{ success: boolean }> {
  return daveAPI("booking/update-status", {
    method: "POST",
    body: { contactId, status, notes },
  });
}

export async function getBookingLink(): Promise<string> {
  const data = await daveAPI<{ bookingLink?: string }>("booking/get-link", {
    method: "POST",
    body: {},
  });
  return data.bookingLink || 'https://calendly.com/dave-wfsadvisory/discovery-meeting';
}

// ========== EMAIL MANAGEMENT ==========
export interface Email {
  id: string;
  subject: string;
  from_address: string;
  from_name: string;
  snippet: string;
  received_at: string;
  category: string;
  priority: string;
  is_read: boolean;
  is_starred: boolean;
  requires_response: boolean;
  ai_summary: string;
  contact?: {
    first_name: string;
    last_name: string;
    company_name: string;
  };
}

export async function listEmails(accountId: string, limit = 50): Promise<Email[]> {
  const data = await daveAPI<{ emails: Email[] }>("email/list", {
    method: "POST",
    body: { accountId, limit },
  });
  return data.emails || [];
}

export async function syncEmails(accountId: string): Promise<{ success: boolean }> {
  return daveAPI("email/sync", {
    method: "POST",
    body: { accountId },
  });
}

export async function markEmailRead(emailId: string): Promise<void> {
  await daveAPI("email/mark-read", {
    method: "POST",
    body: { emailId },
  });
}

export async function starEmail(emailId: string, starred: boolean): Promise<void> {
  await daveAPI("email/star", {
    method: "POST",
    body: { emailId, starred },
  });
}

export async function archiveEmail(emailId: string): Promise<void> {
  await daveAPI("email/archive", {
    method: "POST",
    body: { emailId },
  });
}
