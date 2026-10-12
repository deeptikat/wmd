import React, { useState } from "react";
import { UserRound, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function UserLogin({ onLogin, onSwitch }) {
  const [isRegistration, setIsRegistration] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await onLogin(
        isRegistration ? { name, email, password } : { email, password },
        isRegistration
      );
    } catch (loginError) {
      setError(loginError.message);
    }
  }

  function toggleMode() {
    setIsRegistration(current => !current);
    setError("");
  }

  return (
    <section className="login-card">
      <div className="login-icon user-icon"><UserRound size={26} /></div>
      <p className="eyebrow">CUSTOMER ACCESS</p>
      <h1>{isRegistration ? "Create your account." : "Every pet deserves more."}</h1>
      <p className="muted">{isRegistration ? "Join Pet Haven to shop and track your orders." : "Sign in to explore thoughtful essentials for your best friend."}</p>
      <form onSubmit={submit} className="login-form">
        {isRegistration && (
          <>
            <label htmlFor="user-name">Your name</label>
            <input id="user-name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" required />
          </>
        )}
        <label htmlFor="user-email">Email address</label>
        <input id="user-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required />
        <label htmlFor="user-password">Password</label>
        <div className="password-wrap">
          <input id="user-password" type={showPassword ? "text" : "password"} autoComplete={isRegistration ? "new-password" : "current-password"} minLength={isRegistration ? 8 : undefined} value={password} onChange={event => setPassword(event.target.value)} placeholder={isRegistration ? "At least 8 characters" : "Enter your password"} required />
          <button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit">{isRegistration ? "Create account" : "Sign in to Pet Haven"} <ArrowRight size={17} /></button>
      </form>
      <button className="text-button" type="button" onClick={toggleMode}>
        {isRegistration ? "Already have an account?" : "New to Pet Haven?"} <strong>{isRegistration ? "Sign in" : "Create an account"}</strong>
      </button>
      <button className="text-button" type="button" onClick={onSwitch}>Are you an administrator? <strong>Admin login</strong></button>
    </section>
  );
}