import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./App.css";

// assets
import WiceLogo from "./assets/Wice_logo.jpg";
import hero from "./assets/hero.jpg";

// pages (lazy signup to avoid blocking)
const SignUp = lazy(() => import("./Pages/SignUp.jsx"));

// marketplace pages
import Marketplace from "./Pages/Client/Marketplace.jsx";
import ConsultantProfile from "./Pages/Client/ClientConsultantProfile.jsx";
import ClientHome from "./Pages/Client/ClientHome.jsx";

// auth + portals
import ClientLogin from "./Pages/Client/ClientLoginPage.jsx";
import ConsultantLogin from "./Pages/Consultant/ConsultantLoginPage.jsx";
import ConsultantGrantHunt from "./Pages/Consultant/ConsultantGrantHunt.jsx";
import ConsultantProfileEditor from "./Pages/Consultant/ConsultantProfile.jsx";
import Profile from "./Pages/Profile/Profile.jsx";
import ConsultantPortal from "./Pages/Consultant/ConsultantPortal.jsx";
import Chat from "./Pages/Chat/Chat.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Heading from "./Components/Heading.jsx";
import SideNav from "./Components/SideNav.jsx";

// ----------------- HOME / WELCOME PAGE -----------------
function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="card">
        {/* LEFT PANEL */}
        <section className="left">
          <img src={WiceLogo} alt="WICE logo" className="brand-logo" />

          <h1 className="title">Welcome to WICE</h1>
          <p className="subtitle">
            Sign in here to connect & explore opportunities
          </p>

          <div className="actions">
            {/* Step 1: choose client vs consultant */}
            <button
              className="btn primary"
              onClick={() => navigate("/client/login")}
            >
              Client Login
            </button>

            <button
              className="btn primary"
              onClick={() => navigate("/consultant/login")}
            >
              Consultant Login
            </button>
          </div>

          <div className="rule">
            <span className="rule-accent" />
          </div>

          <p className="signup">
            Don’t have an account?{" "}
            <Link to="/signup" className="link">
              Sign up
            </Link>
          </p>
        </section>

        {/* RIGHT PANEL */}
        <section className="right">
          <img src={hero} alt="Scenic mountains and river" className="hero" />
        </section>
      </div>
    </div>
  );
}

// ----------------- MAIN APP ROUTES -----------------
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* Step 2: dedicated login pages */}
            <Route path="/client/login" element={<ClientLogin />} />
            <Route path="/consultant/login" element={<ConsultantLogin />} />

            {/* Sign up */}
            <Route path="/signup" element={<SignUp />} />

            <Route
              path="/client/home"
              element={
                <ProtectedRoute
                  allowedRoles={["client"]}
                  fallback="/client/login"
                  element={
                    <DashboardLayout>
                      <ClientHome />
                    </DashboardLayout>
                  }
                />
              }
            />

            {/* Marketplace */}
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute
                  allowedRoles={["client", "consultant"]}
                  fallback="/client/login"
                  element={(
                    <DashboardLayout>
                      <Marketplace />
                    </DashboardLayout>
                  )}
                />
              }
            />
            <Route
              path="/consultant/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["client", "consultant"]}
                  fallback="/client/login"
                  element={(
                    <DashboardLayout>
                      <ConsultantProfile />
                    </DashboardLayout>
                  )}
                />
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute
                  allowedRoles={["client", "consultant"]}
                  fallback="/client/login"
                  element={
                    <DashboardLayout>
                      <Chat />
                    </DashboardLayout>
                  }
                />
              }
            />

            {/* Consultant tools */}
            <Route
              path="/granthunt"
              element={
                <ProtectedRoute
                  allowedRoles={["consultant"]}
                  fallback="/consultant/login"
                  element={
                    <DashboardLayout>
                      <ConsultantGrantHunt />
                    </DashboardLayout>
                  }
                />
              }
            />
            <Route
              path="/consultant/profile"
              element={
                <ProtectedRoute
                  allowedRoles={["consultant"]}
                  fallback="/consultant/login"
                  element={
                    <DashboardLayout>
                      <ConsultantProfileEditor />
                    </DashboardLayout>
                  }
                />
              }
            />
            <Route
              path="/consultant/portal"
              element={
                <ProtectedRoute
                  allowedRoles={["consultant"]}
                  fallback="/consultant/login"
                  element={
                    <DashboardLayout>
                      <ConsultantPortal />
                    </DashboardLayout>
                  }
                />
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  allowedRoles={["client"]}
                  fallback="/client/login"
                  element={(
                    <DashboardLayout>
                      <Profile />
                    </DashboardLayout>
                  )}
                />
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div style={{ padding: 24 }}>
                  <h2>Page not found</h2>
                  <p>
                    Go back <Link to="/">home</Link>.
                  </p>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

function DashboardLayout({ children }) {
  return (
    <div className="dashboard-container">
      <Heading />
      <SideNav />
      <div className="dashboard-main">{children}</div>
    </div>
  );
}

function ProtectedRoute({ allowedRoles, fallback = "/", element }) {
  const { role } = useAuth();
  const isAllowed =
    role && (!allowedRoles || allowedRoles.length === 0
      ? true
      : allowedRoles.includes(role));

  if (!isAllowed) {
    return <Navigate to={fallback} replace />;
  }

  return element;
}
