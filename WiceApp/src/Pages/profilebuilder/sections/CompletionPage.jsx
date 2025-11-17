// src/ProfileBuilder/sections/CompletionPage.jsx
import "../ProfileBuilder.css";
import SectionDropdown from "../componentsPB/SectionDropdown";
import { saveUserProfile } from "../../../services/userProfile";
import { useAuth } from "../../../context/AuthContext";

export default function CompletionPage({ profileData, onNextFull, onSave }) {
  const { user } = useAuth();

  async function handleLightSave() {
    const uid = user?.uid;
    if (!uid) return;

    const lightData = {
      profile: {
        fullName: profileData.fullName,
        pronouns: profileData.pronouns,
        timeZone: profileData.timeZone,

        oneLinerBio: profileData.oneLinerBio,
        about: profileData.about,
        totalYearsExperience: profileData.totalYearsExperience,
        linkedinUrl: profileData.linkedinUrl,

        industries: profileData.industries || [],
        sectors: profileData.sectors || [],
        languages: profileData.languages || [],

        currency: profileData.currency,
        dailyRate: profileData.dailyRate,
        openToTravel: profileData.openToTravel,
      },

      phaseLightCompleted: true,
    };

    await saveUserProfile(uid, lightData);

    onSave(); // return to ConsultantHome
  }

  const identityBasics = {
    "Full Name": profileData.fullName,
    Pronouns: profileData.pronouns,
    "Time Zone": profileData.timeZone,
  };

  const professionalIdentity = {
    "One-Liner Bio": profileData.oneLinerBio,
    About: profileData.about,
    "Total Years Experience": profileData.totalYearsExperience,
    "LinkedIn URL": profileData.linkedinUrl,
  };

  const expertiseSnapshot = {
    Industries: profileData.industries?.join(", "),
    Sectors: profileData.sectors?.join(", "),
    Languages: profileData.languages?.join(", "),
  };

  const workPreferences = {
    "Daily Rate": profileData.dailyRate
      ? `${profileData.currency} ${profileData.dailyRate}`
      : "",
    "Open to Travel": profileData.openToTravel,
  };

  return (
    <div className="section">
      <h2>Light Profile Completion</h2>
      <p>Review the information below. You can update anything later.</p>

      <SectionDropdown title="Identity Basics" data={identityBasics} />
      <SectionDropdown title="Professional Identity" data={professionalIdentity} />
      <SectionDropdown title="Expertise Snapshot" data={expertiseSnapshot} />
      <SectionDropdown title="Work Preferences" data={workPreferences} />

      <div className="section-actions">
        <button className="back" onClick={handleLightSave}>
          Save & Return Home
        </button>

        <button className="next" onClick={onNextFull}>
          Continue to Full Profile
        </button>
      </div>
    </div>
  );
}
