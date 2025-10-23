import React, { useMemo, useState } from "react";
import "./Chat.css";
import { useAuth } from "../../context/AuthContext.jsx";

const seedThreads = [
  {
    id: "1",
    name: "Jeremy Foster",
    role: "consultant",
    preview: "Looking forward to our session next week.",
    messages: [
      {
        id: "m1",
        author: "client",
        text: "Hi Jeremy, thanks for sharing the deck. Could we add a section on grant compliance?",
        timestamp: "Oct 10, 9:12 AM",
      },
      {
        id: "m2",
        author: "consultant",
        text: "Absolutely! I’ll draft the compliance section and send it tonight.",
        timestamp: "Oct 10, 9:20 AM",
      },
    ],
  },
  {
    id: "2",
    name: "Sara Calvert",
    role: "consultant",
    preview: "Sending updated scope now.",
    messages: [
      {
        id: "m1",
        author: "consultant",
        text: "I’ve attached the revised scope with climate indicators.",
        timestamp: "Oct 8, 4:02 PM",
      },
    ],
  },
];

export default function Chat() {
  const { role } = useAuth();
  const [threads, setThreads] = useState(seedThreads);
  const [activeId, setActiveId] = useState(seedThreads[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeId) ?? null,
    [threads, activeId]
  );

  const handleSend = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeThread) return;

    const message = {
      id: `msg-${Date.now()}`,
      author: role ?? "client",
      text,
      timestamp: new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      }),
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              preview: message.text,
              messages: [...thread.messages, message],
            }
          : thread
      )
    );
    setDraft("");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Messages</h1>
        <p className="dashboard-subtitle">Keep the conversation going with your Wice contacts.</p>
      </header>

      <div className="chat-shell">
      <aside className="chat-sidebar" aria-label="Conversation list">
        <header className="chat-sidebar-header">
          <h3>Chats</h3>
          <span className="chat-role-badge">{(role || "client").toUpperCase()}</span>
        </header>

        <ul className="chat-thread-list">
          {threads.map((thread) => (
            <li
              key={thread.id}
              className={`chat-thread ${thread.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(thread.id)}
            >
              <h4>{thread.name}</h4>
              <p>{thread.preview}</p>
            </li>
          ))}
        </ul>
      </aside>

      <section className="chat-window" aria-live="polite">
        {activeThread ? (
          <>
            <header className="chat-window-header">
              <div>
                <h3>{activeThread.name}</h3>
                <p>{activeThread.role === "consultant" ? "Consultant" : "Client Partner"}</p>
              </div>
            </header>

            <div className="chat-messages">
              {activeThread.messages.map((message) => (
                <article
                  key={message.id}
                  className={`chat-bubble ${
                    message.author === role ? "outgoing" : "incoming"
                  }`}
                >
                  <p>{message.text}</p>
                  <span>{message.timestamp}</span>
                </article>
              ))}
            </div>

            <form className="chat-composer" onSubmit={handleSend}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message…"
                rows={2}
                required
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <h3>Select a conversation</h3>
            <p>Choose a chat from the left to continue the discussion.</p>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
