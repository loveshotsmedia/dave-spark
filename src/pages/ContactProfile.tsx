import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Edit,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  CheckSquare,
  FileText,
  Send,
  Loader2,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getContact,
  getAppointments,
  getTasks,
  getConversations,
  Contact,
  ClientFile,
  Appointment,
  Task,
  Conversation,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { SMSComposer } from "@/components/dave/SMSComposer";
import { EmailComposer } from "@/components/dave/EmailComposer";
import { EditContactModal } from "@/components/dave/EditContactModal";
import { SendContentModal } from "@/components/dave/SendContentModal";
import { ProposalPanel } from "@/components/dave/ProposalPanel";
import { CampaignEnrollmentCard } from "@/components/dave/CampaignEnrollmentCard";
import { toast } from "@/hooks/use-toast";

function formatNetWorth(value?: number): string {
  if (!value) return "—";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

function formatCurrency(value?: number): string {
  if (!value) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case "vip":
    case "whale":
      return "bg-primary text-primary-foreground";
    case "active":
    case "client":
      return "bg-success text-success-foreground";
    case "prospect":
      return "bg-warning text-warning-foreground";
    case "inactive":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [contact, setContact] = useState<Contact | null>(null);
  const [clientFile, setClientFile] = useState<ClientFile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isSMSOpen, setIsSMSOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSendContentOpen, setIsSendContentOpen] = useState(false);
  const [isProposalOpen, setIsProposalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch contact data
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const [contactRes, appointmentsRes, tasksRes, conversationsRes] = await Promise.all([
          getContact(id),
          getAppointments({ contactId: id, limit: 10 }),
          getTasks({ contactId: id, limit: 10 }),
          getConversations(id, 20).catch(() => ({ conversations: [] })),
        ]);

        setContact(contactRes.contact);
        setClientFile(contactRes.clientFile);
        setAppointments(appointmentsRes.appointments || []);
        setTasks(tasksRes.tasks || []);
        setConversations(conversationsRes.conversations || []);
      } catch (error) {
        console.error("Failed to fetch contact:", error);
        toast({
          title: "Error",
          description: "Failed to load contact details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleContactUpdated = (updatedContact: Contact) => {
    setContact(updatedContact);
    setIsEditOpen(false);
    toast({
      title: "Contact updated",
      description: "Changes saved successfully",
    });
  };

  const handleProposalGenerated = (proposal: string, contactName: string) => {
    toast({
      title: "Proposal generated",
      description: `Proposal for ${contactName} is ready`,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Contact not found</p>
        <Button variant="link" onClick={() => navigate("/contacts")} className="mt-2">
          Back to Contacts
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/contacts")} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Contacts
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSMSOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-1" />
                SMS
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEmailOpen(true)}>
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Contact Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl font-bold text-primary">
                  {contact.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{contact.full_name}</h1>
                    {(contact.title || contact.company) && (
                      <p className="text-muted-foreground">
                        {contact.title}
                        {contact.title && contact.company && " at "}
                        {contact.company}
                      </p>
                    )}
                  </div>
                  {contact.status && (
                    <Badge className={`${getStatusColor(contact.status)} text-sm py-1 px-3`}>
                      {contact.status}
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {contact.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-primary">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${contact.phone}`} className="hover:text-primary">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.net_worth && (
                    <div className="flex items-center gap-1 text-success font-medium">
                      <DollarSign className="h-4 w-4" />
                      Net Worth: {formatNetWorth(contact.net_worth)}
                    </div>
                  )}
                </div>

                {contact.tags && contact.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Client File</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Client File Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Client File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clientFile ? (
                    <>
                      {clientFile.business_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Business</span>
                          <span className="font-medium">{clientFile.business_name}</span>
                        </div>
                      )}
                      {clientFile.business_value && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Business Value</span>
                          <span className="font-medium text-success">
                            {formatCurrency(clientFile.business_value)}
                          </span>
                        </div>
                      )}
                      {clientFile.acb && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ACB</span>
                          <span className="font-medium">{formatCurrency(clientFile.acb)}</span>
                        </div>
                      )}
                      {clientFile.planning_needs && clientFile.planning_needs.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground block mb-2">
                            Planning Needs
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {clientFile.planning_needs.map((need) => (
                              <Badge key={need} variant="secondary">
                                {need}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {!clientFile.business_name && !clientFile.business_value && (
                        <p className="text-sm text-muted-foreground">No file data yet</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No file data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsSendContentOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Content
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/chat")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/chat")}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsProposalOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Proposal
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Enrollment */}
            <CampaignEnrollmentCard contactId={id!} contactName={contact.full_name} />

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {conversations.length > 0 || tasks.length > 0 || appointments.length > 0 ? (
                  <div className="space-y-3">
                {[...conversations.slice(0, 3), ...tasks.slice(0, 2), ...appointments.slice(0, 2)]
                      .sort((a, b) => {
                        const getDate = (item: Conversation | Task | Appointment): string | undefined => {
                          if ('channel' in item) return item.created_at; // Conversation
                          if ('due_date' in item && !('scheduled_at' in item) && !('start_time' in item)) {
                            return (item as Task).due_date; // Task
                          }
                          // Appointment - check both possible date fields
                          const appt = item as Appointment;
                          return appt.scheduled_at || appt.start_time;
                        };
                        return new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime();
                      })
                      .slice(0, 5)
                      .map((item, index) => {
                        if ("channel" in item) {
                          // Conversation
                          return (
                            <div key={`conv-${index}`} className="flex items-start gap-3 text-sm">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {item.channel === "sms" ? (
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                ) : item.channel === "email" ? (
                                  <Mail className="h-4 w-4 text-primary" />
                                ) : (
                                  <Phone className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium capitalize">
                                  {item.channel} {item.direction}
                                </p>
                                <p className="text-muted-foreground line-clamp-1">
                                  {item.transcript}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(item.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        } else if ("title" in item && "scheduled_at" in item) {
                          // Appointment
                          return (
                            <div key={`appt-${index}`} className="flex items-start gap-3 text-sm">
                              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-warning" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.title}</p>
                                <p className="text-muted-foreground">
                                  {formatDateTime(item.scheduled_at)}
                                </p>
                              </div>
                            </div>
                          );
                        } else {
                          // Task
                          return (
                            <div key={`task-${index}`} className="flex items-start gap-3 text-sm">
                              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                                <CheckSquare className="h-4 w-4 text-success" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{(item as Task).title}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {(item as Task).status}
                                </Badge>
                              </div>
                            </div>
                          );
                        }
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client File Tab */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientFile ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      <p className="font-medium">{clientFile.business_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Business Value</p>
                      <p className="font-medium text-success">
                        {formatCurrency(clientFile.business_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Adjusted Cost Base (ACB)</p>
                      <p className="font-medium">{formatCurrency(clientFile.acb)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unrealized Gain</p>
                      <p className="font-medium">
                        {clientFile.business_value && clientFile.acb
                          ? formatCurrency(clientFile.business_value - clientFile.acb)
                          : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No business information on file</p>
                )}
              </CardContent>
            </Card>

            {clientFile?.children && clientFile.children.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Children
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clientFile.children.map((child, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-muted-foreground">Age: {child.age}</p>
                        </div>
                        {child.in_business && (
                          <Badge variant="secondary">In Business</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {clientFile?.existing_policies && clientFile.existing_policies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Existing Policies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clientFile.existing_policies.map((policy, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{policy.type}</p>
                          <p className="text-sm text-muted-foreground">{policy.carrier}</p>
                        </div>
                        <p className="font-medium text-success">
                          {formatCurrency(policy.face_amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {clientFile?.planning_needs && clientFile.planning_needs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Planning Needs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {clientFile.planning_needs.map((need) => (
                      <Badge key={need} variant="secondary" className="text-sm py-1 px-3">
                        {need}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(clientFile?.coi_accountant || clientFile?.coi_lawyer) && (
              <Card>
                <CardHeader>
                  <CardTitle>Centers of Influence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {clientFile.coi_accountant && (
                      <div>
                        <p className="text-sm text-muted-foreground">Accountant</p>
                        <p className="font-medium">{clientFile.coi_accountant}</p>
                      </div>
                    )}
                    {clientFile.coi_lawyer && (
                      <div>
                        <p className="text-sm text-muted-foreground">Lawyer</p>
                        <p className="font-medium">{clientFile.coi_lawyer}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                {conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-start gap-3 rounded-lg border p-4"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {conv.channel === "sms" ? (
                            <MessageSquare className="h-5 w-5 text-primary" />
                          ) : conv.channel === "email" ? (
                            <Mail className="h-5 w-5 text-primary" />
                          ) : (
                            <Phone className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {conv.channel}
                            </Badge>
                            <Badge
                              variant={conv.direction === "outbound" ? "default" : "secondary"}
                            >
                              {conv.direction}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDateTime(conv.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{conv.transcript}</p>
                          {conv.outcome && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Outcome: {conv.outcome}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" onClick={() => setIsSMSOpen(true)}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Send SMS
                      </Button>
                      <Button variant="outline" onClick={() => setIsEmailOpen(true)}>
                        <Mail className="h-4 w-4 mr-1" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.filter(
                    (a) => new Date(a.scheduled_at || a.start_time) >= new Date()
                  ).length > 0 ? (
                    <div className="space-y-3">
                      {appointments
                        .filter((a) => new Date(a.scheduled_at || a.start_time) >= new Date())
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-start gap-3 rounded-lg border p-3"
                          >
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                              <Calendar className="h-5 w-5 text-warning" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{appointment.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(appointment.scheduled_at || appointment.start_time)}
                              </p>
                              {appointment.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {appointment.location}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No upcoming appointments
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                            <CheckSquare className="h-5 w-5 text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {task.status}
                              </Badge>
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No tasks</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <SMSComposer
        isOpen={isSMSOpen}
        onClose={() => setIsSMSOpen(false)}
        preselectedContact={contact}
      />

      <EmailComposer
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        preselectedContact={contact}
      />

      <EditContactModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        contact={contact}
        clientFile={clientFile}
        onContactUpdated={handleContactUpdated}
      />

      <SendContentModal
        isOpen={isSendContentOpen}
        onClose={() => setIsSendContentOpen(false)}
        contact={contact}
      />

      <ProposalPanel
        isOpen={isProposalOpen}
        onClose={() => setIsProposalOpen(false)}
        preselectedContactId={contact.id}
        onProposalGenerated={handleProposalGenerated}
      />
    </div>
  );
}
