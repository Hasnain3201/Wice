export default function IdentityBasics() {
  return (
    <div className="section">
      <h2>Identity Basics</h2>
      <p>
        Tell us where you are based so we can support time zone friendly matching and
        ease client coordination.
      </p>
      <form>
        <label>Full Name *</label>
        <input type="text" placeholder="Enter your full name" required />

        <label>Pronouns</label>
        <select>
          <option value="">Select...</option>
          <option>She / Her</option>
          <option>He / Him</option>
          <option>They / Them</option>
          <option>Prefer not to say</option>
        </select>

        <label>Time Zone *</label>
        <select required>
          <option value="">Select...</option>
          <option>EST</option>
          <option>PST</option>
          <option>CST</option>
          <option>MST</option>
        </select>
      </form>
    </div>
  );
}
