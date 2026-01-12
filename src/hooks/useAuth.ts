import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    setIsAuthenticated(api.isAuthenticated());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (passphrase: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      api.setPassphrase(passphrase);
      // Test the passphrase by making a simple request
      await api.getStatus();
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      api.clearPassphrase();
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.clearPassphrase();
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}