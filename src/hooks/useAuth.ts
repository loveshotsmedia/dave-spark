import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { syncAuth, getOnboardingStatus } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // When user signs in, sync auth and check onboarding
        if (event === "SIGNED_IN" && session?.user) {
          setTimeout(async () => {
            try {
              await syncAuth();
              const status = await getOnboardingStatus();
              setOnboardingComplete(status.completed);
            } catch (error) {
              console.error("Failed to sync auth:", error);
              // Assume onboarding complete if we can't check
              setOnboardingComplete(true);
            }
          }, 0);
        }
        
        if (event === "SIGNED_OUT") {
          setOnboardingComplete(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const status = await getOnboardingStatus();
          setOnboardingComplete(status.completed);
        } catch (error) {
          console.error("Failed to get onboarding status:", error);
          setOnboardingComplete(true);
        }
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { data, error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user,
    session,
    isAuthenticated: !!session,
    isLoading,
    onboardingComplete,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };
}