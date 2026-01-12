// Dave 2.0 API Client - Direct API calls with x-owner-auth header
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DAVE_API_BASE = "https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api";
const AUTH_PASSPHRASE = "I love Cameron";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  netWorth?: number;
  status?: "Lead" | "Client" | "Whale";
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  title: string;
  contactId?: string;
  contactName?: string;
  startTime: string;
  endTime?: string;
  type: "video" | "phone" | "in-person";
  location?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: "pending" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  contactId?: string;
  contactName?: string;
}

export interface Risk {
  id: string;
  type: "cold_lead" | "overdue_task" | "at_risk_client" | "no_prep";
  severity: "critical" | "warning";
  title: string;
  description: string;
  contactId?: string;
  contactName?: string;
}

export interface Suggestion {
  id: string;
  action: string;
  description: string;
  icon: string;
  priority: number;
}

export interface OnboardingStatus {
  completed: boolean;
  steps?: {
    profile?: boolean;
    preferences?: boolean;
  };
}

// Direct API helper - all requests go to Dave 2.0 API with x-owner-auth header
async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const url = `${DAVE_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-owner-auth": AUTH_PASSPHRASE,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Extract text from PDF files in the browser
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: unknown) => (item as { str: string }).str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

// Chat with optional file attachments - PDFs are extracted and uploaded to knowledge base
export async function chat(
  message: string,
  files?: File[]
): Promise<{ response: string; context?: string; documentsUploaded?: number }> {
  let documentsUploaded = 0;
  
  // If files attached, process them first
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.type === 'application/pdf') {
        // Extract text from PDF
        const content = await extractTextFromPDF(file);
        
        // Upload to knowledge base so chat can find it via RAG
        await uploadKnowledge(
          file.name.replace('.pdf', ''),
          content,
          'proposal',
          ['uploaded', 'document']
        );
        documentsUploaded++;
      }
    }
    
    // Update message to reference the uploaded doc
    if (documentsUploaded > 0) {
      const fileNames = files.filter(f => f.type === 'application/pdf').map(f => f.name).join(', ');
      message = `I just uploaded "${fileNames}". ${message}`;
    }
  }

  const response = await apiRequest<{ response: string; context?: string }>("/chat", "POST", { message });
  return { ...response, documentsUploaded };
}

// Contacts
export async function searchContacts(query: string): Promise<{ contacts: Contact[] }> {
  return apiRequest("/contacts/search", "POST", { query });
}

export async function getContact(id: string): Promise<{ contact: Contact; clientFile?: unknown }> {
  return apiRequest("/contacts/get", "POST", { id });
}

// Appointments
export async function getAppointments(limit?: number): Promise<{ appointments: Appointment[] }> {
  return apiRequest("/appointments", "POST", { limit: limit || 10 });
}

// Tasks
export async function getTasks(status?: string): Promise<{ tasks: Task[] }> {
  return apiRequest("/tasks", "POST", { status });
}

// Alien Features
export async function getPreCallBriefing(contactId: string): Promise<{
  briefing: string;
  keyPoints: string[];
  landmines: string[];
  bestOutcome: string;
}> {
  return apiRequest("/alien/precall", "POST", { contactId });
}

export async function getAnticipatoryActions(): Promise<{ suggestions: Suggestion[] }> {
  return apiRequest("/alien/anticipate", "POST", {});
}

export async function documentCall(
  contactId: string,
  transcript: string
): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
  followUpDate: string;
}> {
  return apiRequest("/alien/document", "POST", { contactId, transcript });
}

export async function getRisks(): Promise<{ risks: Risk[] }> {
  return apiRequest("/alien/risks", "POST", {});
}

// ================== Knowledge Base ==================

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
  sourceType = "manual_entry",
  tags: string[] = []
): Promise<{ success: boolean; id?: string; error?: string }> {
  return apiRequest("/knowledge/upload", "POST", { title, content, sourceType, tags });
}

export async function searchKnowledge(query: string): Promise<{ results: KnowledgeEntry[] }> {
  return apiRequest("/knowledge/search", "POST", { query });
}

export async function listKnowledge(): Promise<{ entries: KnowledgeEntry[] }> {
  return apiRequest("/knowledge/list", "POST", {});
}

// ================== Canadian Financial Data ==================

export interface FinancialData {
  bankOfCanadaRate: number;
  primeRate: number;
  cpi: number;
  lastUpdated: string;
}

export interface ContributionLimits {
  year: number;
  rrsp: number;
  tfsa: number;
  fhsa: number;
  cppMax: number;
  lcge: number;
}

export async function getFinancialData(): Promise<FinancialData> {
  return apiRequest("/financial/current", "POST", {});
}

export async function getContributionLimits(): Promise<ContributionLimits> {
  return apiRequest("/financial/contribution-limits", "POST", {});
}

// ================== GAAR Compliance ==================

export interface ComplianceCheck {
  warning: boolean;
  level: "none" | "caution" | "warning" | "critical";
  message?: string;
  details?: string[];
}

export interface ComplianceAnalysis {
  risk: "low" | "medium" | "high";
  factors: string[];
  recommendations: string[];
  gaarApplicable: boolean;
}

export async function checkCompliance(message: string): Promise<ComplianceCheck> {
  return apiRequest("/compliance/check", "POST", { message });
}

export async function analyzeCompliance(scenario: string): Promise<ComplianceAnalysis> {
  return apiRequest("/compliance/analyze", "POST", { scenario });
}
