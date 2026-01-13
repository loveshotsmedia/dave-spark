import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Mail, MessageSquare, Plus, X, Pause, Play, Clock, Target, Loader2 } from "lucide-react";
import {
  listCampaigns,
  getContactEnrollments,
  enrollInCampaign,
  unenrollFromCampaign,
  updateEnrollmentStatus,
  DripCampaign,
  DripEnrollment,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CampaignEnrollmentCardProps {
  contactId: string;
  contactName?: string;
}

// Topic color mapping
const TOPIC_COLORS: Record<string, string> = {
  ifa: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  cda: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  estate_freeze: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  tfsa: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rrsp: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function CampaignEnrollmentCard({ contactId, contactName }: CampaignEnrollmentCardProps) {
  const [enrollments, setEnrollments] = useState<DripEnrollment[]>([]);
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [contactId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enrollmentData, campaignData] = await Promise.all([
        getContactEnrollments(contactId),
        listCampaigns()
      ]);
      setEnrollments(enrollmentData.enrollments || []);
      setCampaigns(campaignData.campaigns || []);
    } catch (error) {
      toast({
        title: "Error loading campaigns",
        description: "Failed to load campaign data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get available campaigns (not already enrolled in active ones)
  const availableCampaigns = campaigns.filter(
    c => c.is_active && !enrollments.some(e => e.campaign_id === c.id && e.status === 'active')
  );

  // Enroll in campaign
  const handleEnroll = async () => {
    if (!selectedCampaign) return;

    setEnrolling(true);
    try {
      const result = await enrollInCampaign(contactId, selectedCampaign);
      if (result.success) {
        toast({
          title: "Enrolled successfully",
          description: `${contactName || 'Contact'} enrolled in campaign`
        });
        setDialogOpen(false);
        setSelectedCampaign("");
        loadData();
      } else {
        throw new Error(result.error || "Failed to enroll");
      }
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: error instanceof Error ? error.message : "Could not enroll in campaign",
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Unenroll from campaign
  const handleUnenroll = async (campaignId: string) => {
    try {
      const result = await unenrollFromCampaign(contactId, campaignId);
      if (result.success) {
        toast({
          title: "Unenrolled",
          description: "Contact removed from campaign"
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not unenroll from campaign",
        variant: "destructive"
      });
    }
  };

  // Pause/Resume campaign
  const handleTogglePause = async (enrollment: DripEnrollment) => {
    const newStatus = enrollment.status === 'paused' ? 'active' : 'paused';
    try {
      await updateEnrollmentStatus(enrollment.id, newStatus);
      toast({
        title: newStatus === 'paused' ? "Campaign paused" : "Campaign resumed",
        description: `Drip sequence ${newStatus === 'paused' ? 'paused' : 'resumed'}`
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update campaign status",
        variant: "destructive"
      });
    }
  };

  // Format next step date
  const formatNextStep = (date: string | null | undefined) => {
    if (!date) return "Pending";
    const d = new Date(date);
    const now = new Date();
    const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) return "Due now";
    if (diffHours < 24) return `In ${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `In ${diffDays}d`;
  };

  // Get campaign details for an enrollment
  const getCampaign = (campaignId: string) => campaigns.find(c => c.id === campaignId);

  if (loading) {
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
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Drip Campaigns
          </CardTitle>
          <CardDescription>
            Automated email & SMS sequences
          </CardDescription>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                Select a drip campaign to enroll {contactName || 'this contact'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {availableCampaigns
                    .filter(campaign => campaign.id && campaign.id.trim() !== "")
                    .map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <div className="flex items-center gap-2">
                          {campaign.channel === 'email' ? (
                            <Mail className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          <span>{campaign.name}</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            {campaign.topic.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedCampaign && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  {(() => {
                    const c = campaigns.find(c => c.id === selectedCampaign);
                    if (!c) return null;
                    return (
                      <>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{c.step_count} steps</Badge>
                          <Badge className={TOPIC_COLORS[c.topic] || "bg-muted"}>
                            {c.topic.replace('_', ' ')}
                          </Badge>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEnroll} disabled={!selectedCampaign || enrolling}>
                {enrolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {enrolling ? "Enrolling..." : "Enroll"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {enrollments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No active campaigns</p>
            <p className="text-sm">Enroll in a drip sequence to nurture this contact</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map(enrollment => {
              const campaign = getCampaign(enrollment.campaign_id) || enrollment.drip_campaigns;
              if (!campaign) return null;

              const progress = campaign.step_count > 0
                ? (enrollment.current_step / campaign.step_count) * 100
                : 0;

              return (
                <div
                  key={enrollment.id}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {campaign.channel === 'email' ? (
                        <Mail className="h-4 w-4 text-primary" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{campaign.name}</span>
                    </div>
                    <Badge className={STATUS_COLORS[enrollment.status] || "bg-muted"}>
                      {enrollment.status}
                    </Badge>
                  </div>

                  {/* Topic Badge */}
                  <div>
                    <Badge variant="outline" className={TOPIC_COLORS[campaign.topic] || ""}>
                      {campaign.topic.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Step {enrollment.current_step} of {campaign.step_count}</span>
                      <span>{Math.round(progress)}% complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Next Step Due */}
                  {enrollment.status === 'active' && enrollment.next_step_due_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Next step: {formatNextStep(enrollment.next_step_due_at)}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    {enrollment.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePause(enrollment)}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    )}
                    {enrollment.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePause(enrollment)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Resume
                      </Button>
                    )}
                    {(enrollment.status === 'active' || enrollment.status === 'paused') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleUnenroll(enrollment.campaign_id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Unenroll
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CampaignEnrollmentCard;
