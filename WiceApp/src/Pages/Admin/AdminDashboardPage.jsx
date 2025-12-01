import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminDashboardPage.css";
import { ShieldCheck, Users, UserX } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  setUserAccountStatus,
  subscribeToAllUsers,
  updateUserRole,
  logAdminAction,
  subscribeToAdminActions,
  fetchSavedAnalytics,
  fetchChatAnalytics,
} from "../../services/admin.js";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";

const ROLE_LABELS = {
  admin: "Admin",
  consultant: "Consultant",
  client: "Client",
};
const PROTECTED_ADMIN_EMAIL =
  "admin@wice.org";

function getAccountType(entry) {
  return (
    entry?.accountType ||
    entry?.role ||
    entry?.profile?.accountType ||
    entry?.profile?.role ||
    null
  );
}

function getDisplayName(entry) {
  return (
    entry?.fullName ||
    entry?.profile?.fullName ||
    entry?.displayName ||
    entry?.email ||
    "—"
  );
}

function getStatus(entry) {
  return entry?.status || entry?.profile?.status || null;
}

function getPreviousRole(entry) {
  return entry?.previousAccountType || entry?.profile?.previousAccountType || null;
}

function getDemoteRole(entry) {
  const previous = getPreviousRole(entry);
  if (previous && previous !== "admin") return previous;
  const stored = entry?.profile?.accountTypeBeforeAdmin;
  if (stored && stored !== "admin") return stored;
  const current = getAccountType(entry);
  if (current && current !== "admin") return current;
  return "consultant";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionByUser, setActionByUser] = useState({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [savedStats, setSavedStats] = useState(null);
  const [chatStats, setChatStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");
  const toggleUserCallable = useMemo(
    () => httpsCallable(functions, "toggleUser"),
    []
  );

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers(
      (list) => {
        setUsers(list);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Admin user subscription failed:", err);
        setError("Unable to load users right now.");
        setLoading(false);
      }
    );
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchSavedAnalytics()
      .then((data) => {
        if (mounted) setSavedStats(data);
      })
      .catch((err) => {
        console.error("Failed to load saved analytics:", err);
        if (mounted) {
          setSavedStats({
            consultantSaves: 0,
            clientsWithSaves: 0,
            grantSaves: 0,
            totalDocs: 0,
          });
        }
      });
    fetchChatAnalytics()
      .then((data) => {
        if (mounted) setChatStats(data);
      })
      .catch((err) => {
        console.error("Failed to load chat analytics:", err);
        if (mounted) {
          setChatStats({
            totalChats: 0,
            directChats: 0,
            projectChats: 0,
            staleChats: 0,
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAdminActions(
      10,
      (entries) => {
        setLogs(entries);
        setLogsLoading(false);
        setLogsError("");
      },
      (err) => {
        console.error("Admin actions subscription failed:", err);
        setLogsError("Unable to load recent admin activity.");
        setLogsLoading(false);
      }
    );
    return () => unsubscribe?.();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(
      (entry) => getAccountType(entry) === "admin"
    ).length;
    const admins = adminCount;
    const newUsers7d = users.filter((entry) => {
      const createdAt =
        entry.createdAt?.toMillis?.() ||
        entry.createdAt?.seconds * 1000 ||
        entry.profileCreatedAt;
      if (!createdAt) return false;
      return Date.now() - createdAt < 1000 * 60 * 60 * 24 * 7;
    }).length;
    const consultants = users.filter(
      (entry) => getAccountType(entry) === "consultant"
    ).length;
    const clients = users.filter(
      (entry) => getAccountType(entry) === "client"
    ).length;
    const revoked = users.filter((entry) => getStatus(entry) === "revoked").length;
    return { total, admins, consultants, clients, revoked, newUsers7d };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((entry) => {
      const accountType = getAccountType(entry);
      const matchesRole =
        roleFilter === "all" ? true : accountType === roleFilter;
      const displayName = getDisplayName(entry);
      const matchesQuery =
        !query ||
        `${displayName} ${entry.email || ""}`.toLowerCase().includes(query);
      return matchesRole && matchesQuery;
    });
  }, [users, search, roleFilter]);

  const isActingOnSelf = (targetUid) => user?.uid === targetUid;
  const isProtectedAdmin = (entry) =>
    PROTECTED_ADMIN_EMAIL &&
    (entry.email || "").toLowerCase() === PROTECTED_ADMIN_EMAIL;

  const updateActionState = (uid, state) =>
    setActionByUser((prev) => ({ ...prev, [uid]: state }));

  const syncAuthStatus = useCallback(
    async (targetUid, disable) => {
      await toggleUserCallable({ uid: targetUid, disable });
    },
    [toggleUserCallable]
  );

  const confirmAction = (message) => {
    if (typeof window !== "undefined") {
      return window.confirm(message);
    }
    return true;
  };

  const handleRevoke = async (target) => {
    if (
      !confirmAction(
        `Revoke access for ${target.fullName || target.email || "this user"}?`
      )
    ) {
      return;
    }
    updateActionState(target.uid, "revoking");
    try {
      await Promise.all([
        syncAuthStatus(target.uid, true),
        setUserAccountStatus(target.uid, "revoked", { revokedBy: user?.uid }),
      ]);
      await logAdminAction({
        action: "revoke",
        targetUid: target.uid,
        targetEmail: target.email || null,
        performedBy: user?.uid || null,
        performedByEmail: user?.email || null,
      });
    } catch (err) {
      console.error("Failed to revoke user", err);
      setError("Unable to revoke account. Please try again.");
    } finally {
      updateActionState(target.uid, null);
    }
  };

  const handleRestore = async (target) => {
    if (
      !confirmAction(
        `Restore access for ${target.fullName || target.email || "this user"}?`
      )
    ) {
      return;
    }
    updateActionState(target.uid, "restoring");
    try {
      await Promise.all([
        syncAuthStatus(target.uid, false),
        setUserAccountStatus(target.uid, null),
      ]);
      await logAdminAction({
        action: "restore",
        targetUid: target.uid,
        targetEmail: target.email || null,
        performedBy: user?.uid || null,
        performedByEmail: user?.email || null,
      });
    } catch (err) {
      console.error("Failed to restore user", err);
      setError("Unable to restore account. Please try again.");
    } finally {
      updateActionState(target.uid, null);
    }
  };

  const handlePromote = async (target) => {
    if (
      !confirmAction(
        `Promote ${target.fullName || target.email || "this user"} to Admin?`
      )
    ) {
      return;
    }
    updateActionState(target.uid, "promoting");
    try {
      await updateUserRole(target.uid, "admin");
      await logAdminAction({
        action: "promote",
        targetUid: target.uid,
        targetEmail: target.email || null,
        performedBy: user?.uid || null,
        performedByEmail: user?.email || null,
      });
    } catch (err) {
      console.error("Failed to promote user", err);
      setError("Unable to promote account. Please try again.");
    } finally {
      updateActionState(target.uid, null);
    }
  };

  const handleDemote = async (target, nextRole = "consultant") => {
    if (
      !confirmAction(
        `Demote ${target.fullName || target.email || "this user"} back to ${ROLE_LABELS[nextRole] || nextRole}?`
      )
    ) {
      return;
    }
    updateActionState(target.uid, "demoting");
    try {
      await updateUserRole(target.uid, nextRole);
      await logAdminAction({
        action: "demote",
        targetUid: target.uid,
        targetEmail: target.email || null,
        performedBy: user?.uid || null,
        performedByEmail: user?.email || null,
        metadata: { nextRole },
      });
    } catch (err) {
      console.error("Failed to demote user", err);
      setError("Unable to update role. Please try again.");
    } finally {
      updateActionState(target.uid, null);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Console</h1>
        <p className="dashboard-subtitle">
          Manage access, monitor users, and launch internal tools like GrantHunt.
        </p>
      </div>

      <section className="admin-stat-grid">
        <StatCard icon={Users} label="Total Users" value={stats.total} />
        <StatCard icon={ShieldCheck} label="Admins" value={stats.admins} />
        <StatCard icon={ShieldCheck} label="Consultants" value={stats.consultants} />
        <StatCard icon={ShieldCheck} label="Clients" value={stats.clients} />
        <StatCard icon={UserX} label="Revoked" value={stats.revoked} />
        <StatCard icon={Users} label="New (7d)" value={stats.newUsers7d} />
      </section>

      <div className="dashboard-card admin-card">
        <header className="admin-card__header">
          <div>
            <h2>User Directory</h2>
            <p>Revoke or restore access for any client or consultant.</p>
          </div>
          <div className="admin-controls">
            <input
              type="search"
              placeholder="Search name or email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="admin-search"
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="admin-select"
            >
              <option value="all">All accounts</option>
              <option value="client">Clients</option>
              <option value="consultant">Consultants</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </header>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="admin-loading">Loading users…</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((entry) => {
                  const accountType = getAccountType(entry);
                  const status = getStatus(entry);
                  const displayName = getDisplayName(entry);
                  const roleLabel = ROLE_LABELS[accountType] || accountType || "—";
                  return (
                    <tr key={entry.uid}>
                      <td>{displayName}</td>
                      <td>{entry.email || "—"}</td>
                      <td>{roleLabel}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            status === "revoked" ? "revoked" : "active"
                          }`}
                        >
                          {status === "revoked" ? "Revoked" : "Active"}
                        </span>
                      </td>
                      <td className="admin-actions-cell">
                        {accountType !== "admin" && (
                          <button
                            type="button"
                            className="admin-btn ghost"
                            onClick={() => handlePromote(entry)}
                            disabled={
                              actionByUser[entry.uid] === "promoting" ||
                              status === "revoked"
                            }
                          >
                            {actionByUser[entry.uid] === "promoting"
                              ? "Promoting…"
                              : "Promote to Admin"}
                          </button>
                        )}
                        {accountType === "admin" &&
                          !isProtectedAdmin(entry) &&
                          !isActingOnSelf(entry.uid) && (
                            <button
                              type="button"
                              className="admin-btn ghost"
                              onClick={() => {
                                const demoteTo = getDemoteRole(entry);
                                handleDemote(entry, demoteTo);
                              }}
                              disabled={actionByUser[entry.uid] === "demoting"}
                            >
                              {actionByUser[entry.uid] === "demoting"
                                ? "Updating…"
                                : `Demote to ${
                                    ROLE_LABELS[getDemoteRole(entry)] ||
                                    getDemoteRole(entry)
                                  }`}
                            </button>
                          )}
                        {status === "revoked" ? (
                          <button
                            type="button"
                            className="admin-btn ghost"
                            onClick={() => handleRestore(entry)}
                            disabled={actionByUser[entry.uid] === "restoring"}
                          >
                            {actionByUser[entry.uid] === "restoring"
                              ? "Restoring…"
                              : "Restore"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn danger"
                            onClick={() => handleRevoke(entry)}
                            disabled={
                              actionByUser[entry.uid] === "revoking" ||
                              accountType === "admin" ||
                              isActingOnSelf(entry.uid)
                            }
                          >
                            {actionByUser[entry.uid] === "revoking"
                              ? "Revoking…"
                              : "Revoke"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-card admin-card">
        <header className="admin-card__header">
          <div>
            <h2>Engagement Snapshot</h2>
            <p>Saved consultants, grants, and chat activity across WICE.</p>
          </div>
        </header>
        <div className="admin-insights">
          <Insight
            label="Consultant Saves"
            value={savedStats?.consultantSaves ?? "—"}
            hint={`${savedStats?.clientsWithSaves ?? 0} clients saved consultants`}
          />
          <Insight
            label="Grant Saves"
            value={savedStats?.grantSaves ?? "—"}
            hint={`${savedStats?.totalDocs ?? 0} save collections`}
          />
          <Insight
            label="Chat Threads"
            value={chatStats?.totalChats ?? "—"}
            hint={`${chatStats?.staleChats ?? 0} inactive 7+ days`}
          />
          <Insight
            label="Direct Chats"
            value={chatStats?.directChats ?? "—"}
            hint={`${chatStats?.projectChats ?? 0} project chats`}
          />
        </div>
      </div>

      <div className="dashboard-card admin-card">
        <header className="admin-card__header">
          <div>
            <h2>Recent Admin Activity</h2>
            <p>Audit trail for promotions, revokes, and other actions.</p>
          </div>
        </header>
        {logsError ? (
          <p className="admin-error" role="alert">
            {logsError}
          </p>
        ) : null}
        {logsLoading ? (
          <p className="admin-loading">Loading activity…</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Performed By</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      No admin actions recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((entry) => (
                    <tr key={entry.id}>
                      <td className="admin-log-action">{entry.action}</td>
                      <td>
                        {entry.targetEmail || entry.targetUid || "—"}
                      </td>
                      <td>{entry.performedByEmail || entry.performedBy || "—"}</td>
                      <td>
                        {entry.createdAt?.toDate?.().toLocaleString?.() || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <article className="admin-stat">
      <div className="admin-stat__icon">{React.createElement(icon, { size: 18 })}</div>
      <div>
        <p className="admin-stat__label">{label}</p>
        <p className="admin-stat__value">{value}</p>
      </div>
    </article>
  );
}

function Insight({ label, value, hint }) {
  return (
    <article className="admin-insight">
      <p className="admin-insight__label">{label}</p>
      <p className="admin-insight__value">{value}</p>
      <p className="admin-insight__hint">{hint}</p>
    </article>
  );
}
