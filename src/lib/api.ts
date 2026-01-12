// Dave 2.0 API Client - Direct API calls with x-owner-auth header

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

// Auth
export async function syncAuth(): Promise<{ success: boolean }> {
  return apiRequest("/api/auth/sync", "POST");
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiRequest("/api/auth/me/onboarding", "GET");
}

// Chat
export async function chat(messages: Message[]): Promise<{ response: string; context?: string }> {
  return apiRequest("/api/chat", "POST", { messages });
}

// Contacts
export async function searchContacts(query: string): Promise<{ contacts: Contact[] }> {
  return apiRequest("/api/contacts/search", "POST", { query });
}

export async function getContact(id: string): Promise<{ contact: Contact; clientFile?: unknown }> {
  return apiRequest("/api/contacts/get", "POST", { id });
}

// Proposals
export async function generateProposal(
  contactId: string,
  proposalType: string,
  additionalContext?: string
): Promise<{ proposal: string }> {
  return apiRequest("/api/proposal/generate", "POST", {
    contactId,
    proposalType,
    additionalContext,
  });
}

// Appointments
export async function getAppointments(limit?: number): Promise<{ appointments: Appointment[] }> {
  return apiRequest("/api/appointments", "POST", { limit: limit || 10 });
}

// Tasks
export async function getTasks(status?: string): Promise<{ tasks: Task[] }> {
  return apiRequest("/api/tasks", "POST", { status });
}

// Alien Features
export async function getPreCallBriefing(contactId: string): Promise<{
  briefing: string;
  keyPoints: string[];
  landmines: string[];
  bestOutcome: string;
}> {
  return apiRequest("/api/alien/precall", "POST", { contactId });
}

export async function getAnticipatoryActions(): Promise<{ suggestions: Suggestion[] }> {
  return apiRequest("/api/alien/anticipate", "POST", {});
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
  return apiRequest("/api/alien/document", "POST", { contactId, transcript });
}

export async function getRisks(): Promise<{ risks: Risk[] }> {
  return apiRequest("/api/alien/risks", "POST", {});
}
