export default function IntroPage({ onStart }) {
  return (
    <div className="intro-section">
      <h1>Build your essential profile</h1>
      <p>
        This first step takes about seven to ten minutes. You can update your
        profile at any time. 
      </p>

      <p>You will have the option of quickly creating a profile with basic information called a Light profile or taking the time to complete your entire profile.</p>
      

      <button className="start-btn" onClick={onStart}>
        Start
      </button>

      <p className="small-link">
        Already have a profile?{" "}
        <a href="/login" style={{ color: "#bfa34b", fontWeight: "600" }}>
          Sign in
        </a>
      </p>
    </div>
  );
}
