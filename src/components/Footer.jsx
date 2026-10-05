import React from "react";
import { Heart, PawPrint } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><PawPrint size={18} /> Pet Haven</div>
      <span>Made with <Heart size={13} fill="currentColor" /> for every kind of pet.</span>
      <span>WMD Lab · Experiment 3 · React & JSX</span>
    </footer>
  );
}