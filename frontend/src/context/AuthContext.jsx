import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getUserProfile } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profileId, setProfileId] = useState(null);
  const [riskProfile, setRiskProfile] = useState(null);

  // Resolve profile_id from supabase auth user_id
  async function resolveProfile(userId) {
    try {
      const data = await getUserProfile(userId);
      setProfileId(data.profile_id);
      setRiskProfile({
        risk_score: data.risk_score,
        risk_category: data.risk_category,
        max_equity_allocation_pct: data.max_equity_allocation_pct,
        recommended_rebalance_frequency: data.recommended_rebalance_frequency,
      });
    } catch {
      // No profile yet — user needs to onboard
      setProfileId(null);
      setRiskProfile(null);
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) resolveProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user?.id) {
          resolveProfile(session.user.id);
        } else {
          setProfileId(null);
          setRiskProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Refresh profile data (called after settings save)
  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) await resolveProfile(session.user.id);
  }

  const loading = session === undefined;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profileId,
        riskProfile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
