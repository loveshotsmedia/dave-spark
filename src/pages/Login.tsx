import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setError("Please enter your passphrase");
      return;
    }

    setIsLoading(true);
    setError("");

    const success = await login(passphrase);

    if (success) {
      navigate("/chat");
    } else {
      setError("Invalid passphrase. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3">
            <span className="text-4xl font-bold text-foreground tracking-tight">WFS</span>
            <div className="h-8 w-px bg-border" />
            <div className="text-left">
              <p className="text-sm font-medium text-muted-foreground">Wealth & Financial</p>
              <p className="text-sm font-medium text-muted-foreground">Strategies</p>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2">
              <span className="text-sm font-semibold text-primary-foreground">Dave 2.0</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="passphrase" className="text-sm font-medium text-foreground">
                Enter Passphrase
              </label>
              <div className="relative">
                <Input
                  id="passphrase"
                  type={showPassphrase ? "text" : "password"}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Your secure passphrase"
                  className="pr-10 h-12 rounded-xl"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassphrase ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Enter as Dave
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Dave 2.0 — AI Executive Assistant
        </p>
      </div>
    </div>
  );
}