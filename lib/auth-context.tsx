"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuthState, signOutUser, getGoogleRedirectResult } from "@/firebase/auth";
import { isFirebaseConfigured } from "@/firebase/client";
import { saveUserProfile } from "@/firebase/firestore";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provides firebase auth state to the entire app; subscribes to onAuthStateChanged
// IMPORTANT: Handles Google redirect results FIRST before auth state subscription
// This ensures redirect results are captured before being consumed by auth state changes
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [handlingRedirect, setHandlingRedirect] = useState(true);

  // Handle Google redirect result FIRST (before auth state subscription)
  // This must happen immediately when the app loads to capture redirect results
  useEffect(() => {
    if (typeof window === "undefined" || !isFirebaseConfigured()) {
      setHandlingRedirect(false);
      return;
    }

    let mounted = true;
    
    async function handleRedirect() {
      try {
        console.log("[AuthProvider] Checking for Google redirect result...");
        const result = await getGoogleRedirectResult();
        
        if (!mounted) return;
        
        if (result && result.user) {
          console.log("[AuthProvider] ✅ Google redirect result found, saving profile...");
          const user = result.user;
          
          // Save user profile to Firestore
          try {
            await saveUserProfile(user.uid, {
              name: user.displayName || user.email?.split("@")[0] || "User",
              phone: undefined,
              email: user.email || "",
            });
            console.log("[AuthProvider] ✅ Profile saved successfully");
          } catch (profileError: any) {
            console.error("[AuthProvider] ❌ Failed to save profile:", profileError);
            // Continue anyway - user is authenticated even if profile save fails
          }
        } else {
          console.log("[AuthProvider] ℹ️ No redirect result (normal if not returning from Google)");
        }
      } catch (error: any) {
        console.error("[AuthProvider] ❌ Error handling redirect result:", error);
      } finally {
        if (mounted) {
          setHandlingRedirect(false);
        }
      }
    }
    
    // Small delay to ensure Firebase is initialized, then check redirect
    const timer = setTimeout(() => {
      handleRedirect();
    }, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Subscribe to auth state changes AFTER redirect handling
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return () => {};
    }
    
    // Wait for redirect handling to complete before subscribing to auth state
    if (handlingRedirect) {
      return;
    }
    
    console.log("[AuthProvider] Setting up auth state subscription...");
    const unsubscribe = subscribeToAuthState((u) => {
      console.log("[AuthProvider] Auth state changed:", u ? `User: ${u.uid}` : "No user");
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [handlingRedirect]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signOut: async () => {
      await signOutUser();
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


