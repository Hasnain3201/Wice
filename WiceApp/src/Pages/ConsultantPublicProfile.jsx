import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import "./ConsultantPublicProfile.css";

export default function ConsultantPublicProfile() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [consultant, setConsultant] = useState(null);
    const [messaging, setMessaging] = useState(false);
    const [messageError, setMessageError] = useState("");
    const { user, role } = useAuth();
    const { startDirectChat } = useChat();

    useEffect(() => {
        async function fetchData() {
            try {
                const ref = doc(db, "users", uid);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    setConsultant(snap.data());
                } else {
                    setConsultant(null);
                }
            } catch (err) {
                console.error("Failed to load consultant:", err);
                setConsultant(null);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [uid]);

    if (loading) {
        return <div className="public-profile-container">Loading…</div>;
    }

    if (!consultant) {
        return (
            <div className="public-profile-container">
                <button className="back-btn" onClick={() => navigate("/marketplace")}>
                    ← Back to Marketplace
                </button>

                <h2>Consultant Not Found</h2>
                <p>This consultant does not exist or has not completed their profile.</p>
            </div>
        );
    }

    const profile = consultant.profile || {};
    const fullName =
        consultant.fullName ||
        consultant.profile?.fullName ||
        "Unnamed Consultant";

    const resumeUrl = profile.resumeFile || profile.resumeUrl || null;
    const bookingUrl = profile.bookingUrl || null;
    const supportingDocs = Array.isArray(profile.additionalFiles)
        ? profile.additionalFiles.map((entry) =>
              typeof entry === "string"
                  ? { name: entry.split("?")[0].split("/").pop() || "Document", url: entry }
                  : entry
          )
        : [];
    const avatarUrl =
        profile.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName
        )}&background=E5E7EB&color=111827&size=180&bold=true`;

    const locationLine = [consultant.location, consultant.country]
        .filter(Boolean)
        .join(", ");
    const metaLine =
        locationLine && profile.timeZone
            ? `${locationLine} • ${profile.timeZone}`
            : locationLine || profile.timeZone || "";

    const industriesText = profile.industries?.join(", ") || "—";
    const languagesText = profile.languages?.join(", ") || "—";
    const sectorsText = profile.sectors?.join(", ") || "—";
    const donorsText = profile.donorExperience?.join(", ") || "—";
    const skillsText = profile.capabilitiesList?.join(", ") || "—";

    async function handleMessage() {
        if (!user || role !== "client") {
            setMessageError("Only clients can send messages to consultants.");
            return;
        }
        if (!consultant) return;
        setMessageError("");
        setMessaging(true);
        try {
            await startDirectChat({
                uid,
                fullName,
                email: consultant.email || profile.email || "",
                role: consultant.accountType || "consultant",
            });
            navigate("/chat");
        } catch (err) {
            console.error("Failed to start chat from public profile:", err);
            setMessageError("Unable to start chat right now. Please try again.");
        } finally {
            setMessaging(false);
        }
    }

    return (
        <div className="public-profile-page">
            <div className="public-profile-hero-card">
                <button className="back-btn" onClick={() => navigate("/marketplace")}>
                    ← Back to Marketplace
                </button>

                <div className="hero-top">
                    <img src={avatarUrl} alt={`${fullName} avatar`} className="hero-avatar" />
                    <div>
                        <h1>{fullName}</h1>
                        <p className="one-liner">{profile.oneLinerBio || "No bio available."}</p>
                        {metaLine && <p className="meta-line">{metaLine}</p>}
                        {profile.linkedinUrl && (
                            <a
                                href={profile.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="hero-link"
                            >
                                View LinkedIn
                            </a>
                        )}
                    </div>
                </div>

                <div className="hero-actions">
                    {bookingUrl && (
                        <a
                            className="book-btn"
                            href={bookingUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Book Appointment
                        </a>
                    )}
                    {resumeUrl && (
                        <a className="resume-btn" href={resumeUrl} target="_blank" rel="noreferrer">
                            View Resume
                        </a>
                    )}
                    <button
                        className={`message-btn ${role !== "client" ? "message-btn--disabled" : ""}`}
                        onClick={handleMessage}
                        disabled={messaging || role !== "client"}
                        title={role === "client" ? "" : "Clients only"}
                    >
                        {messaging
                            ? "Starting…"
                            : role === "client"
                            ? "Message Consultant"
                            : "Message (clients only)"}
                    </button>
                </div>
                {messageError && (
                    <p className="error" role="alert">
                        {messageError}
                    </p>
                )}

                <div className="hero-stats">
                    <article>
                        <span className="stat-label">Experience</span>
                        <span className="stat-value">
                            {profile.totalYearsExperience || "—"}
                        </span>
                    </article>
                    <article>
                        <span className="stat-label">Daily Rate</span>
                        <span className="stat-value">
                            {profile.dailyRate
                                ? `${profile.currency || "USD"} ${profile.dailyRate}`
                                : "—"}
                        </span>
                    </article>
                    <article>
                        <span className="stat-label">Open to Travel</span>
                        <span className="stat-value">
                            {profile.openToTravel === true || profile.openToTravel === "Yes"
                                ? "Yes"
                                : profile.openToTravel === false || profile.openToTravel === "No"
                                ? "No"
                                : "—"}
                        </span>
                    </article>
                </div>
            </div>

            <div className="public-profile-sections">
                <section className="public-section">
                    <h2>About</h2>
                    <p>{profile.about || "No description provided."}</p>
                </section>

                <section className="public-section">
                    <h2>Expertise</h2>
                    <div className="tag-grid">
                        <div>
                            <strong>Industries</strong>
                            <p>{industriesText}</p>
                        </div>
                        <div>
                            <strong>Focus Regions</strong>
                            <p>{profile.experienceRegions?.join(", ") || "—"}</p>
                        </div>
                        <div>
                            <strong>Languages</strong>
                            <p>{languagesText}</p>
                        </div>
                        <div>
                            <strong>Sectors</strong>
                            <p>{sectorsText}</p>
                        </div>
                        <div>
                            <strong>Donor Experience</strong>
                            <p>{donorsText}</p>
                        </div>
                        <div>
                            <strong>Capabilities</strong>
                            <p>{skillsText}</p>
                        </div>
                    </div>
                </section>

                <section className="public-section">
                    <h2>Work Preferences</h2>
                    <ul>
                        <li>
                            <strong>Daily Rate:</strong>{" "}
                            {profile.dailyRate
                                ? `${profile.currency || "USD"} ${profile.dailyRate}`
                                : "—"}
                        </li>
                        <li>
                            <strong>Open to Travel:</strong>{" "}
                            {profile.openToTravel === true || profile.openToTravel === "Yes"
                                ? "Yes"
                                : profile.openToTravel === false || profile.openToTravel === "No"
                                ? "No"
                                : "—"}
                        </li>
                        <li>
                            <strong>Regions:</strong>{" "}
                            {profile.experienceCountries?.join(", ") || "—"}
                        </li>
                    </ul>
                </section>

                <section className="public-section">
                    <h2>Education</h2>
                    <ul>
                        <li>
                            <strong>Degree:</strong> {profile.highestDegree || "—"}
                        </li>
                        <li>
                            <strong>Institution:</strong> {profile.institution || "—"}
                        </li>
                    </ul>
                </section>

                <section className="public-section">
                    <h2>Portfolio</h2>
                    {resumeUrl ? (
                        <p>
                            <a href={resumeUrl} target="_blank" rel="noreferrer">
                                View CV / Resume
                            </a>
                        </p>
                    ) : (
                        <p className="muted">No resume uploaded.</p>
                    )}

                    {supportingDocs.length > 0 ? (
                        <ul className="portfolio-list">
                            {supportingDocs.map((doc, index) => (
                                <li key={doc.url || index}>
                                    <a href={doc.url} target="_blank" rel="noreferrer">
                                        {doc.name || "Supporting document"}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="muted">No supporting documents provided.</p>
                    )}
                </section>
            </div>
        </div>
    );
}
