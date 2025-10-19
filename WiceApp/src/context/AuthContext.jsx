import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

const STORAGE_KEY = "wice-role";
const AuthContext = createContext(null);

function getInitialRole() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(getInitialRole);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (role) {
      window.sessionStorage.setItem(STORAGE_KEY, role);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [role]);

  const loginAs = (nextRole) => {
    setRole(nextRole);
  };

  const logout = () => {
    setRole(null);
  };

  const value = useMemo(
    () => ({
      role,
      loginAs,
      logout,
    }),
    [role]
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
