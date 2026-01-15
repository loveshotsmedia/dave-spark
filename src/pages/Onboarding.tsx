import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, User, Building, Briefcase } from "lucide-react";
import { PageTransition } from "@/components/effects/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { completeOnboarding } from "@/lib/api";

export default function Onboarding() {
  const { user, isAuthenticated, isLoading: authLoading, onboardingComplete } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    role: "",
  });

  // Redirect if not authenticated or onboarding already complete
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/auth");
      } else if (onboardingComplete === true) {
        navigate("/chat");
      }
    }
  }, [isAuthenticated, authLoading, onboardingComplete, navigate]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Call the API to complete onboarding
      await completeOnboarding({
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        role: formData.role,
      });

      // Navigate to chat
      navigate("/chat");
    } catch (error) {
      console.error("Onboarding error:", error);
      // Navigate to chat regardless (backend may already have data)
      navigate("/chat");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="text-4xl font-bold text-foreground tracking-tight">WFS</span>
            <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2">
              <span className="text-sm font-semibold text-primary-foreground">Dave 2.0</span>
            </div>
          </div>
        </div>

        {/* Onboarding Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Let's get you set up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us a bit about yourself to personalize your experience.
            </p>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Dave"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Wilson"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-xl text-base font-medium mt-4"
                disabled={!formData.firstName || !formData.lastName}
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="WFS Advisory"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Financial Advisor"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-12 rounded-xl text-base font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}