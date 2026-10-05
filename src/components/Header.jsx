import React from "react";
import { PawPrint, LogOut } from "lucide-react";

export default function Header({ user, onLogout, onHome }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="Pet Haven home">
        <span className="brand-mark"><PawPrint size={22} /></span>
        <span>pet<span className="brand-accent">haven</span><small>GOOD THINGS FOR GOOD PETS</small></span>
      </button>
      <div className="header-right">
        {user && <span className="role-pill">{user.role}</span>}
        {user && <span className="welcome-name">Hi, {user.name}</span>}
        {user && <button className="logout-button" onClick={onLogout}><LogOut size={16} /> Log out</button>}
      </div>
    </header>
  );
}