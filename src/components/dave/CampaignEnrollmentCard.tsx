import { useState, useEffect } from "react";
import { Mail, MessageSquare, Play, Pause, X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listCampaigns,
  getContactEnrollments,
  enrollInCampaign,
  unenrollFromCampaign,
  DripCampaign,
  DripEnrollment,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface CampaignEnrollmentCardProps {
  contactId: string;
  contactName: string;
}

export function CampaignEnrollmentCard({ contactId, contactName }: CampaignEnrollmentCardProps) {
  const [enrollments, setEnrollments] = useState<DripEnrollment[]>([]);
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [contactId]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [enrollmentsRes, campaignsRes] = await Promise.all([
        getContactEnrollments(contactId),
        listCampaigns(),
      ]);
      setEnrollments(enrollmentsRes.enrollments || []);
      setCampaigns(campaignsRes.campaigns || []);
    } catch (error) {
      console.error("Failed to fetch campaign data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEnroll() {
    if (!selectedCampaign) return;
    
    setIsEnrolling(true);
    try {
      const result = await enrollInCampaign(contactId, selectedCampaign);
      if (result.success) {
        toast({
          title: "Enrolled successfully",
          description: `${contactName} has been enrolled in the campaign`,
        });
        setIsDialogOpen(false);
        setSelectedCampaign("");
        fetchData();
      } else {
        throw new Error(result.error || "Failed to enroll");
      }
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: error instanceof Error ? error.message : "Failed to enroll in campaign",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  }

  async function handleUnenroll(campaignId: string) {
    try {
      const result = await unenrollFromCampaign(contactId, campaignId);
      if (result.success) {
        toast({
          title: "Unenrolled successfully",
          description: `${contactName} has been removed from the campaign`,
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: "Unenrollment failed",
        description: "Failed to remove from campaign",
        variant: "destructive",
      });
    }
  }

  const enrolledCampaignIds = enrollments.map((e) => e.campaign_id);
  const availableCampaigns = campaigns.filter(
    (c) => c.is_active && !enrolledCampaignIds.includes(c.id)
  );

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "completed":
        return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Drip Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Drip Campaigns
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={availableCampaigns.length === 0}>
              <Plus className="h-4 w-4 mr-1" />
              Enroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll in Campaign</DialogTitle>
              <DialogDescription>
                Select a drip campaign to enroll {contactName} in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {availableCampaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex items-center gap-2">
                        {campaign.channel === "email" ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        <span>{campaign.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({campaign.step_count} steps)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCampaign && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  {(() => {
                    const campaign = campaigns.find((c) => c.id === selectedCampaign);
                    return campaign ? (
                      <div className="space-y-1">
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{campaign.topic}</Badge>
                          <Badge variant="secondary">
                            {campaign.channel === "email" ? "Email" : "SMS"}
                          </Badge>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEnroll} disabled={!selectedCampaign || isEnrolling}>
                  {isEnrolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enroll
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Not enrolled in any campaigns
          </p>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {enrollment.drip_campaigns?.channel === "sms" ? (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {enrollment.drip_campaigns?.name || "Unknown Campaign"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Step {enrollment.current_step} of {enrollment.drip_campaigns?.step_count || "?"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(enrollment.status)}
                  {enrollment.status === "active" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleUnenroll(enrollment.campaign_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
