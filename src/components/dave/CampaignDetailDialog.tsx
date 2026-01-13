import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Clock, Users, Eye, Send, Loader2 } from "lucide-react";
import {
  DripCampaign,
  Contact,
  getCampaign,
  enrollInCampaign,
  listContacts,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Topic color mapping
const TOPIC_COLORS: Record<string, string> = {
  ifa: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  cda: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  estate_freeze: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  tfsa: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rrsp: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

// Format topic for display
const formatTopic = (topic: string): string => {
  const mapping: Record<string, string> = {
    ifa: "Insured Financing Arrangement",
    cda: "Capital Dividend Account",
    estate_freeze: "Estate Freeze",
    tfsa: "TFSA Strategy",
    rrsp: "RRSP Planning",
  };
  return mapping[topic] || topic.replace(/_/g, " ").toUpperCase();
};

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

export interface DripCampaignWithSteps extends DripCampaign {
  steps: DripCampaignStep[];
}

interface CampaignDetailDialogProps {
  campaign: DripCampaign;
  trigger?: React.ReactNode;
  onEnrollmentSuccess?: () => void;
}

export function CampaignDetailDialog({
  campaign,
  trigger,
  onEnrollmentSuccess,
}: CampaignDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [campaignDetails, setCampaignDetails] = useState<DripCampaignWithSteps | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const { toast } = useToast();

  // Load campaign details and contacts when dialog opens
  useEffect(() => {
    if (open && campaign.id) {
      loadCampaignDetails();
      loadContacts();
    }
  }, [open, campaign.id]);

  const loadCampaignDetails = async () => {
    setLoading(true);
    try {
      const response = await getCampaign(campaign.id);
      setCampaignDetails(response.campaign as DripCampaignWithSteps);
    } catch (error) {
      toast({
        title: "Error loading campaign",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const contactList = await listContacts();
      setContacts(contactList);
    } catch (error) {
      console.error("Failed to load contacts", error);
    }
  };

  const handleEnroll = async () => {
    if (!selectedContactId) {
      toast({
        title: "Select a contact",
        description: "Please select a contact to enroll",
        variant: "destructive",
      });
      return;
    }

    setEnrolling(true);
    try {
      await enrollInCampaign(selectedContactId, campaign.id);
      const contact = contacts.find((c) => c.id === selectedContactId);
      toast({
        title: "Enrolled successfully!",
        description: `${contact?.full_name || "Contact"} enrolled in ${campaign.name}`,
      });
      setSelectedContactId("");
      onEnrollmentSuccess?.();
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: "Could not enroll contact in campaign",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Parse content to show variable placeholders nicely
  const formatContent = (content: string) => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return `[${variable.replace(/_/g, " ")}]`;
    });
  };

  const getTopicColorClass = (topic: string) => {
    return TOPIC_COLORS[topic] || "bg-muted text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {campaign.channel === "email" ? (
                <Mail className="h-5 w-5 text-primary" />
              ) : (
                <MessageSquare className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{campaign.name}</DialogTitle>
              <DialogDescription className="line-clamp-2">
                {campaign.description}
              </DialogDescription>
            </div>
            <Badge className={getTopicColorClass(campaign.topic)}>
              {formatTopic(campaign.topic)}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Campaign Content</TabsTrigger>
            <TabsTrigger value="enroll">Enroll Contact</TabsTrigger>
          </TabsList>

          {/* Content Tab - Shows all steps/copy */}
          <TabsContent value="content" className="flex-1 overflow-hidden mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : campaignDetails?.steps && campaignDetails.steps.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {campaignDetails.steps
                    .sort((a, b) => a.step_number - b.step_number)
                    .map((step, index) => (
                      <Card key={step.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-primary text-primary-foreground"
                              >
                                Step {step.step_number}
                              </Badge>
                              {step.subject && (
                                <span className="text-sm font-medium">
                                  {step.subject}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {step.delay_days === 0
                                ? "Sent immediately"
                                : `${step.delay_days} day${step.delay_days !== 1 ? "s" : ""} after ${
                                    index === 0 ? "enrollment" : "previous step"
                                  }`}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3 max-h-40 overflow-y-auto">
                            {formatContent(step.content)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mb-4 opacity-50" />
                <p>No steps found for this campaign</p>
              </div>
            )}
          </TabsContent>

          {/* Enroll Tab - Contact selection and enrollment */}
          <TabsContent value="enroll" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Enroll a Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Contact</label>
                  <Select
                    value={selectedContactId}
                    onValueChange={setSelectedContactId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a contact to enroll..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex flex-col">
                            <span>{contact.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {contact.email || contact.phone || "No contact info"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedContactId && (
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <p className="font-medium text-sm mb-2">What will happen:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>1. Contact will be enrolled in "{campaign.name}"</li>
                      <li>
                        2. Step 1 will be sent{" "}
                        {campaignDetails?.steps?.[0]?.delay_days === 0
                          ? "immediately"
                          : `in ${campaignDetails?.steps?.[0]?.delay_days || 0} days`}
                      </li>
                      <li>3. Subsequent steps sent automatically on schedule</li>
                      <li>4. Campaign can be paused/cancelled from contact profile</li>
                    </ul>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleEnroll}
                  disabled={!selectedContactId || enrolling}
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enroll in Campaign
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignDetailDialog;
