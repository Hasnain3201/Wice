import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ element, allowedRoles, fallback }) {
  const { role } = useAuth();

  // If no role yet (still loading Firebase), show nothing
  if (role === null || role === undefined) {
    return null;
  }

  // If the user is NOT allowed to access the page, redirect them
  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  // Otherwise, show the protected page
  return element;
}
