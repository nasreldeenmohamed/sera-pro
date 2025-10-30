"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuthState, signOutUser } from "@/firebase/auth";
import { isFirebaseConfigured } from "@/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provides firebase auth state to the entire app; subscribes to onAuthStateChanged
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // If Firebase is not configured (e.g., missing envs), avoid crashing
      setLoading(false);
      return () => {};
    }
    const unsubscribe = subscribeToAuthState((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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


