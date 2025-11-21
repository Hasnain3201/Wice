import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import "./ConsultantPublicProfile.css";
import { X } from "lucide-react";

export default function ConsultantPublicProfile() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [consultant, setConsultant] = useState(null);
    const [messaging, setMessaging] = useState(false);
    const [messageError, setMessageError] = useState("");
    const [showBookingModal, setShowBookingModal] = useState(false);

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

    /* -------- PROFILE FIELDS -------- */
    const profile = consultant.profile || {};
    const fullName =
        consultant.fullName ||
        consultant.profile?.fullName ||
        "Unnamed Consultant";

    const avatarUrl =
        profile.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            fullName
        )}&background=E5E7EB&color=111827&size=180&bold=true`;

    const resumeUrl = profile.resumeFile || profile.resumeUrl || null;

    const calComLink = profile.calComLink || null; // IMPORTANT

    const locationLine = [consultant.location, consultant.country]
        .filter(Boolean)
        .join(", ");

    const metaLine =
        locationLine && profile.timeZone
            ? `${locationLine} • ${profile.timeZone}`
            : locationLine || profile.timeZone || "";

    const lightComplete =
        Boolean(consultant.phaseLightCompleted || profile.phaseLightCompleted);

    const fullComplete =
        Boolean(consultant.phaseFullCompleted || profile.phaseFullCompleted);

    const industriesText = profile.industries?.join(", ") || "—";
    const languagesText = profile.languages?.join(", ") || "—";
    const sectorsText = profile.sectors?.join(", ") || "—";
    const donorsText = profile.donorExperience?.join(", ") || "—";
    const skillsText = profile.capabilitiesList?.join(", ") || "—";
    const regionsText = profile.experienceRegions?.join(", ") || "—";
    const countriesText = profile.experienceCountries?.join(", ") || "—";

    const availabilityStatus = profile.availabilityStatus || "";
    const availabilityText =
        availabilityStatus === "available_now"
            ? "Available now"
            : availabilityStatus === "not_currently_available"
            ? profile.availabilityNote || "Not currently available"
            : "—";

    const dailyRateText = profile.dailyRate
        ? `${profile.currency || "USD"} ${profile.dailyRate}`
        : "—";

    const openToTravelText =
        profile.openToTravel === true || profile.openToTravel === "Yes"
            ? "Yes"
            : profile.openToTravel === false || profile.openToTravel === "No"
            ? "No"
            : "—";

    /* -------- MESSAGE HANDLER -------- */
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

                {/* HERO ACTIONS — NOW WITH BOOK CONSULTANT BUTTON */}
                <div className="hero-actions">
                    <button
                        className="book-btn"
                        type="button"
                        onClick={() => setShowBookingModal(true)}
                    >
                        Book Consultant
                    </button>

                    {resumeUrl && (
                        <a className="resume-btn" href={resumeUrl} target="_blank" rel="noreferrer">
                            View Resume
                        </a>
                    )}

                    <button
                        className={`message-btn ${
                            role !== "client" ? "message-btn--disabled" : ""
                        }`}
                        onClick={handleMessage}
                        disabled={messaging || role !== "client"}
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

                {/* STATS */}
                <div className="hero-stats">
                    <article>
                        <span className="stat-label">Experience</span>
                        <span className="stat-value">
                            {profile.totalYearsExperience || "—"}
                        </span>
                    </article>
                    <article>
                        <span className="stat-label">Daily Rate</span>
                        <span className="stat-value">{dailyRateText}</span>
                    </article>
                    <article>
                        <span className="stat-label">Open to Travel</span>
                        <span className="stat-value">{openToTravelText}</span>
                    </article>
                </div>
            </div>

            {/* PROFILE SECTIONS */}
            <div className="public-profile-sections">
                <section className="public-section">
                    <h2>About</h2>
                    <p>{profile.about || "No description provided."}</p>
                    {!lightComplete && (
                        <p className="muted">
                            This consultant has not finished their light profile yet.
                        </p>
                    )}
                </section>

                <section className="public-section">
                    <h2>Expertise</h2>
                    <div className="tag-grid">
                        <div>
                            <strong>Industries</strong>
                            <p>{industriesText}</p>
                        </div>
                        <div>
                            <strong>Languages</strong>
                            <p>{languagesText}</p>
                        </div>
                        <div>
                            <strong>Sectors</strong>
                            <p>{sectorsText}</p>
                        </div>
                        {fullComplete && (
                            <>
                                <div>
                                    <strong>Focus Regions</strong>
                                    <p>{regionsText}</p>
                                </div>
                                <div>
                                    <strong>Donor Experience</strong>
                                    <p>{donorsText}</p>
                                </div>
                                <div>
                                    <strong>Capabilities</strong>
                                    <p>{skillsText}</p>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <section className="public-section">
                    <h2>Work Preferences</h2>
                    <ul>
                        <li>
                            <strong>Daily Rate:</strong> {dailyRateText}
                        </li>
                        <li>
                            <strong>Availability:</strong> {availabilityText}
                        </li>
                        <li>
                            <strong>Open to Travel:</strong> {openToTravelText}
                        </li>
                        {fullComplete && (
                            <>
                                <li>
                                    <strong>Regions:</strong> {regionsText}
                                </li>
                                <li>
                                    <strong>Countries:</strong> {countriesText}
                                </li>
                            </>
                        )}
                    </ul>
                </section>

                {fullComplete && (
                    <>
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
                        </section>
                    </>
                )}
            </div>

            {/* BOOKING MODAL */}
            {showBookingModal && (
                <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Book This Consultant</h3>
                            <X
                                className="close-icon"
                                size={20}
                                onClick={() => setShowBookingModal(false)}
                                style={{ cursor: "pointer" }}
                            />
                        </div>

                        <ConsultantBookingWidget
                            calLink={calComLink || "wice/default-event"}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
