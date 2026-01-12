import { useState, useEffect, useCallback } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(true);

  // With passphrase auth, we're always authenticated
  useEffect(() => {
    setIsAuthenticated(true);
    setOnboardingComplete(true);
    setIsLoading(false);
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
