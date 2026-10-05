import React, { useState } from "react";
import { ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react";
import { demoCredentials } from "../data";

export default function AdminLogin({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (email.trim().toLowerCase() === demoCredentials.admin.email && password === demoCredentials.admin.password) {
      setError("");
      onLogin({ name: "Admin", email, role: "Admin" });
    } else {
      setError("Incorrect admin email or password. Use the demo credentials below.");
    }
  }

  return (
    <section className="login-card">
      <div className="login-icon admin-icon"><ShieldCheck size={26} /></div>
      <p className="eyebrow">STAFF ACCESS</p>
      <h1>Welcome back, Admin.</h1>
      <p className="muted">Sign in to view the Pet Haven management dashboard.</p>
      <form onSubmit={submit} className="login-form">
        <label htmlFor="admin-email">Admin email</label>
        <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@pethaven.com" required />
        <label htmlFor="admin-password">Password</label>
        <div className="password-wrap">
          <input id="admin-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          <button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit">Sign in as Admin <ArrowRight size={17} /></button>
      </form>
      <div className="demo-box"><strong>Demo admin login</strong><span>Email: admin@pethaven.com</span><span>Password: admin123</span></div>
      <button className="text-button" onClick={onSwitch}>Looking for customer login? <strong>Sign in as a user</strong></button>
    </section>
  );
}