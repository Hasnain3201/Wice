import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Notifications() {
  const [active, setActive] = useState(false);
  const { user, role } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1>
        Notifications{" "}
        <Bell
          size={20}
          color={active ? "goldenrod" : "gray"}
          style={{ cursor: "pointer" }}
          onClick={() => setActive(!active)}
        />
      </h1>
      <p>{user?.name ? `${user.name}'s notifications` : "No user data loaded."}</p>
      <p>Status: {active ? "Active" : "Inactive"}</p>
      <p>Role: {role}</p>
    </div>
  );
}

