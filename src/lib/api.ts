// Dave 2.0 API Client
const API_BASE = "https://icopqfohbrdsdqgpajdy.supabase.co/functions/v1/dave-api";

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

class DaveAPI {
  private passphrase: string | null = null;

  setPassphrase(passphrase: string) {
    this.passphrase = passphrase;
    sessionStorage.setItem("dave-passphrase", passphrase);
  }

  getPassphrase(): string | null {
    if (!this.passphrase) {
      this.passphrase = sessionStorage.getItem("dave-passphrase");
    }
    return this.passphrase;
  }

  clearPassphrase() {
    this.passphrase = null;
    sessionStorage.removeItem("dave-passphrase");
  }

  isAuthenticated(): boolean {
    return !!this.getPassphrase();
  }

  private async request<T>(endpoint: string, data?: unknown): Promise<T> {
    const passphrase = this.getPassphrase();
    if (!passphrase) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-owner-auth": passphrase,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearPassphrase();
        throw new Error("Invalid passphrase");
      }
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  // Chat
  async chat(messages: Message[]): Promise<{ response: string; context?: string }> {
    return this.request("/chat", { messages });
  }

  // Contacts
  async searchContacts(query: string): Promise<{ contacts: Contact[] }> {
    return this.request("/contacts/search", { query });
  }

  async getContact(id: string): Promise<{ contact: Contact; clientFile?: unknown }> {
    return this.request("/contacts/get", { id });
  }

  // Proposals
  async generateProposal(
    contactId: string,
    proposalType: string,
    additionalContext?: string
  ): Promise<{ proposal: string }> {
    return this.request("/proposal/generate", {
      contactId,
      proposalType,
      additionalContext,
    });
  }

  // Appointments
  async getAppointments(limit?: number): Promise<{ appointments: Appointment[] }> {
    return this.request("/appointments", { limit: limit || 10 });
  }

  // Tasks
  async getTasks(status?: string): Promise<{ tasks: Task[] }> {
    return this.request("/tasks", { status });
  }

  // Alien Features
  async getPreCallBriefing(contactId: string): Promise<{ briefing: string; keyPoints: string[]; landmines: string[]; bestOutcome: string }> {
    return this.request("/alien/precall", { contactId });
  }

  async getAnticipatoryActions(): Promise<{ suggestions: Suggestion[] }> {
    return this.request("/alien/anticipate", {});
  }

  async documentCall(
    contactId: string,
    transcript: string
  ): Promise<{ summary: string; keyPoints: string[]; actionItems: string[]; sentiment: string; followUpDate: string }> {
    return this.request("/alien/document", { contactId, transcript });
  }

  async getRisks(): Promise<{ risks: Risk[] }> {
    return this.request("/alien/risks", {});
  }

  // Status check
  async getStatus(): Promise<{ isNew: boolean; contactCount: number; appointmentCount: number }> {
    try {
      const response = await fetch(`${API_BASE}/status`, {
        method: "GET",
        headers: {
          "x-owner-auth": this.getPassphrase() || "",
        },
      });
      return response.json();
    } catch {
      return { isNew: true, contactCount: 0, appointmentCount: 0 };
    }
  }
}

export const api = new DaveAPI();