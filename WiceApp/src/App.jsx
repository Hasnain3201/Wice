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

// Assets
import WiceLogo from "./assets/Wice_logo.jpg";
import hero from "./assets/hero.jpg";

// Lazy + pages
const SignUp = lazy(() => import("./Pages/SignUp.jsx"));
import Marketplace from "./Pages/Client/Marketplace.jsx";
import ClientProfilePage from "./Pages/Client/ClientProfile.jsx";
import ClientHome from "./Pages/Client/ClientHome.jsx";
import ClientLogin from "./Pages/Client/ClientLoginPage.jsx";
import ConsultantLogin from "./Pages/Consultant/ConsultantLoginPage.jsx";
import ConsultantGrantHunt from "./Pages/Consultant/ConsultantGrantHunt.jsx";
import ConsultantProfileEditor from "./Pages/Consultant/ConsultantProfile.jsx";
import ConsultantPortal from "./Pages/Consultant/ConsultantPortal.jsx";
import ConsultantProfile from "./Pages/Consultant/ConsultantProfile.jsx"
import Chat from "./Pages/Chat/Chat.jsx";
import ProjectsHome from "./Pages/ProjectsPage/ProjectsHome.jsx";
import Settings from "./Pages/Settings.jsx";
import Saved from "./Pages/Saved.jsx";
import Notifications from "./Pages/Notifications.jsx";
import CalendarPage from "./Pages/Calendar.jsx";
import BillingClientSide from "./Pages/Client/BillingClientSide.jsx";

// Admin
import AdminLoginPage from "./Pages/Admin/AdminLoginPage.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboardPage.jsx";

// Consultant Profile Builder
import ProfileBuilder from "./Pages/profilebuilder/ProfileBuilder.jsx";

//Client Profile Builder
import ClientIntroPage from "./Pages/profilebuilder/sections/ClientIntroPage.jsx";
import ClientProfileBuilder from "./Pages/profilebuilder/sections/ClientProfileBuilder.jsx";

// Contexts
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";

// Components
import Heading from "./Components/Heading.jsx";
import SideNav from "./Components/SideNav.jsx";

// Landing Page
function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="card">
        <section className="left">
          <img src={WiceLogo} alt="WICE logo" className="brand-logo" />
          <h1 className="title">Welcome to WICE</h1>
          <p className="subtitle">
            Sign in here to connect, manage, and explore opportunities
          </p>
          <div className="actions">
            <button className="btn primary" onClick={() => navigate("/client/login")}>
              Client Login
            </button>
            <button className="btn primary" onClick={() => navigate("/consultant/login")}>
              Consultant Login
            </button>
            <button className="btn primary" onClick={() => navigate("/admin/login")}>
              Admin Login
            </button>
          </div>
          <div className="rule" />
          <p className="signup">
            Don’t have an account? <Link to="/signup" className="link">Sign up</Link>
          </p>
        </section>
        <section className="right">
          <img src={hero} alt="Scenic mountains and river" className="hero" />
        </section>
      </div>
    </div>
  );
}

// Layout + Protected Route
function DashboardLayout({ children }) {
  return (
    <div className="dashboard-container">
      <Heading />
      <SideNav />
      <div className="dashboard-main">{children}</div>
    </div>
  );
}

// ⭐⭐⭐ FIXED VERSION — THIS IS THE ONLY CHANGE YOU NEEDED ⭐⭐⭐
function ProtectedRoute({ allowedRoles, fallback = "/", element }) {
  const { role, user, loading, profile } = useAuth();
  const location = window.location.pathname;

  // 1. Still loading → show loader
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Loading…</h2>
        <p>Checking your access.</p>
      </div>
    );
  }

  // 2. If user not logged in → redirect
  if (!user) return <Navigate to={fallback} replace />;

  // 3. SPECIAL FIX:
  // Allow consultants into /consultant/profile-builder EVEN IF role has not finished loading yet.
  if (location === "/consultant/profile-builder" ) {
    return element;
  }

  // 4. Block revoked accounts
  if (profile?.status === "revoked") {
    return (
      <div style={{ padding: 24 }}>
        <h2>Account access revoked</h2>
        <p>Your WICE account has been disabled. Contact support.</p>
      </div>
    );
  }

  // 5. Standard role validation
  const isAllowed =
    !allowedRoles?.length || (role && allowedRoles.includes(role));

  return isAllowed ? element : <Navigate to={fallback} replace />;
}

// Main App Router
export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
            <Routes>
              {/* Landing */}
              <Route path="/" element={<HomePage />} />

              {/* Logins */}
              <Route path="/client/login" element={<ClientLogin />} />
              <Route path="/consultant/login" element={<ConsultantLogin />} />
              <Route path="/employee/login" element={<ConsultantLogin />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/signup" element={<SignUp />} />

              {/* DEVELOPER TEST ROUTE — ALWAYS UNPROTECTED */}
              <Route path="/test/profile-builder" element={<ProfileBuilder />} />

              {/* Consultant Profile Builder */}
              <Route
                path="/consultant/profile-builder"
                element={
                  <ProtectedRoute
                    allowedRoles={["consultant"]}
                    fallback="/consultant/login"
                    element={<ProfileBuilder />}
                  />
                }
              />

              {/* CLIENT PROFILE BUILDER */}
              <Route
                path="/client/profile-builder/intro"
                element={<ClientIntroPage />}
              />

              <Route
                path="/client/profile-builder"
                element={<ClientProfileBuilder />}
              />

              {/* Client Dashboard */}
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

              {/* Shared Pages */}
              {[
                { path: "/marketplace", element: <Marketplace />, roles: ["client", "consultant", "admin"] },
                { path: "/notifications", element: <Notifications />, roles: ["client", "consultant"] },
                { path: "/saved", element: <Saved />, roles: ["client", "consultant", "admin"] },
                { path: "/chat", element: <Chat />, roles: ["client", "consultant", "admin"] },
                { path: "/projects", element: <ProjectsHome />, roles: ["client", "consultant"] },
                { path: "/calendar", element: <CalendarPage />, roles: ["client", "consultant"] },
                { path: "/settings", element: <Settings />, roles: ["client", "consultant", "admin"] },
              ].map(({ path, element, roles }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute
                      allowedRoles={roles}
                      fallback="/client/login"
                      element={<DashboardLayout>{element}</DashboardLayout>}
                    />
                  }
                />
              ))}

              {/* Consultant Pages */}
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
                path="/granthunt"
                element={
                  <ProtectedRoute
                    allowedRoles={["consultant", "admin"]}
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
                path="/consultant/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={["client", "consultant"]}
                    fallback="/client/login"
                    element={
                      <DashboardLayout>
                        <ConsultantProfile/>
                      </DashboardLayout>
                    }
                  />
                }
              />

              {/* Client Profile + Billing */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute
                    allowedRoles={["client"]}
                    fallback="/client/login"
                    element={
                      <DashboardLayout>
                        <ClientProfilePage />
                      </DashboardLayout>
                    }
                  />
                }
              />

              <Route
                path="/client/billing"
                element={
                  <ProtectedRoute
                    allowedRoles={["client"]}
                    fallback="/client/login"
                    element={
                      <DashboardLayout>
                        <BillingClientSide />
                      </DashboardLayout>
                    }
                  />
                }
              />

              {/* Admin Dashboard */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin"]}
                    fallback="/admin/login"
                    element={
                      <DashboardLayout>
                        <AdminDashboard />
                      </DashboardLayout>
                    }
                  />
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div style={{ padding: 24 }}>
                    <h2>Page not found</h2>
                    <p>Go back <Link to="/">home</Link>.</p>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}