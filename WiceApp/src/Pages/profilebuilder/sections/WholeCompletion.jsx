export default function WholeCompletion({ onHome }) {
  return (
    <div className="section">
      <h2>Your Full Profile is Complete</h2>
      <p>
        Congratulations! You have completed your WICE Full Profile. Your profile
        is now visible to clients. You can edit or update details anytime.
      </p>
      <button className="next" onClick={onHome}>Go to Home Page</button>
    </div>
  );
}
