import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./ConsultantPublicProfile.css";

export default function ConsultantPublicProfile() {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [consultant, setConsultant] = useState(null);

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

    const resumeUrl = profile.resumeUrl || null; // if you store resume files

    return (
        <div className="public-profile-container">

            {/* BACK BUTTON */}
            <button className="back-btn" onClick={() => navigate("/marketplace")}>
                ← Back to Marketplace
            </button>

            {/* HEADER */}
            <h1>{fullName}</h1>
            <p className="one-liner">{profile.oneLinerBio || "No bio available."}</p>

            {/* ACTION BUTTONS */}
            <div className="action-row">
                {/* Book appointment (can be a placeholder or cal.com link) */}
                <a
                    className="book-btn"
                    href={`https://cal.com/YOUR_ORGANIZATION/${uid}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Book Appointment
                </a>

                {/* Resume Download */}
                {resumeUrl && (
                    <a className="resume-btn" href={resumeUrl} target="_blank">
                        View Resume
                    </a>
                )}
            </div>

            {/* ⭐ MESSAGE CONSULTANT BUTTON */}
            <button className="message-btn" onClick={handleMessage}>
                Message Consultant
            </button>

            {/* ABOUT */}
            <section className="public-section">
                <h2>About</h2>
                <p>{profile.about || "No description provided."}</p>
            </section>

            {/* EXPERTISE */}
            <section className="public-section">
                <h2>Expertise</h2>
                <ul>
                    <li><strong>Industries:</strong> {profile.industries?.join(", ") || "—"}</li>
                    <li><strong>Languages:</strong> {profile.languages?.join(", ") || "—"}</li>
                    <li><strong>Experience:</strong> {profile.totalYearsExperience || "—"}</li>
                </ul>
            </section>

            {/* WORK PREFERENCES */}
            <section className="public-section">
                <h2>Work Preferences</h2>
                <ul>
                    <li><strong>Daily Rate:</strong> {profile.dailyRate ? `$${profile.dailyRate}` : "—"}</li>
                    <li><strong>Open to Travel:</strong> {profile.openToTravel ? "Yes" : "No"}</li>
                </ul>
            </section>

            {/* EDUCATION */}
            <section className="public-section">
                <h2>Education</h2>
                <ul>
                    <li><strong>Degree:</strong> {profile.highestDegree || "—"}</li>
                    <li><strong>Institution:</strong> {profile.institution || "—"}</li>
                </ul>
            </section>

            {/* PORTFOLIO */}
            <section className="public-section">
                <h2>Portfolio</h2>
                {profile.portfolioLinks?.length > 0 ? (
                    <ul>
                        {profile.portfolioLinks.map((link, i) => (
                            <li key={i}>
                                <a href={link} target="_blank">{link}</a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No portfolio links available.</p>
                )}
            </section>
        </div>
    );
}
