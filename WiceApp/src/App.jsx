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

import WiceLogo from "./assets/Wice_logo.jpg";
import hero from "./assets/hero.jpg";

const SignUp = lazy(() => import("./Pages/SignUp.jsx"));
import Marketplace from "./Pages/Client/Marketplace.jsx";
import ConsultantProfile from "./Pages/Client/ClientConsultantProfile.jsx";
import ClientHome from "./Pages/Client/ClientHome.jsx";
import ClientLogin from "./Pages/Client/ClientLoginPage.jsx";
import ConsultantLogin from "./Pages/Consultant/ConsultantLoginPage.jsx";
import ConsultantGrantHunt from "./Pages/Consultant/ConsultantGrantHunt.jsx";
import ConsultantProfileEditor from "./Pages/Consultant/ConsultantProfile.jsx";
import ConsultantPortal from "./Pages/Consultant/ConsultantPortal.jsx";
import Profile from "./Pages/Profile/Profile.jsx";
import Chat from "./Pages/Chat/Chat.jsx";
import ProjectsHome from "./Pages/ProjectsPage/ProjectsHome.jsx";
import Settings from "./Pages/Settings.jsx";
import Saved from "./Pages/Saved.jsx";
import Notifications from "./Pages/Notifications.jsx";
import CalendarPage from "./Pages/Calendar.jsx";


import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Heading from "./Components/Heading.jsx";
import SideNav from "./Components/SideNav.jsx";

function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="card">
        <section className="left">
          <img src={WiceLogo} alt="WICE logo" className="brand-logo" />
          <h1 className="title">Welcome to WICE</h1>
          <p className="subtitle">
            Sign in here to connect & explore opportunities
          </p>
          <div className="actions">
            <button className="btn primary" onClick={() => navigate("/client/login")}>
              Client Login
            </button>
            <button className="btn primary" onClick={() => navigate("/consultant/login")}>
              Consultant Login
            </button>
          </div>
          <div className="rule"><span className="rule-accent" /></div>
          <p className="signup">
            Don’t have an account?{" "}
            <Link to="/signup" className="link">
              Sign up
            </Link>
          </p>
        </section>
        <section className="right">
          <img src={hero} alt="Scenic mountains and river" className="hero" />
        </section>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/client/login" element={<ClientLogin />} />
            <Route path="/consultant/login" element={<ConsultantLogin />} />
            <Route path="/signup" element={<SignUp />} />

            <Route
              path="/client/home"
              element={
                <ProtectedRoute
                  allowedRoles={["client"]}
                  fallback="/client/login"
                  element={<DashboardLayout><ClientHome /></DashboardLayout>}
                />
              }
            />

            {/* Shared routes for both roles */}
            {[
              { path: "/marketplace", element: <Marketplace /> },
              { path: "/notifications", element: <Notifications /> },
              { path: "/saved", element: <Saved /> },
              { path: "/chat", element: <Chat /> },
              { path: "/projects", element: <ProjectsHome /> },
              { path: "/calendar", element: <CalendarPage /> },
              { path: "/settings", element: <Settings /> },
            ].map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute
                    allowedRoles={["client", "consultant"]}
                    fallback="/client/login"
                    element={<DashboardLayout>{element}</DashboardLayout>}
                  />
                }
              />
            ))}

            {/* Consultant-specific */}
            <Route
              path="/granthunt"
              element={
                <ProtectedRoute
                  allowedRoles={["consultant"]}
                  fallback="/consultant/login"
                  element={<DashboardLayout><ConsultantGrantHunt /></DashboardLayout>}
                />
              }
            />
            <Route
              path="/consultant/profile"
              element={
                <ProtectedRoute
                  allowedRoles={["consultant"]}
                  fallback="/consultant/login"
                  element={<DashboardLayout><ConsultantProfileEditor /></DashboardLayout>}
                />
              }
            />
            <Route
              path="/consultant/portal"
              element={
                <ProtectedRoute
                  allowedRoles={["consultant"]}
                  fallback="/consultant/login"
                  element={<DashboardLayout><ConsultantPortal /></DashboardLayout>}
                />
              }
            />

            {/* Client-specific */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  allowedRoles={["client"]}
                  fallback="/client/login"
                  element={<DashboardLayout><Profile /></DashboardLayout>}
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
  const isAllowed = role && (!allowedRoles?.length || allowedRoles.includes(role));
  return isAllowed ? element : <Navigate to={fallback} replace />;
}
