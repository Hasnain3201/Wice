import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import "./VerifyEmail.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("pending"); // pending | sent | error
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);

  useEffect(() => {
    // avoid duplicate sends on rapid mounts
    let cancelled = false;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate("/client/login", { replace: true });
      return () => {};
    }
    if (currentUser.emailVerified) {
      navigate("/", { replace: true });
      return () => {};
    }
    const userKey = currentUser.uid || currentUser.email || "anon";
    const cooldownKey = `verify-cooldown:${userKey}`;
    const blockKey = `verify-block:${userKey}`;
    const lastSentAt = Number(sessionStorage.getItem(cooldownKey) || 0);
    const blockedUntilTs = Number(sessionStorage.getItem(blockKey) || 0);
    setBlockedUntil(blockedUntilTs);
    const now = Date.now();
    const remaining = Math.max(0, 60000 - (now - lastSentAt));

    const sendOrWait = async () => {
      if (blockedUntilTs && now < blockedUntilTs) {
        const waitMs = blockedUntilTs - now;
        setCooldown(Math.ceil(waitMs / 1000));
        setStatus("error");
        setMessage("Too many attempts. Please wait a few minutes before trying again.");
        setInitialized(true);
        return;
      }
      if (remaining > 0) {
        setCooldown(Math.ceil(remaining / 1000));
        setStatus("sent");
        setMessage("Verification email already sent. Please wait before resending.");
        setInitialized(true);
        return;
      }
      try {
        await sendEmailVerification(currentUser);
        sessionStorage.setItem(cooldownKey, String(Date.now()));
        if (!cancelled) {
          setStatus("sent");
          setMessage("Verification email sent. Check your inbox and spam folder.");
          setCooldown(60);
        }
      } catch (err) {
        if (!cancelled) {
          const tooMany = err?.code === "auth/too-many-requests";
          setStatus("error");
          setMessage(
            tooMany
              ? "Too many attempts. Please wait a minute before trying again."
              : err?.message || "Unable to send verification email right now."
          );
          if (tooMany) {
            setCooldown(60);
          }
        }
      } finally {
        setInitialized(true);
      }
    };

    sendOrWait();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleResend = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (cooldown > 0) return;
    setStatus("pending");
    setMessage("");
    try {
      await sendEmailVerification(currentUser);
      sessionStorage.setItem(
        `verify-cooldown:${currentUser.uid || currentUser.email || "anon"}`,
        String(Date.now())
      );
      setStatus("sent");
      setMessage("Verification email re-sent. Check your inbox and spam folder.");
      setCooldown(45); // short cooldown to avoid rate limit
    } catch (err) {
      const tooMany = err?.code === "auth/too-many-requests";
      setStatus("error");
      setMessage(
        tooMany
          ? "Too many attempts. Please wait a minute before trying again."
          : err?.message || "Unable to send verification email right now."
      );
      if (tooMany) {
        const blockForMs = 5 * 60 * 1000; // 5 minutes
        const until = Date.now() + blockForMs;
        setBlockedUntil(until);
        sessionStorage.setItem(
          `verify-block:${currentUser.uid || currentUser.email || "anon"}`,
          String(until)
        );
        setCooldown(Math.ceil(blockForMs / 1000));
      }
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h1>Verify your email</h1>
        <p>
          We’ve sent a verification link to{" "}
          <strong>{auth.currentUser?.email || "your email"}</strong>. Click the link in that
          email to continue.
        </p>
        {message && (
          <p className={status === "error" ? "verify-error" : "verify-success"}>{message}</p>
        )}
        <div className="verify-actions">
          <button className="btn primary" onClick={handleResend} disabled={status === "pending"}>
            {cooldown > 0
              ? `Resend email (${cooldown}s)`
              : status === "pending"
              ? "Sending…"
              : "Resend email"}
          </button>
          <button className="btn" onClick={() => navigate("/")}>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
