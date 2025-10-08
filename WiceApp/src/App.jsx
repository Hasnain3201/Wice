import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import "./App.css";

// assets
import WiceLogo from "./assets/Wice_logo.jpg";

// pages (match casing exactly as on disk)
import ClientLogin from "./Pages/Client/Client_login_page";
import EmployeeLogin from "./Pages/Employee/Employee_login_page";

// LAZY load SignUp so it doesn't block the homepage if its import fails
const SignUp = lazy(() => import("./Pages/SignUp.jsx"));

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
          <p className="subtitle">Sign in here</p>

          <div className="actions">
            <button
              className="btn primary"
              onClick={() => navigate("/client/login")}
            >
              Client Login
            </button>

            <button
              className="btn primary"
              onClick={() => navigate("/employee/login")}
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

        {/* RIGHT PANEL (image served from /public) */}
        <section className="right">
          <img
            src="/hero.jpg"
            alt="Scenic mountains and river"
            className="hero"
          />
        </section>
      </div>
    </div>
  );
}

// ----------------- MAIN APP ROUTES -----------------
export default function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
