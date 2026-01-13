import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTrustBuilderView, submitTrustBuilderFeedback } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  MessageSquare,
  BookOpen,
  Send,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";

// Educational content mapping
const EDUCATIONAL_CONTENT: Record<string, { title: string; description: string }> = {
  estate_freeze: {
    title: "What is an Estate Freeze?",
    description: "An estate freeze is a strategy that locks in the current value of your business or investments for tax purposes, while allowing future growth to pass to your children or family trust.",
  },
  family_trust: {
    title: "Understanding Family Trusts",
    description: "A family trust is a legal arrangement that holds assets for the benefit of family members. It provides flexibility in distributing income and can protect assets from creditors.",
  },
  succession_planning: {
    title: "Succession Planning Basics",
    description: "Succession planning ensures your business and wealth transfer smoothly to the next generation, minimizing taxes and family conflicts while preserving your legacy.",
  },
  ifa: {
    title: "Insured Financing Arrangements",
    description: "An IFA uses corporate-owned life insurance as collateral for loans, providing tax-efficient access to wealth while maintaining insurance protection.",
  },
  cda: {
    title: "Capital Dividend Account",
    description: "The CDA allows corporations to distribute certain tax-free amounts to shareholders, including the non-taxable portion of capital gains.",
  },
  corporate_restructuring: {
    title: "Corporate Restructuring",
    description: "Corporate restructuring involves reorganizing a company's structure, operations, or finances to improve efficiency, reduce costs, or prepare for succession.",
  },
  tax_planning: {
    title: "Tax Planning Strategies",
    description: "Strategic tax planning helps minimize your tax burden legally through proper timing of income, deductions, and use of available credits and exemptions.",
  },
};

// Case type display names
const CASE_TYPE_LABELS: Record<string, string> = {
  estate_planning: "Estate Planning",
  corporate_restructuring: "Corporate Restructuring",
  insurance: "Insurance Planning",
  investment: "Investment Strategy",
  succession: "Succession Planning",
  tax_planning: "Tax Planning",
  general: "Financial Planning",
};

export default function TrustBuilderView() {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [contactName, setContactName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [caseSummary, setCaseSummary] = useState<{
    caseName: string;
    caseType: string;
    status: string;
    clientIntent: string;
  } | null>(null);
  const [strategies, setStrategies] = useState<unknown[]>([]);
  const [educationalTopics, setEducationalTopics] = useState<string[]>([]);

  // Question form
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionSent, setQuestionSent] = useState(false);

  useEffect(() => {
    if (token) {
      loadView();
    }
  }, [token]);

  const loadView = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const result = await getTrustBuilderView(token);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.contact) {
        setContactName(`${result.contact.firstName} ${result.contact.lastName}`);
      }
      setWelcomeMessage(result.welcomeMessage || "");
      setCaseSummary(result.caseSummary || null);
      setStrategies(result.strategies || []);
      setEducationalTopics(result.educationalTopics || []);
    } catch (err) {
      setError("Unable to load this page. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!token || !question.trim()) return;

    setIsSubmitting(true);
    try {
      await submitTrustBuilderFeedback(token, {
        type: "question",
        content: question,
      });
      setQuestionSent(true);
      setQuestion("");
      toast.success("Your question has been sent to Dave");
    } catch (err) {
      toast.error("Failed to send your question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a365d]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            {/* WFS Logo placeholder */}
            <div className="w-16 h-16 mx-auto mb-6 bg-[#1a365d] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">WFS</span>
            </div>

            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-semibold text-[#2d3748] mb-2">
              This link is no longer available
            </h1>
            <p className="text-muted-foreground mb-6">
              The link you're trying to access has expired or is invalid.
              Please contact Dave Watson for a new link to view your case information.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full bg-[#1a365d] hover:bg-[#1a365d]/90">
                <a href="mailto:dave@wfs.ca">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Dave Watson
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="tel:+12045551234">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Office
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-[#1a365d] text-white py-6">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">WFS</span>
            </div>
            <div>
              <h1 className="font-semibold">WFS Wealth & Financial Strategies</h1>
              <p className="text-sm text-white/80">Your Planning Summary</p>
            </div>
          </div>

          {contactName && (
            <h2 className="text-2xl font-light">
              Hello, <span className="font-semibold">{contactName.split(" ")[0]}</span>
            </h2>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Message */}
        {welcomeMessage && (
          <Card className="border-l-4 border-l-[#c9a227]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1a365d] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  DW
                </div>
                <div>
                  <p className="font-medium text-[#2d3748] mb-1">From Dave Watson</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{welcomeMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Case Summary */}
        {caseSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1a365d]">Your Planning Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Case:</span>
                  <span className="font-medium">{caseSummary.caseName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="font-normal">
                    {CASE_TYPE_LABELS[caseSummary.caseType] || caseSummary.caseType}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-[#38a169] hover:bg-[#38a169]">
                    {caseSummary.status === "active" ? "Active" : caseSummary.status}
                  </Badge>
                </div>
              </div>

              {caseSummary.clientIntent && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Your Goals:</p>
                  <p className="text-[#2d3748] italic">"{caseSummary.clientIntent}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Strategies */}
        {strategies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1a365d]">Strategies We're Exploring</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {strategies.map((strategy, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#38a169] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-[#2d3748]">
                        {typeof strategy === "object" && strategy !== null
                          ? (strategy as { name?: string }).name || String(strategy)
                          : String(strategy)}
                      </p>
                      {typeof strategy === "object" && strategy !== null && (strategy as { description?: string }).description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {(strategy as { description: string }).description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Educational Content */}
        {educationalTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1a365d] flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learn More
              </CardTitle>
              <CardDescription>
                Understanding these concepts will help with your planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {educationalTopics.map((topic) => {
                  const content = EDUCATIONAL_CONTENT[topic];
                  if (!content) return null;

                  return (
                    <div key={topic} className="p-4 bg-[#f8f9fa] rounded-lg">
                      <h4 className="font-medium text-[#1a365d] mb-1">{content.title}</h4>
                      <p className="text-sm text-muted-foreground">{content.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1a365d] flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Have Questions?
            </CardTitle>
            <CardDescription>
              Your question will be sent directly to Dave and he'll respond personally.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questionSent ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 mx-auto text-[#38a169] mb-3" />
                <p className="font-medium text-[#2d3748]">Thank you!</p>
                <p className="text-muted-foreground">
                  Dave will review your question and get back to you soon.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setQuestionSent(false)}
                >
                  Ask Another Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button
                  onClick={handleSubmitQuestion}
                  disabled={isSubmitting || !question.trim()}
                  className="w-full bg-[#1a365d] hover:bg-[#1a365d]/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Question to Dave
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a365d] text-white py-8 mt-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="font-bold">WFS</span>
            </div>
            <div>
              <p className="font-semibold">WFS Wealth & Financial Strategies</p>
              <p className="text-sm text-white/70">Winnipeg, Manitoba</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-white/80 mb-4">
            <a href="mailto:dave@wfs.ca" className="hover:text-white flex items-center gap-1">
              <Mail className="h-4 w-4" />
              dave@wfs.ca
            </a>
            <a href="tel:+12045551234" className="hover:text-white flex items-center gap-1">
              <Phone className="h-4 w-4" />
              (204) 555-1234
            </a>
          </div>

          <p className="text-xs text-white/50 pt-4 border-t border-white/10">
            This page contains confidential information prepared specifically for you.
            Please do not share this link with others.
          </p>
        </div>
      </footer>
    </div>
  );
}
