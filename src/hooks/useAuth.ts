import { useState, useEffect, useCallback } from "react";
import { syncAuth, getOnboardingStatus } from "@/lib/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we can reach the API (validates the hardcoded passphrase)
    const checkAuth = async () => {
      try {
        await syncAuth();
        const status = await getOnboardingStatus();
        setOnboardingComplete(status.completed);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        // Even if sync fails, we're "authenticated" with the passphrase
        setIsAuthenticated(true);
        setOnboardingComplete(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signOut = useCallback(async () => {
    // With passphrase auth, there's no real sign out
    // Just redirect to home
    window.location.href = "/";
    return { error: null };
  }, []);

  return {
    user: isAuthenticated ? { email: "authenticated" } : null,
    session: isAuthenticated ? {} : null,
    isAuthenticated,
    isLoading,
    onboardingComplete,
    signOut,
  };
}
