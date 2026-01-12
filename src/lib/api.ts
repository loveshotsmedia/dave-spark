// Dave 2.0 API Client for Lovable Frontend
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path for PDF.js using the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const API_BASE = "https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api";

async function apiRequest<T>(endpoint: string, method = "POST", body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-owner-auth": "I love Cameron",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
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

// ========== CHAT ==========
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatFile {
  name: string;
  type: string;
  content: string;
}

export async function chat(
  message: string,
  files?: File[],
  onProgress?: (progress: ExtractionProgress) => void
): Promise<{ response: string; context?: string; documentsUploaded?: number }> {
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

      await uploadKnowledge(
        file.name.replace('.pdf', ''),
        content,
        'proposal',
        { tags: ['uploaded', 'document'] }
      );
      
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

    if (documentsUploaded > 0) {
      const fileNames = pdfFiles.map(f => f.name).join(', ');
      message = `I just uploaded "${fileNames}". ${message}`;
    }
  }

  const response = await apiRequest<{ response: string; context?: string }>("chat", "POST", {
    message,
    files: processedFiles.length > 0 ? processedFiles : undefined,
  });
  
  return { ...response, documentsUploaded };
}

// ========== CONTACTS ==========
export interface Contact {
  id: string;
  first_name: string;
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
  created_at: string;
  updated_at: string;
}

export async function searchContacts(query: string): Promise<{ contacts: Contact[] }> {
  return apiRequest("contacts/search", "POST", { query });
}

export async function getContact(id: string): Promise<{ contact: Contact; clientFile: unknown }> {
  return apiRequest("contacts/get", "POST", { id });
}

export async function quickAddContact(description: string): Promise<{ success: boolean; contact?: Contact; message: string }> {
  return apiRequest("quick-add", "POST", { description });
}

// ========== APPOINTMENTS ==========
export interface Appointment {
  id: string;
  contact_id?: string;
  title?: string;
  start_time: string;
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
  notes?: string;
  contacts?: { full_name: string; email?: string; phone?: string };
}

export async function getAppointments(options?: {
  contactId?: string;
  upcoming?: boolean;
  limit?: number;
}): Promise<{ appointments: Appointment[] }> {
  return apiRequest("appointments", "POST", options || {});
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
  return apiRequest("tasks", "POST", options || {});
}

// ========== ALIEN FEATURES ==========
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
  return apiRequest("alien/precall", "POST", { contactId });
}

export async function getAnticipatoryActions(context?: {
  lastAction?: string;
  currentScreen?: string;
  currentContactId?: string;
}): Promise<{ suggestions: Suggestion[] }> {
  return apiRequest("alien/anticipate", "POST", { context: context || {} });
}

export async function documentCall(transcript: string, contactId?: string): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: Array<{ task: string; owner: string; deadline?: string }>;
  sentiment: "positive" | "neutral" | "negative";
  followUpDate?: string;
  tags: string[];
}> {
  return apiRequest("alien/document", "POST", { transcript, contactId });
}

export async function getRisks(): Promise<{ risks: Risk[] }> {
  return apiRequest("alien/risks", "POST", {});
}

export async function getRelationships(query: string): Promise<{ analysis: string }> {
  return apiRequest("alien/relationships", "POST", { query });
}

export async function getSentimentTrajectory(contactId: string): Promise<{ analysis: string }> {
  return apiRequest("alien/sentiment", "POST", { contactId });
}

export async function orchestrate(command: string): Promise<{
  interpretation: string;
  actions: Array<{ type: string; details: string; status: string }>;
  summary: string;
}> {
  return apiRequest("alien/orchestrate", "POST", { command });
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
  return apiRequest("alien/opportunities", "POST", {});
}

export async function analyzeCounterfactual(scenario: string): Promise<{ analysis: string }> {
  return apiRequest("alien/counterfactual", "POST", { scenario });
}

export async function getDraft(recipientId: string, purpose: string, keyPoints: string[]): Promise<{
  draft: string;
  styleNotes: string;
}> {
  return apiRequest("alien/draft", "POST", { recipientId, purpose, keyPoints });
}

// ========== KNOWLEDGE BASE ==========
export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  tags: string[];
  summary?: string;
  createdAt: string;
}

export async function uploadKnowledge(
  title: string,
  content: string,
  sourceType?: string,
  metadata?: {
    fileName?: string;
    fileType?: string;
    tags?: string[];
    clientSpecific?: boolean;
    relatedContactId?: string;
  }
): Promise<{ success: boolean; id?: string; message: string }> {
  return apiRequest("knowledge/upload", "POST", {
    title,
    content,
    sourceType: sourceType || "manual_entry",
    ...metadata,
  });
}

export async function listKnowledge(options?: {
  category?: string;
  sourceType?: string;
  limit?: number;
}): Promise<{ entries: KnowledgeEntry[] }> {
  return apiRequest("knowledge/list", "POST", options || {});
}

export async function searchKnowledge(query: string, limit?: number): Promise<{ results: KnowledgeEntry[] }> {
  return apiRequest("knowledge/search", "POST", { query, limit });
}

// ========== CANADIAN FINANCIAL DATA ==========
export interface FinancialData {
  bankOfCanadaRate: number;
  primeRate: number;
  cpi: number;
  lastUpdated: string;
}

export interface ContributionLimits {
  rrsp: { limit: number; rate: number };
  tfsa: { limit: number; cumulative: number };
  fhsa: { annual: number; lifetime: number };
  cpp: { max_pensionable: number; max_contribution: number };
  year: number;
}

export async function getFinancialData(): Promise<{ data: FinancialData }> {
  return apiRequest("financial/current", "POST", {});
}

export async function getTaxBrackets(): Promise<{ federal: unknown[]; year: number }> {
  return apiRequest("financial/tax-brackets", "POST", {});
}

export async function getContributionLimits(): Promise<ContributionLimits> {
  return apiRequest("financial/contribution-limits", "POST", {});
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
  return apiRequest("compliance/check", "POST", { message });
}

export async function getComplianceRules(ruleType?: string): Promise<{ rules: unknown[] }> {
  return apiRequest("compliance/rules", "POST", { ruleType });
}

export async function analyzeCompliance(scenario: string): Promise<ComplianceAnalysis> {
  return apiRequest("compliance/analyze", "POST", { scenario });
}

// ========== SYSTEM ==========
export async function getSystemStatus(): Promise<{
  isNewAccount: boolean;
  contactCount: number;
  appointmentCount: number;
  taskCount: number;
  suggestions: string[];
}> {
  return apiRequest("status", "POST", {});
}

export async function bootstrapSampleData(): Promise<{
  success: boolean;
  message: string;
  created: { contacts?: number; tasks?: number; appointments?: number };
}> {
  return apiRequest("bootstrap", "POST", {});
}
