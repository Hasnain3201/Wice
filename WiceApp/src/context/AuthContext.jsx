import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

const ROLE_KEY = "wice-role";
const USER_KEY = "wice-user";
const USERDATA_KEY = "wice-userData";

const AuthContext = createContext(null);

function getInitialAuth() {
  if (typeof window === "undefined")
    return { role: null, user: null, userData: {} };

  const role = window.sessionStorage.getItem(ROLE_KEY);
  const user = JSON.parse(window.sessionStorage.getItem(USER_KEY) || "null");
  const userData = JSON.parse(
    window.sessionStorage.getItem(USERDATA_KEY) || "{}"
  );

  return { role, user, userData };
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(getInitialAuth().role);
  const [user, setUser] = useState(getInitialAuth().user);
  const [userData, setUserData] = useState(getInitialAuth().userData);

  // Persist to sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (role) window.sessionStorage.setItem(ROLE_KEY, role);
    else window.sessionStorage.removeItem(ROLE_KEY);

    if (user) window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(USER_KEY);

    if (userData)
      window.sessionStorage.setItem(USERDATA_KEY, JSON.stringify(userData));
    else window.sessionStorage.removeItem(USERDATA_KEY);
  }, [role, user, userData]);

  // login() now supports multiple user roles
  const login = (nextRole, userDataInput = {}) => {
    setRole(nextRole);
    setUser(userDataInput.user || { name: nextRole, email: "unknown" });
    setUserData(
      userDataInput.data || { saved: [], notifications: [], calendar: [] }
    );
  };

  const updateUserData = (newData) => {
    setUserData((prev) => {
      const updated = { ...prev, ...newData };
      window.sessionStorage.setItem(USERDATA_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    setUserData({});
    window.sessionStorage.clear();
  };

  const value = useMemo(
    () => ({
      role,
      user,
      userData,
      login,
      logout,
      updateUserData,
    }),
    [role, user, userData]
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
