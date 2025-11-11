export default function CompletionPage() {
  return (
    <div className="section">
      <h2>Light Profile Completed!</h2>
      <p>
        Your profile is now active at a basic level. You are discoverable and can receive
        client inquiries for relevant opportunities.
      </p>

      <div className="summary-card">
        <p>
          Completing your full profile now improves your visibility and the quality of
          opportunities you receive.
        </p>

        <div className="completion-actions">
          <button className="next">Complete Full Profile Now</button>
          <button className="back">Save and Return to Home Page</button>
        </div>
      </div>
    </div>
  );
}
