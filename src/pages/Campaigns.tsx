import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  MessageSquare,
  Search,
  Filter,
  Users,
  ChevronRight,
  Play,
  Pause,
  Loader2,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCampaigns, getCampaign, DripCampaign } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function Campaigns() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<DripCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCampaign, setSelectedCampaign] = useState<DripCampaign | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Filter campaigns
  useEffect(() => {
    let filtered = campaigns;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.topic.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    if (channelFilter !== "all") {
      filtered = filtered.filter((c) => c.channel === channelFilter);
    }

    if (topicFilter !== "all") {
      filtered = filtered.filter((c) => c.topic === topicFilter);
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchQuery, channelFilter, topicFilter]);

  async function fetchCampaigns() {
    setIsLoading(true);
    try {
      const result = await listCampaigns();
      setCampaigns(result.campaigns || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleViewDetails(campaign: DripCampaign) {
    setSelectedCampaign(campaign);
    setIsDetailsOpen(true);
    setIsLoadingDetails(true);
    try {
      const result = await getCampaign(campaign.id);
      setCampaignDetails(result.campaign);
    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  // Get unique topics for filter
  const topics = [...new Set(campaigns.map((c) => c.topic))];

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
              <p className="text-sm text-muted-foreground">
                Manage drip campaigns and enrollments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchCampaigns}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/chat")}>
                Back to Chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{campaigns.length}</div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-success">
                {campaigns.filter((c) => c.is_active).length}
              </div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {campaigns.filter((c) => c.channel === "email").length}
              </div>
              <p className="text-sm text-muted-foreground">Email Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {campaigns.filter((c) => c.channel === "sms").length}
              </div>
              <p className="text-sm text-muted-foreground">SMS Campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No campaigns found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || channelFilter !== "all" || topicFilter !== "all"
                ? "Try adjusting your filters"
                : "No drip campaigns have been created yet"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleViewDetails(campaign)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {campaign.channel === "sms" ? (
                          <MessageSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Mail className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{campaign.name}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">
                          {campaign.channel}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={campaign.is_active ? "default" : "secondary"}
                      className={campaign.is_active ? "bg-success text-success-foreground" : ""}
                    >
                      {campaign.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {campaign.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{campaign.topic}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {campaign.step_count} steps
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {campaign.channel === "sms" ? (
                            <MessageSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Mail className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {campaign.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{campaign.channel}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.topic}</Badge>
                    </TableCell>
                    <TableCell>{campaign.step_count}</TableCell>
                    <TableCell>
                      <Badge
                        variant={campaign.is_active ? "default" : "secondary"}
                        className={campaign.is_active ? "bg-success text-success-foreground" : ""}
                      >
                        {campaign.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(campaign)}
                      >
                        View
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* Campaign Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCampaign?.channel === "sms" ? (
                <MessageSquare className="h-5 w-5" />
              ) : (
                <Mail className="h-5 w-5" />
              )}
              {selectedCampaign?.name}
            </DialogTitle>
            <DialogDescription>{selectedCampaign?.description}</DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedCampaign?.topic}</Badge>
                <Badge variant="secondary" className="capitalize">
                  {selectedCampaign?.channel}
                </Badge>
                <Badge
                  className={
                    selectedCampaign?.is_active
                      ? "bg-success text-success-foreground"
                      : ""
                  }
                >
                  {selectedCampaign?.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Campaign Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Steps:</span>
                    <span className="ml-2 font-medium">{selectedCampaign?.step_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Channel:</span>
                    <span className="ml-2 font-medium capitalize">
                      {selectedCampaign?.channel}
                    </span>
                  </div>
                </div>
              </div>

              {campaignDetails?.steps && (
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Campaign Steps</h4>
                  <div className="space-y-2">
                    {campaignDetails.steps.map((step: any, index: number) => (
                      <div
                        key={step.id || index}
                        className="flex items-center gap-3 p-2 rounded bg-muted/50"
                      >
                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.subject || step.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Delay: {step.delay_days || 0} days
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
