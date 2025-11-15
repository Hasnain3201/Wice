/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const TEST_SESSION_KEY = "wice-test-session";

function getStoredTestSession() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(TEST_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    window.sessionStorage.removeItem(TEST_SESSION_KEY);
    if (import.meta.env.DEV) {
      console.warn("Failed to parse stored test session:", error);
    }
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedTestSession = getStoredTestSession();

  const [user, setUser] = useState(storedTestSession?.user ?? null);
  const [role, setRole] = useState(storedTestSession?.role ?? null);
  const [profile, setProfile] = useState(storedTestSession?.profile ?? null);
  const [isTestSession, setIsTestSession] = useState(Boolean(storedTestSession));
  const [loading, setLoading] = useState(true);

  const applyTestSession = useCallback((session) => {
    if (!session) return;

    setIsTestSession(true);
    setUser(session.user);
    setRole(session.role);
    setProfile(session.profile);
    setLoading(false);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        TEST_SESSION_KEY,
        JSON.stringify(session)
      );
    }
  }, []);

  const clearTestSession = useCallback(() => {
    setIsTestSession(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(TEST_SESSION_KEY);
    }
  }, []);

  const restoreTestSession = useCallback(() => {
    const stored = getStoredTestSession();
    if (!stored) {
      clearTestSession();
      return null;
    }
    applyTestSession(stored);
    return stored;
  }, [applyTestSession, clearTestSession]);

  const loadProfile = useCallback(
    async (firebaseUser) => {
      if (!firebaseUser) {
        const restored = restoreTestSession();
        if (!restored) {
          setUser(null);
          setRole(null);
          setProfile(null);
        } else {
          return restored.profile;
        }
        setLoading(false);
        return null;
      }

      setLoading(true);
      try {
        const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = snapshot.exists() ? snapshot.data() : null;
        const normalized = data
          ? { ...data, hiddenChats: data.hiddenChats || {} }
          : null;

        clearTestSession();
        setUser(firebaseUser);
        setProfile(normalized);
        setRole(normalized?.accountType || normalized?.role || null);

        if (!normalized && import.meta.env.DEV) {
          console.warn(
            `No profile found for uid ${firebaseUser.uid}. Check Firestore "users" collection.`
          );
        }

        return normalized;
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setUser(firebaseUser);
        setProfile(null);
        setRole(null);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [clearTestSession, restoreTestSession]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadProfile(firebaseUser).catch((error) => {
        if (import.meta.env.DEV) {
          console.error("Auth state listener error:", error);
        }
      });
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const loginWithEmail = useCallback(
    async (email, password) => {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const data = await loadProfile(credentials.user);
      return { credentials, profile: data };
    },
    [loadProfile]
  );

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const restored = restoreTestSession();
      if (restored) {
        return restored.profile;
      }
      setProfile(null);
      setRole(null);
      return null;
    }
    return loadProfile(currentUser);
  }, [loadProfile, restoreTestSession]);

  const setTestSession = useCallback(
    ({ email, fullName = "Admin Tester" }) => {
      const session = {
        user: {
          uid: `test-admin-${Date.now()}`,
          email,
        },
        role: "admin",
        profile: {
          fullName,
          email,
          role: "admin",
          accountType: "admin",
          hiddenChats: {},
        },
      };

      applyTestSession(session);
      return session;
    },
    [applyTestSession]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error signing out:", error);
      }
    } finally {
      clearTestSession();
      setUser(null);
      setRole(null);
      setProfile(null);
      setLoading(false);
    }
  }, [clearTestSession]);

  const value = useMemo(
    () => ({
      user,
      role,
      profile,
      loading,
      isTestSession,
      loginWithEmail,
      refreshProfile,
      setTestSession,
      logout,
    }),
    [
      user,
      role,
      profile,
      loading,
      isTestSession,
      loginWithEmail,
      refreshProfile,
      setTestSession,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}