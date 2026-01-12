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

// Chat with optional file attachments
export async function chat(
  message: string,
  files?: File[]
): Promise<{ response: string; context?: string }> {
  // If no files, use simple JSON request
  if (!files || files.length === 0) {
    return apiRequest("/chat", "POST", { message });
  }

  // With files, use FormData
  const formData = new FormData();
  formData.append("message", message);
  
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file, file.name);
  });

  const url = `${DAVE_API_BASE}/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-owner-auth": AUTH_PASSPHRASE,
      // Don't set Content-Type - browser will set it with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<{ response: string; context?: string }>;
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
