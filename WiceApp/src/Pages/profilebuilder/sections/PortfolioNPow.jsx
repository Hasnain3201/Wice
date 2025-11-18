import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import "../ProfileBuilder.css";
import { useAuth } from "../../../context/AuthContext";
import { storage } from "../../../firebase";

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function PortfolioNPow({ profileData, setProfileData, registerValidator }) {
  const { user } = useAuth();
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [docError, setDocError] = useState("");

  const resumeFile = profileData.resumeFile || "";
  const resumeFileName = profileData.resumeFileName || "";
  const additionalFiles = profileData.additionalFiles || [];

  const requireAuth = () => {
    if (!user?.uid) {
      const err = "You must be signed in to upload a file.";
      setResumeError(err);
      setDocError(err);
      return false;
    }
    return true;
  };

  const removeExistingFile = async (path) => {
    if (!path) return;
    try {
      await deleteObject(ref(storage, path));
    } catch (err) {
      console.warn("Unable to remove previous file:", err);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!requireAuth()) return;
    setUploadingResume(true);
    setResumeError("");
    try {
      if (profileData.resumeStoragePath) {
        await removeExistingFile(profileData.resumeStoragePath);
      }

      const path = `profiles/${user.uid}/resume/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfileData((prev) => ({
        ...prev,
        resumeFile: url,
        resumeFileName: file.name,
        resumeStoragePath: path,
      }));
    } catch (err) {
      console.error("Resume upload failed:", err);
      const needsBucket =
        err?.code === "storage/invalid-argument" || err?.message?.includes("bucket");
      setResumeError(
        needsBucket
          ? "Unable to upload resume. Verify Firebase Storage is enabled and the VITE_FIREBASE_STORAGE_BUCKET env var is set."
          : "Unable to upload your resume right now. Please try again."
      );
    } finally {
      setUploadingResume(false);
      event.target.value = "";
    }
  };

  const handleResumeRemove = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    try {
      await removeExistingFile(profileData.resumeStoragePath);
    } catch (err) {
      console.error("Failed removing resume:", err);
    } finally {
      setUploadingResume(false);
      setProfileData((prev) => ({
        ...prev,
        resumeFile: "",
        resumeFileName: "",
        resumeStoragePath: "",
      }));
    }
  };

  const handleSupportingUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if ((additionalFiles || []).length >= 3) {
      setDocError("You can upload up to three supporting documents.");
      return;
    }
    if (!requireAuth()) return;

    setUploadingDoc(true);
    setDocError("");
    try {
      const path = `profiles/${user.uid}/portfolio/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setProfileData((prev) => ({
        ...prev,
        additionalFiles: [
          ...(prev.additionalFiles || []),
          { name: file.name, url, path },
        ],
      }));
    } catch (err) {
      console.error("Portfolio document upload failed:", err);
      const needsBucket =
        err?.code === "storage/invalid-argument" || err?.message?.includes("bucket");
      setDocError(
        needsBucket
          ? "Unable to upload document. Check that Firebase Storage is enabled and the storage bucket env var is configured."
          : "Unable to upload that document right now."
      );
    } finally {
      setUploadingDoc(false);
      event.target.value = "";
    }
  };

  const handleSupportingRemove = async (file) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      await removeExistingFile(file.path);
    } catch (err) {
      console.error("Failed removing document:", err);
    } finally {
      setUploadingDoc(false);
      setProfileData((prev) => ({
        ...prev,
        additionalFiles: (prev.additionalFiles || []).filter(
          (entry) => entry.path !== file.path
        ),
      }));
    }
  };

  useEffect(() => {
    if (!registerValidator) return;
    const validator = () => {
      if (uploadingResume) {
        setResumeError("Your resume is still uploading. Please wait a moment.");
        return false;
      }
      if (!profileData.resumeFile) {
        setResumeError("Upload your CV or resume to continue.");
        return false;
      }
      setResumeError("");
      return true;
    };
    registerValidator(validator);
    return () => registerValidator(null);
  }, [registerValidator, profileData.resumeFile, uploadingResume]);

  return (
    <div className="section">
      <h2>Portfolio & Proof of Work</h2>
      <p>Upload a current CV or resume and up to three supporting documents.</p>

      <label>CV or Resume *</label>
      <div className="nested-card">
        {resumeFile ? (
          <>
            <p className="selected-info">
              <span className="label-light">File:</span> {resumeFileName || "Uploaded"}
            </p>
            <div className="section-actions" style={{ justifyContent: "flex-start" }}>
              <a className="card-cta" href={resumeFile} target="_blank" rel="noreferrer">
                View Resume
              </a>
              <button
                type="button"
                className="back"
                onClick={handleResumeRemove}
                disabled={uploadingResume}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleResumeUpload}
              disabled={uploadingResume}
            />
            <p className="description">
              Accepted formats: PDF or Word documents. Upload once—clients can preview directly.
            </p>
          </>
        )}
        {resumeError && (
          <p className="error-message" role="alert">
            {resumeError}
          </p>
        )}
      </div>

      <label>Supporting Documents (optional)</label>
      <input
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleSupportingUpload}
        disabled={uploadingDoc}
      />
      <p className="description">Add up to three project samples, writing samples, or decks.</p>

      {additionalFiles.length > 0 && (
        <div className="file-list">
          {additionalFiles.map((file) => (
            <div key={file.path || file.url} className="portfolio-item">
              <a href={file.url} target="_blank" rel="noreferrer">
                {file.name || "Supporting document"}
              </a>
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleSupportingRemove(file)}
                disabled={uploadingDoc}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {docError && (
        <p className="error-message" role="alert">
          {docError}
        </p>
      )}
    </div>
  );
}
