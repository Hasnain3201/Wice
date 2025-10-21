import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Saved() {
  const { user, role } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1>Saved</h1>
      <p>
        {user?.name
          ? `${user.name}'s saved items`
          : "Your saved items will appear here."}
      </p>
      <p>Role: {role}</p>
    </div>
  );
}
