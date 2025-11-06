import React, { useState } from "react";
import "./BillingClientSide.css";

export default function BillingClientSide() {
  // Local state only for fields that need validation/masking
  const [ccnum, setCcnum] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");

  // --- helpers ---
  const luhnOk = (num) => {
    const s = num.replace(/\s+/g, "");
    if (s.length < 12) return false;
    let sum = 0, dbl = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = +s[i];
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  };
 
 
  const validExpiry = (mmYY) => {
    if (!/^\d{2}\/\d{2}$/.test(mmYY)) return false;
    const [mm, yy] = mmYY.split("/").map(Number);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const y = now.getFullYear() % 100, m = now.getMonth() + 1;
    return yy > y || (yy === y && mm >= m);
  };
 
 
  // --- masks ---
  const onCcChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    setCcnum(v);
  };
 
 
  const onExpChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    setExp(v);
  };
 
 
  const onCvcChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvc(v);
  };
 
 
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
 
 
    const requiredIds = [
      "email","fname","lname","addr","city","state","zip","country","ccname"
    ];
    for (const id of requiredIds) {
      const el = e.currentTarget.querySelector("#" + id);
      if (!el || !el.value) {
        setError("Please complete all required fields.");
        el?.focus();
        return;
      }
    }
    if (!luhnOk(ccnum)) return setError("Card number looks invalid (Luhn check failed).");
    if (!validExpiry(exp)) return setError("Expiry date must be valid and in the future (MM/YY).");
    if (cvc.length < 3) return setError("CVC must be 3–4 digits.");
 
 
    alert(
      `Payment authorized!\n\nAmount: (demo)\nReference: #WICE-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`
    );
  };
 
 
  return (
    <div className="dashboard-page billing-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Billing &amp; Payment</h1>
        <p className="dashboard-subtitle">Update your billing information.</p>
      </header>

      <div className="billing-layout">
        <main className="billing-main">
          <section className="billing-card" aria-labelledby="heading">
          <div className="hd">
            <div className="brand">
              <span className="dot" aria-hidden="true"></span>
              <span>WICE</span>
            </div>
            <h1 id="heading" className="h1-tight">Billing &amp; Payment</h1>
            <p className="sub">Update your billing information.</p>
          </div>
 
 
          <form className="bd" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="billing-error" role="alert">
                {error}
              </div>
            )}
            {/* Contact */}
            <div className="row">
              <h2 className="h2-tight">Contact</h2>
            </div>
            <div className="grid">
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" placeholder="you@example.com" autoComplete="email" required />
              </div>
              <div>
                <label htmlFor="phone">Phone</label>
                <input id="phone" type="tel" placeholder="(555) 555-1234" autoComplete="tel" />
              </div>
            </div>
 
 
            <hr className="divider" />
 
 
            {/* Billing Address */}
            <h2 className="h2-tight-small">Billing address</h2>
            <div className="grid">
              <div>
                <label htmlFor="fname">First name</label>
                <input id="fname" autoComplete="given-name" required />
              </div>
              <div>
                <label htmlFor="lname">Last name</label>
                <input id="lname" autoComplete="family-name" required />
              </div>
            </div>
 
 
            <label htmlFor="addr">Address</label>
            <input id="addr" autoComplete="address-line1" placeholder="1234 University Ave" required />
 
 
            <div className="grid">
              <div>
                <label htmlFor="city">City</label>
                <input id="city" autoComplete="address-level2" required />
              </div>
              <div>
                <label htmlFor="state">State</label>
                <input id="state" autoComplete="address-level1" required />
              </div>
            </div>
 
 
            <div className="grid">
              <div>
                <label htmlFor="zip">ZIP Code</label>
                <input
                  id="zip"
                  inputMode="numeric"
                  pattern="[0-9A-Za-z\\- ]{3,10}"
                  autoComplete="postal-code"
                  required
                />
              </div>
              <div>
                <label htmlFor="country">Country</label>
                <input id="country" autoComplete="country-name" required />
              </div>
            </div>
 
 
            <hr className="divider" />
 
 
            {/* Card */}
            <h2 className="h2-tight-small">Card Information</h2>
            <div id="cardPane">
              <div className="grid">
                <div>
                  <label htmlFor="ccname">Name on card</label>
                  <input id="ccname" autoComplete="cc-name" required />
                </div>
              </div>
 
 
              <div className="grid-3">
                <div>
                  <label htmlFor="ccnum">Card number</label>
                  <input
                    id="ccnum"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    value={ccnum}
                    onChange={onCcChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="exp">Expiration Date</label>
                  <input
                    id="exp"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={exp}
                    onChange={onExpChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cvc">CVC</label>
                  <input
                    id="cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    placeholder="123"
                    value={cvc}
                    onChange={onCvcChange}
                    required
                  />
                </div>
              </div>
 
 
              <label className="save-toggle">
                <input type="checkbox" id="saveCard" />
                <span>Save&nbsp;card</span>
              </label>
            </div>
 
 
            <hr className="divider" />
 
 
           
          </form>
          </section>
        </main>

        <aside className="billing-side" aria-hidden="true">
          <img
            alt="Scenic mountains and river"
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop"
          />
        </aside>
      </div>
    </div>
  );
}
 
