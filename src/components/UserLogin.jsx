import React, { useState } from "react";
import { UserRound, Eye, EyeOff, ArrowRight } from "lucide-react";
import { demoCredentials } from "../data";

export default function UserLogin({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (email.trim().toLowerCase() === demoCredentials.user.email && password === demoCredentials.user.password) {
      setError("");
      onLogin({ name: "Pet Parent", email, role: "User" });
    } else {
      setError("Incorrect user email or password. Use the demo credentials below.");
    }
  }

  return (
    <section className="login-card">
      <div className="login-icon user-icon"><UserRound size={26} /></div>
      <p className="eyebrow">CUSTOMER ACCESS</p>
      <h1>Every pet deserves more.</h1>
      <p className="muted">Sign in to explore thoughtful essentials for your best friend.</p>
      <form onSubmit={submit} className="login-form">
        <label htmlFor="user-email">Email address</label>
        <input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
        <label htmlFor="user-password">Password</label>
        <div className="password-wrap">
          <input id="user-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          <button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit">Sign in to Pet Haven <ArrowRight size={17} /></button>
      </form>
      <div className="demo-box"><strong>Demo user login</strong><span>Email: user@pethaven.com</span><span>Password: user123</span></div>
      <button className="text-button" onClick={onSwitch}>Are you an administrator? <strong>Admin login</strong></button>
    </section>
  );
}