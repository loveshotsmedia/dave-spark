import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// With passphrase auth, this page just redirects to chat
export default function Auth() {
  const { isAuthenticated, isLoading, onboardingComplete } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (onboardingComplete === false) {
        navigate("/onboarding");
      } else {
        navigate("/chat");
      }
    }
  }, [isLoading, isAuthenticated, onboardingComplete, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading Dave 2.0...</p>
      </div>
    </div>
  );
}
