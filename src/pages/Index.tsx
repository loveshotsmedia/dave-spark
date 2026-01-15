import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isLoading, onboardingComplete } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (onboardingComplete === false) {
        navigate("/onboarding");
      } else {
        navigate("/chat");
      }
    }
  }, [isLoading, onboardingComplete, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
    </div>
  );
};

export default Index;