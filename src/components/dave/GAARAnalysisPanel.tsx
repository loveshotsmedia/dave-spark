import { useState } from "react";
import { AlertTriangle, Shield, Scale, Loader2, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SlidePanel } from "./SlidePanel";
import { analyzeGAAR, getGAARCases, GAARAnalysisResult, GAARCase } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GAARAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const RISK_ICONS: Record<string, React.ReactNode> = {
  LOW: <Shield className="h-4 w-4" />,
  MEDIUM: <AlertTriangle className="h-4 w-4" />,
  HIGH: <AlertTriangle className="h-4 w-4" />,
  CRITICAL: <AlertTriangle className="h-4 w-4" />,
};

export function GAARAnalysisPanel({ isOpen, onClose }: GAARAnalysisPanelProps) {
  const [scenario, setScenario] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GAARAnalysisResult | null>(null);
  const [casesOpen, setCasesOpen] = useState(false);
  const [cases, setCases] = useState<GAARCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  const handleAnalyze = async () => {
    if (!scenario.trim()) {
      toast({ title: "Enter a scenario", description: "Please describe the tax planning scenario to analyze", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await analyzeGAAR(scenario);
      setResult(res);
    } catch (err) {
      console.error(err);
      toast({ title: "Analysis failed", description: "Unable to analyze GAAR risk", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadCases = async () => {
    if (cases.length > 0) return;
    setLoadingCases(true);
    try {
      const res = await getGAARCases();
      setCases(res.cases || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCases(false);
    }
  };

  return (
    <SlidePanel title="GAAR Compliance Analysis" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Analyze Tax Planning Scenario
            </CardTitle>
            <CardDescription>
              Enter a tax planning scenario to analyze for GAAR (General Anti-Avoidance Rule) risk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scenario">Scenario Description</Label>
              <Textarea
                id="scenario"
                placeholder="Describe the tax planning strategy... e.g., 'Estate freeze with section 85 rollover to holding company followed by series of dividends to family trust'"
                rows={5}
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Analyze GAAR Risk
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <>
            {/* Risk Level Banner */}
            <Card className={cn("border-2", result.riskLevel === "CRITICAL" && "border-red-500", result.riskLevel === "HIGH" && "border-orange-500", result.riskLevel === "MEDIUM" && "border-yellow-500", result.riskLevel === "LOW" && "border-green-500")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", RISK_COLORS[result.riskLevel])}>
                      {RISK_ICONS[result.riskLevel]}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GAAR Risk Level</p>
                      <p className="text-xl font-bold">{result.riskLevel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-2xl font-bold">{result.riskScore}/100</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Triggered Red Flags */}
            {result.triggeredRedFlags && result.triggeredRedFlags.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Triggered Red Flags ({result.triggeredRedFlags.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.triggeredRedFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-destructive mt-1">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Relevant Cases */}
            {result.relevantCases && result.relevantCases.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Relevant Case Law ({result.relevantCases.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.relevantCases.map((c, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.citation}</p>
                        <p className="text-sm mt-1">{c.relevance}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ITA Sections */}
            {result.itaSections && result.itaSections.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Relevant ITA Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.itaSections.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {typeof s === "string" ? s : `${s.section}: ${s.title}`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-primary">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Safe Harbors */}
            {result.safeHarbors && result.safeHarbors.length > 0 && (
              <Card className="border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Shield className="h-4 w-4" />
                    Safe Harbor Alternatives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.safeHarbors.map((harbor, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                        <span>{harbor}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Landmark Cases Reference */}
        <Collapsible open={casesOpen} onOpenChange={setCasesOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => {
                if (!casesOpen) loadCases();
              }}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Landmark GAAR Cases Reference
              </span>
              {casesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {loadingCases ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : cases.length > 0 ? (
              cases.map((c, i) => (
                <Card key={i} className="text-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.citation} ({c.year})</p>
                      </div>
                      <Badge variant={c.outcome === "Taxpayer" ? "default" : "secondary"} className="text-xs">
                        {c.outcome}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{c.principle}</p>
                    {c.key_quote && (
                      <blockquote className="border-l-2 border-primary pl-3 italic text-xs text-muted-foreground">
                        "{c.key_quote}"
                      </blockquote>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No cases loaded</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SlidePanel>
  );
}
