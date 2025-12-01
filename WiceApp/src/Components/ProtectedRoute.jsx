import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({
  element,
  allowedRoles,
  fallback,
  requireVerified = true,
}) {
  const { role, user } = useAuth();

  // If no role yet (still loading Firebase), show nothing
  if (role === null || role === undefined) {
    return null;
  }

  if (requireVerified && user && user.emailVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  // If the user is NOT allowed to access the page, redirect them
  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  // Otherwise, show the protected page
  return element;
}
