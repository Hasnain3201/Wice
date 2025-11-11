export default function ProfessionalIdentity({ onNext }) {
  return (
    <div className="section">
      <h2>Professional Identity</h2>
      <p>
        Build a snapshot of who you are professionally. These details help clients
        understand your background quickly.
      </p>

      <form>
        <label>Professional Headline *</label>
        <input
          type="text"
          placeholder="Example: Global Health Advisor with 12 years supporting Latin America programs."
          maxLength="120"
          required
        />

        <label>Short Bio *</label>
        <textarea
          placeholder="Write a short bio (250–600 characters)"
          rows="5"
          minLength="250"
          maxLength="600"
          required
        />

        <label>Total Years of Professional Experience *</label>
        <select required>
          <option value="">Select...</option>
          <option>Less than 2</option>
          <option>2-4</option>
          <option>5-7</option>
          <option>8-10</option>
          <option>11-14</option>
          <option>15-20</option>
          <option>20+</option>
        </select>

        <label>LinkedIn URL</label>
        <input type="url" placeholder="https://www.linkedin.com/in/yourname" />

        <div className="section-actions">
          <button type="button" className="skip">Skip</button>
          <button type="button" className="link">Already have a profile</button>
          <button type="button" className="next" onClick={onNext}>Next</button>
        </div>
      </form>
    </div>
  );
}
