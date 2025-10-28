import React, { useState } from "react";
import "./Chat.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { useChat } from "../../context/ChatContext.jsx"; // ✅ use global context

export default function Chat() {
  const { role } = useAuth();
  const { chats, sendMessage } = useChat();
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");

  // Separate chats by type
  const regularChats = chats.filter((c) => c.type !== "project");
  const projectChats = chats.filter((c) => c.type === "project");

  const activeChat = chats.find((c) => c.id === activeId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeChat) return;
    sendMessage(activeChat.id, draft, role || "You");
    setDraft("");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Messages</h1>
        <p className="dashboard-subtitle">
          View direct messages and project group chats.
        </p>
      </header>

      <div className="chat-shell">
        {/* Sidebar */}
        <aside className="chat-sidebar" aria-label="Conversation list">
          <header className="chat-sidebar-header">
            <h3>Chats</h3>
            <span className="chat-role-badge">{(role || "User").toUpperCase()}</span>
          </header>

          {/* Direct Messages */}
          <h4 className="chat-section-title">Direct Messages</h4>
          <ul className="chat-thread-list">
            {regularChats.length > 0 ? (
              regularChats.map((thread) => (
                <li
                  key={thread.id}
                  className={`chat-thread ${thread.id === activeId ? "active" : ""}`}
                  onClick={() => setActiveId(thread.id)}
                >
                  <h4>{thread.name}</h4>
                  <p>{thread.messages.at(-1)?.text || "No messages yet"}</p>
                </li>
              ))
            ) : (
              <p className="empty-chat-note">No direct chats yet.</p>
            )}
          </ul>

          {/* Project Group Chats */}
          <h4 className="chat-section-title">Other Projects</h4>
          <ul className="chat-thread-list">
            {projectChats.length > 0 ? (
              projectChats.map((thread) => (
                <li
                  key={thread.id}
                  className={`chat-thread ${thread.id === activeId ? "active" : ""}`}
                  onClick={() => setActiveId(thread.id)}
                >
                  <h4>{thread.name}</h4>
                  <p>{thread.messages.at(-1)?.text || "No messages yet"}</p>
                </li>
              ))
            ) : (
              <p className="empty-chat-note">No project group chats yet.</p>
            )}
          </ul>
        </aside>

        {/* Chat window */}
        <section className="chat-window" aria-live="polite">
          {activeChat ? (
            <>
              <header className="chat-window-header">
                <div>
                  <h3>{activeChat.name}</h3>
                  <p>
                    {activeChat.type === "project"
                      ? "Project Group Chat"
                      : "Direct Chat"}
                  </p>
                </div>
              </header>

              <div className="chat-messages">
                {activeChat.messages.map((message, i) => (
                  <article
                    key={i}
                    className={`chat-bubble ${
                      message.type === "sent" ? "outgoing" : "incoming"
                    }`}
                  >
                    <p>{message.text}</p>
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
              <p>Choose a chat from the left to start messaging.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
