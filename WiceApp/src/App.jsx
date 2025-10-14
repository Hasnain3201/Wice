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
import hero from "./assets/hero.jpg";

// pages (lazy signup to avoid blocking)
const SignUp = lazy(() => import("./Pages/SignUp.jsx"));

// marketplace pages
import Marketplace from "./Pages/Marketplace/Marketplace.jsx";
import ConsultantProfile from "./Pages/Marketplace/ConsultantProfile.jsx";

// login pages
import ClientLogin from "./Pages/Client/Client_login_page.jsx";
import EmployeeLogin from "./Pages/Employee/Employee_login_page.jsx";

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
            {/* Step 1: choose client vs employee */}
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
              Employee Login
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
    <Router>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Step 2: dedicated login pages */}
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />

          {/* Sign up */}
          <Route path="/signup" element={<SignUp />} />

          {/* Marketplace */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/consultant/:id" element={<ConsultantProfile />} />

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
  );
}
