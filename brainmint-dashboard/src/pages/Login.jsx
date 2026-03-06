import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogIn, ArrowRight, ArrowLeft, Check, Zap, Shield, Users, ChevronDown, Globe, Lock, Star } from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

function Orb({ style }) {
  return <div className="orb" style={style} />;
}

function ParticleField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.4 + 0.1,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="particle-canvas" />;
}

function TypingText({ words }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let timeout;
    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIdx((wordIdx + 1) % words.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, wordIdx, words]);

  return (
    <span className="typing-word">
      {displayed}<span className="cursor">|</span>
    </span>
  );
}

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const submit = async () => {
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.user) {
        let user;
        if (Array.isArray(data.user)) {
          user = { id: data.user[0], name: data.user[1], email: form.email };
        } else if (typeof data.user === "object") {
          user = { id: data.user.id || data.user[0], name: data.user.full_name || data.user.name || data.user[1], email: form.email };
        } else {
          setError("Invalid user data format from server");
          return;
        }
        setSuccess(true);
        setTimeout(() => {
          if (onLogin) onLogin(user);
          navigate("/dashboard");
        }, 900);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") submit(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,700;12..96,800&family=Geist+Mono:wght@300;400&display=swap');

        :root {
          --bg: #05050a;
          --border: rgba(255,255,255,0.07);
          --text: #f0eeff;
          --muted: #6b6b8a;
          --accent: #7c5cfc;
          --accent2: #c084fc;
          --accent3: #38bdf8;
          --danger: #f43f5e;
          --success: #34d399;
          --ease: cubic-bezier(0.16,1,0.3,1);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ══════════════════════════════════════════
           TOP NAVBAR
        ══════════════════════════════════════════ */
        .top-navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);
          animation: navSlideDown 0.5s var(--ease) both;
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .nav-logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #7c5cfc, #c084fc);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(124,92,252,0.35);
        }
        .nav-logo-text {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px; font-weight: 800;
          color: #080814; letter-spacing: -0.03em;
        }
        .nav-logo-badge {
          font-size: 9px; font-weight: 700;
          background: linear-gradient(135deg, rgba(124,92,252,0.12), rgba(192,132,252,0.12));
          border: 1px solid rgba(124,92,252,0.2);
          color: #7c5cfc; padding: 2px 6px; border-radius: 4px;
          letter-spacing: 0.08em; text-transform: uppercase;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nav-link {
          display: flex; align-items: center; gap: 4px;
          padding: 6px 12px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 13.5px; font-weight: 500;
          color: #64748b; text-decoration: none;
          border-radius: 8px; cursor: pointer;
          border: none; background: none;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .nav-link:hover { color: #0f172a; background: #f8fafc; }
        .nav-link svg { opacity: 0.6; }

        .nav-divider {
          width: 1px; height: 18px;
          background: #e2e8f0; margin: 0 8px;
        }

        .nav-right {
          display: flex; align-items: center; gap: 10px;
        }

        .nav-status {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 12px; font-weight: 500; color: #22c55e;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          padding: 4px 10px; border-radius: 20px;
        }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e;
          animation: statusPulse 2s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }

        .nav-btn-secondary {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 13.5px; font-weight: 600;
          color: #374151; background: none;
          border: 1.5px solid #e5e7eb;
          padding: 7px 16px; border-radius: 9px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .nav-btn-secondary:hover {
          border-color: #7c5cfc; background: rgba(124,92,252,0.04);
          transform: translateY(-1px);
        }

        .nav-btn-primary {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 13.5px; font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #7c5cfc, #a855f7);
          border: none;
          padding: 7px 18px; border-radius: 9px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 2px 8px rgba(124,92,252,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .nav-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(124,92,252,0.4);
        }

        /* ══════════════════════════════════════════
           WEBSITE FOOTER SECTION
        ══════════════════════════════════════════ */
        .site-footer {
          background: #05050a;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 60px 80px 0;
          position: relative;
          overflow: hidden;
        }
        .site-footer::before {
          content: '';
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 600px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5), transparent);
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .footer-brand {}
        .footer-brand-logo {
          display: flex; align-items: center; gap: 9px;
          margin-bottom: 14px;
        }
        .footer-brand-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #7c5cfc, #c084fc);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 12px rgba(124,92,252,0.4);
        }
        .footer-brand-name {
          font-size: 17px; font-weight: 800;
          color: #f0eeff; letter-spacing: -0.03em;
        }
        .footer-brand-desc {
          font-size: 13px; line-height: 1.7; color: #6b6b8a;
          max-width: 220px; margin-bottom: 20px;
        }
        .footer-social {
          display: flex; gap: 8px;
        }
        .footer-social-btn {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          color: #6b6b8a; cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
        }
        .footer-social-btn:hover {
          background: rgba(124,92,252,0.15);
          border-color: rgba(124,92,252,0.3);
          color: #c084fc; transform: translateY(-2px);
        }

        .footer-col-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #f0eeff;
          margin-bottom: 16px;
        }
        .footer-col-links {
          display: flex; flex-direction: column; gap: 10px;
        }
        .footer-col-link {
          font-size: 13px; font-weight: 400; color: #6b6b8a;
          background: none; border: none; cursor: pointer; text-align: left;
          padding: 0; font-family: 'Bricolage Grotesque', sans-serif;
          transition: color 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .footer-col-link:hover { color: #c084fc; }
        .footer-link-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
          padding: 1px 6px; border-radius: 4px; text-transform: uppercase;
        }
        .badge-new { background: rgba(124,92,252,0.15); color: #c084fc; border: 1px solid rgba(124,92,252,0.25); }
        .badge-hot { background: rgba(249,115,22,0.12); color: #fb923c; border: 1px solid rgba(249,115,22,0.2); }

        /* Newsletter strip */
        .footer-newsletter {
          padding: 28px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between; gap: 32px;
        }
        .newsletter-left {}
        .newsletter-title {
          font-size: 15px; font-weight: 700; color: #f0eeff;
          margin-bottom: 4px; letter-spacing: -0.02em;
        }
        .newsletter-sub {
          font-size: 12.5px; color: #6b6b8a;
        }
        .newsletter-form {
          display: flex; gap: 8px; flex-shrink: 0;
        }
        .newsletter-input {
          padding: 10px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          font-size: 13px; font-family: 'Bricolage Grotesque', sans-serif;
          color: #f0eeff; outline: none; width: 230px;
          transition: border-color 0.2s, background 0.2s;
        }
        .newsletter-input::placeholder { color: #6b6b8a; }
        .newsletter-input:focus {
          border-color: rgba(124,92,252,0.5);
          background: rgba(124,92,252,0.07);
        }
        .newsletter-btn {
          padding: 10px 18px;
          background: linear-gradient(135deg, #7c5cfc, #a855f7);
          border: none; border-radius: 9px;
          font-size: 13px; font-weight: 700;
          font-family: 'Bricolage Grotesque', sans-serif;
          color: white; cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .newsletter-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(124,92,252,0.4);
        }

        /* Bottom strip */
        .footer-bottom {
          padding: 20px 0;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          flex-wrap: wrap;
        }
        .footer-bottom-left {
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap;
        }
        .footer-copy {
          font-size: 12px; color: #4b4b6b;
        }
        .footer-sep { color: #2a2a40; font-size: 11px; }
        .footer-legal-link {
          font-size: 12px; color: #4b4b6b;
          background: none; border: none; cursor: pointer;
          font-family: 'Bricolage Grotesque', sans-serif;
          transition: color 0.15s; padding: 0;
        }
        .footer-legal-link:hover { color: #6b6b8a; }

        .footer-bottom-right {
          display: flex; align-items: center; gap: 16px;
        }
        .footer-trust-chips {
          display: flex; gap: 6px;
        }
        .footer-chip {
          display: flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 20px;
          font-size: 10.5px; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.07);
          color: #6b6b8a; background: rgba(255,255,255,0.03);
        }
        .footer-locale {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 500; color: #4b4b6b;
          background: none; border: none; cursor: pointer;
          font-family: 'Bricolage Grotesque', sans-serif;
          transition: color 0.15s;
        }
        .footer-locale:hover { color: #6b6b8a; }

        /* ══════════════════════════════════════════
           MAIN LAYOUT
        ══════════════════════════════════════════ */
        .lg-root {
          min-height: calc(100vh - 60px);
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          font-family: 'Bricolage Grotesque', sans-serif;
          background: var(--bg);
          overflow: hidden;
          padding-top: 60px;
        }

        .lg-form-panel {
          background: #ffffff;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 44px; position: relative; overflow: hidden;
          order: 1;
        }
        .lg-form-panel::before {
          content: '';
          position: absolute; top: -120px; left: -120px;
          width: 440px; height: 440px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 70%);
          pointer-events: none;
          animation: glowDrift 6s ease-in-out infinite alternate;
        }
        .lg-form-panel::after {
          content: '';
          position: absolute; bottom: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(192,132,252,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        @keyframes glowDrift { 0%{transform:translate(0,0)} 100%{transform:translate(20px,20px)} }

        .lg-left {
          position: relative;
          display: flex; flex-direction: column;
          padding: 40px 52px;
          overflow: hidden;
          order: 2;
        }

        .particle-canvas {
          position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
        }
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
          animation: orbFloat 8s ease-in-out infinite alternate;
        }
        @keyframes orbFloat {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(20px,-30px) scale(1.08); }
          100% { transform: translate(-10px,15px) scale(0.94); }
        }

        /* ══════════════════════════════════════════
           BRAND IN DARK PANEL
        ══════════════════════════════════════════ */
        .lg-brand {
          position: relative; display: flex; align-items: center; gap: 12px;
          opacity: 0; transform: translateY(-14px);
          transition: opacity 0.6s var(--ease), transform 0.6s var(--ease);
        }
        .lg-brand.in { opacity: 1; transform: translateY(0); }
        .brand-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          animation: iconPulse 3s ease-in-out infinite;
        }
        @keyframes iconPulse {
          0%,100% { box-shadow: 0 0 20px rgba(124,92,252,0.4); }
          50%      { box-shadow: 0 0 38px rgba(124,92,252,0.7); }
        }
        .brand-name { font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.03em; }
        .brand-badge {
          font-size: 10px; font-weight: 600;
          background: rgba(124,92,252,0.15); border: 1px solid rgba(124,92,252,0.3);
          color: var(--accent2); padding: 2px 8px; border-radius: 20px; letter-spacing: 0.06em;
        }

        .lg-hero { position: relative; margin-top: auto; margin-bottom: 36px; }

        .hero-pill {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--accent2);
          background: rgba(192,132,252,0.08); border: 1px solid rgba(192,132,252,0.18);
          padding: 5px 12px; border-radius: 20px; margin-bottom: 24px;
          opacity: 0; transform: translateX(18px);
          transition: opacity 0.7s 0.1s var(--ease), transform 0.7s 0.1s var(--ease);
        }
        .hero-pill.in { opacity: 1; transform: translateX(0); }
        .pill-dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--accent2);
          animation: blink 1.6s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }

        .hero-h1 {
          font-size: clamp(32px, 3.5vw, 52px); font-weight: 800;
          line-height: 1.08; letter-spacing: -0.035em; color: var(--text); margin-bottom: 18px;
        }
        .h1-line { display: block; overflow: hidden; }
        .h1-line-inner {
          display: block;
          opacity: 0; transform: translateY(100%);
          transition: opacity 0.65s var(--ease), transform 0.65s var(--ease);
        }
        .h1-line-inner.in { opacity: 1; transform: translateY(0); }
        .h1-line:nth-child(2) .h1-line-inner { transition-delay: 0.08s; }

        .typing-word { color: var(--accent2); font-style: italic; }
        .cursor {
          display: inline-block;
          animation: cursorBlink 0.75s step-end infinite;
          color: var(--accent2); font-weight: 300;
        }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }

        .hero-sub {
          font-size: 14.5px; line-height: 1.7; color: var(--muted);
          font-weight: 400; max-width: 370px;
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.7s 0.32s var(--ease), transform 0.7s 0.32s var(--ease);
        }
        .hero-sub.in { opacity: 1; transform: translateY(0); }

        .feat-list {
          display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.7s 0.42s var(--ease), transform 0.7s 0.42s var(--ease);
        }
        .feat-list.in { opacity: 1; transform: translateY(0); }

        .feat-item {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--border);
          border-radius: 12px; padding: 12px 16px;
          transition: border-color 0.25s, background 0.25s, transform 0.25s;
          cursor: default;
        }
        .feat-item:hover {
          border-color: rgba(124,92,252,0.3);
          background: rgba(124,92,252,0.05);
          transform: translateX(4px);
        }
        .feat-icon-wrap {
          width: 30px; height: 30px; border-radius: 9px;
          background: rgba(124,92,252,0.15);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .feat-text { font-size: 13px; font-weight: 600; color: var(--text); }
        .feat-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .feat-arrow { margin-left: auto; color: var(--muted); transition: color 0.2s, transform 0.2s; }
        .feat-item:hover .feat-arrow { color: var(--accent2); transform: translateX(3px); }

        .lg-quote {
          position: relative;
          background: rgba(255,255,255,0.025); border: 1px solid var(--border);
          border-radius: 18px; padding: 20px 22px; overflow: hidden;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.7s 0.52s var(--ease), transform 0.7s 0.52s var(--ease);
        }
        .lg-quote.in { opacity: 1; transform: translateY(0); }
        .lg-quote::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,92,252,0.55), transparent);
        }
        .q-mark { font-size: 42px; line-height: 1; color: rgba(124,92,252,0.25); font-family: Georgia, serif; margin-bottom: -6px; }
        .q-text { font-size: 13px; line-height: 1.65; color: rgba(240,238,255,0.72); font-style: italic; margin-bottom: 14px; }
        .q-row { display: flex; align-items: center; gap: 10px; }
        .q-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
          box-shadow: 0 0 12px rgba(124,92,252,0.4);
        }
        .q-name { font-size: 12.5px; font-weight: 700; color: var(--text); }
        .q-role { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .q-badge {
          margin-left: auto; display: flex; align-items: center; gap: 4px;
          font-size: 10.5px; color: var(--success);
          background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2);
          padding: 3px 8px; border-radius: 20px;
        }

        /* ══════════════════════════════════════════
           FORM CARD
        ══════════════════════════════════════════ */
        .lg-card {
          position: relative; width: 100%; max-width: 390px; z-index: 1;
          opacity: 0; transform: translateX(-28px);
          transition: opacity 0.8s 0.15s var(--ease), transform 0.8s 0.15s var(--ease);
        }
        .lg-card.in { opacity: 1; transform: translateX(0); }

        .card-top { margin-bottom: 26px; }
        .card-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 10px;
        }
        .eyebrow-bar { width: 22px; height: 2px; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 1px; }
        .card-h2 { font-size: 27px; font-weight: 800; color: #080814; letter-spacing: -0.035em; line-height: 1.15; margin-bottom: 7px; }
        .card-sub { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 7px; }
        .sub-sep { width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1; }
        .card-sub button {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 13px; font-weight: 700; color: var(--accent);
          transition: opacity 0.2s;
        }
        .card-sub button:hover { opacity: 0.8; }

        .welcome-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, rgba(124,92,252,0.08), rgba(192,132,252,0.08));
          border: 1px solid rgba(124,92,252,0.15);
          border-radius: 24px; padding: 5px 14px;
          font-size: 12px; font-weight: 600; color: var(--accent);
          margin-bottom: 18px;
          animation: chipIn 0.5s 0.3s var(--ease) both;
        }
        @keyframes chipIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .chip-wave { animation: wave 1.8s ease-in-out infinite; display: inline-block; }
        @keyframes wave {
          0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-10deg)}
          40%{transform:rotate(14deg)} 60%{transform:rotate(-8deg)} 80%{transform:rotate(6deg)}
        }

        .err-box {
          display: flex; align-items: flex-start; gap: 10px;
          margin-bottom: 16px; padding: 11px 13px;
          background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px;
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)}
          40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)}
        }
        .err-icon {
          width: 18px; height: 18px; flex-shrink: 0; background: var(--danger);
          border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 1px;
        }
        .err-msg { font-size: 12.5px; color: #e11d48; font-weight: 500; line-height: 1.5; }

        .lg-form { display: flex; flex-direction: column; gap: 13px; }

        .field {
          display: flex; flex-direction: column; gap: 5px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.5s var(--ease), transform 0.5s var(--ease);
        }
        .field.in { opacity: 1; transform: translateY(0); }
        .field:nth-child(1) { transition-delay: 0.08s; }
        .field:nth-child(2) { transition-delay: 0.16s; }

        .f-label { font-size: 12px; font-weight: 600; color: #374151; display: flex; align-items: center; justify-content: space-between; }
        .f-forgot {
          background: none; border: none; padding: 0; cursor: pointer;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 11.5px; font-weight: 500; color: var(--accent);
          transition: opacity 0.2s;
        }
        .f-forgot:hover { opacity: 0.75; }

        .f-wrap { position: relative; }
        .f-input {
          width: 100%; padding: 12px 44px;
          border: 1.5px solid #e5e7eb; border-radius: 11px;
          font-size: 14px; font-family: 'Bricolage Grotesque', sans-serif;
          color: #0f172a; background: #fafafa; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
          -webkit-appearance: none;
        }
        .f-input::placeholder { color: #9ca3af; }
        .f-input:focus {
          border-color: var(--accent); background: #fff;
          box-shadow: 0 0 0 3px rgba(124,92,252,0.1);
          transform: translateY(-1px);
        }
        .f-input:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; transform: none; }

        .f-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; transition: color 0.2s; }
        .f-wrap:focus-within .f-icon { color: var(--accent); }

        .f-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; padding: 4px; cursor: pointer; color: #9ca3af;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .f-eye:hover { color: var(--accent); }

        .f-check {
          position: absolute; right: 13px; top: 50%;
          width: 20px; height: 20px; border-radius: 50%; background: var(--success);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: translateY(-50%) scale(0.4);
          transition: opacity 0.25s, transform 0.35s var(--ease); pointer-events: none;
        }
        .f-check.show { opacity: 1; transform: translateY(-50%) scale(1); }

        .btn-wrap {
          margin-top: 4px;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.5s 0.28s var(--ease), transform 0.5s 0.28s var(--ease);
        }
        .btn-wrap.in { opacity: 1; transform: translateY(0); }

        .lg-btn {
          width: 100%; padding: 14px;
          background: #080814; color: white; border: none; border-radius: 11px;
          font-size: 14.5px; font-weight: 700;
          font-family: 'Bricolage Grotesque', sans-serif;
          letter-spacing: -0.01em; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lg-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          opacity: 0; transition: opacity 0.3s;
        }
        .lg-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(124,92,252,0.32); }
        .lg-btn:not(:disabled):hover::before { opacity: 1; }
        .lg-btn:not(:disabled):active { transform: translateY(0); }
        .lg-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        .lg-btn:disabled::before { opacity: 0; }
        .btn-inner { position: relative; display: flex; align-items: center; gap: 8px; }
        .btn-arr { transition: transform 0.25s var(--ease); }
        .lg-btn:not(:disabled):hover .btn-arr { transform: translateX(4px); }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0;
          opacity: 0; transition: opacity 0.5s 0.35s;
        }
        .divider.in { opacity: 1; }
        .div-line { flex: 1; height: 1px; background: #f1f5f9; }
        .div-txt { font-size: 11px; color: #cbd5e1; font-weight: 600; letter-spacing: 0.05em; }

        .sec-btn {
          width: 100%; padding: 13px;
          background: transparent; border: 1.5px solid #e5e7eb;
          border-radius: 11px; color: #374151;
          font-size: 13.5px; font-weight: 600;
          font-family: 'Bricolage Grotesque', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.5s 0.38s var(--ease), transform 0.5s 0.38s var(--ease), border-color 0.2s, background 0.2s;
        }
        .sec-btn.in { opacity: 1; transform: translateY(0); }
        .sec-btn:hover { border-color: var(--accent); background: rgba(124,92,252,0.04); transform: translateY(-1px); }

        /* SSO strip */
        .sso-strip {
          display: flex; gap: 8px; margin-top: 10px;
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.5s 0.44s var(--ease), transform 0.5s 0.44s var(--ease);
        }
        .sso-strip.in { opacity: 1; transform: translateY(0); }
        .sso-btn {
          flex: 1; padding: 9px 12px;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          border: 1.5px solid #e5e7eb; border-radius: 9px;
          background: #fff; cursor: pointer;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 12px; font-weight: 600; color: #374151;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .sso-btn:hover { border-color: #94a3b8; background: #f8fafc; transform: translateY(-1px); }

        /* Trust row */
        .trust-row {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          margin-top: 18px; padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          opacity: 0; transform: translateY(6px);
          transition: opacity 0.5s 0.5s var(--ease), transform 0.5s 0.5s var(--ease);
        }
        .trust-row.in { opacity: 1; transform: translateY(0); }
        .trust-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 500; color: #94a3b8;
        }
        .trust-sep { width: 1px; height: 12px; background: #e2e8f0; }

        /* Success overlay */
        .success-overlay {
          position: absolute; inset: 0; background: white;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
          opacity: 0; pointer-events: none; transition: opacity 0.45s; z-index: 20;
        }
        .success-overlay.show { opacity: 1; pointer-events: auto; }
        .s-circle {
          width: 68px; height: 68px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          animation: sPop 0.6s var(--ease);
        }
        @keyframes sPop { 0%{transform:scale(0)} 70%{transform:scale(1.12)} 100%{transform:scale(1)} }
        .s-title { font-size: 22px; font-weight: 800; color: #080814; letter-spacing: -0.025em; }
        .s-sub { font-size: 13px; color: #64748b; }

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin { animation: spin 1s linear infinite; }

        /* Tablet Responsive Breakpoint */
        @media (max-width: 860px) {
          .lg-root { grid-template-columns: 1fr; padding-top: 60px; }
          .lg-left { display: none; }
          .lg-form-panel { padding: 40px 24px 32px; order: 1; }
          .nav-links { display: none; }
          .nav-status { display: none; }
          .top-navbar { padding: 0 20px; }
          .site-footer { padding: 40px 24px 0; }
          .footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
          .footer-newsletter { flex-direction: column; align-items: flex-start; gap: 16px; }
          .newsletter-form { width: 100%; }
          .newsletter-input { flex: 1; width: auto; }
          .footer-bottom { flex-direction: column; align-items: flex-start; gap: 12px; }
        }

        /* NEW Responsive Mobile Breakpoint */
        @media (max-width: 580px) {
          .top-navbar { padding: 0 16px; }
          .nav-btn-secondary { display: none; } /* hide secondary link to save space */
          .nav-btn-primary { padding: 7px 12px; font-size: 12.5px; }
          .nav-logo-text { font-size: 15px; }

          .lg-form-panel { padding: 30px 16px 24px; }
          .card-h2 { font-size: 24px; }
          
          /* Stack the SSO buttons cleanly */
          .sso-strip { flex-direction: column; gap: 10px; }
          
          /* Wrap the trust components */
          .trust-row { flex-wrap: wrap; padding-top: 10px; gap: 10px; }
          .trust-sep { display: none; } /* Hide the divider lines when they stack */

          .site-footer { padding: 30px 16px 0; }
          /* Single column footer */
          .footer-top { grid-template-columns: 1fr; gap: 32px; } 
          
          .newsletter-form { flex-direction: column; }
          .newsletter-btn { width: 100%; }

          .footer-bottom-left, .footer-bottom-right { width: 100%; justify-content: center; text-align: center; }
          .footer-trust-chips { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      {/* ══ TOP NAVBAR ══ */}
      <nav className="top-navbar">
        <div className="nav-left">
          <div className="nav-logo" onClick={() => navigate("/")}>
            <div className="nav-logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6.5V12.5C4 17 7.5 21.2 12 22.5C16.5 21.2 20 17 20 12.5V6.5L12 2Z" fill="white"/>
              </svg>
            </div>
            <span className="nav-logo-text">BrainMint</span>
            <span className="nav-logo-badge">BETA</span>
          </div>

          <div className="nav-divider" />

          <div className="nav-links">
            <button className="nav-link">
              Features <ChevronDown size={12} />
            </button>
            <button className="nav-link">Solutions</button>
            <button className="nav-link">Pricing</button>
            <button className="nav-link">Enterprise</button>
            <button className="nav-link">Docs</button>
          </div>
        </div>

        <div className="nav-right">
          <div className="nav-status">
            <span className="status-dot" />
            All systems operational
          </div>
          <button className="nav-btn-secondary" onClick={() => navigate("/")}>
            Create account
          </button>
          <button className="nav-btn-primary">
            <Zap size={13} />
            Start free trial
          </button>
        </div>
      </nav>

      {/* ══ MAIN BODY ══ */}
      <div className="lg-root">

        {/* FORM PANEL */}
        <div className="lg-form-panel">
          <div className={`success-overlay ${success ? "show" : ""}`}>
            <div className="s-circle"><Check size={28} color="white" strokeWidth={3} /></div>
            <div className="s-title">Welcome back! 👋</div>
            <div className="s-sub">Taking you to your dashboard…</div>
          </div>

          <div className={`lg-card ${mounted ? "in" : ""}`}>
            <div className="welcome-chip">
              <span className="chip-wave">👋</span>
              Welcome back
            </div>

            <div className="card-top">
              <div className="card-eyebrow">
                <div className="eyebrow-bar" />
                Sign in to continue
              </div>
              <h2 className="card-h2">Good to see<br />you again</h2>
              <div className="card-sub">
                Need an account?
                <span className="sub-sep" />
                <button onClick={() => navigate("/")}>Create one free</button>
              </div>
            </div>

            {error && (
              <div className="err-box">
                <div className="err-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 1v6M6 10v.5"/>
                  </svg>
                </div>
                <div className="err-msg">{error}</div>
              </div>
            )}

            <div className="lg-form">
              <div className={`field ${mounted ? "in" : ""}`}>
                <label className="f-label">Work Email</label>
                <div className="f-wrap">
                  <span className="f-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                    </svg>
                  </span>
                  <input
                    type="email" placeholder="you@company.com"
                    className="f-input" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onKeyPress={handleKeyPress} disabled={isLoading}
                  />
                  <div className={`f-check ${form.email.includes("@") && form.email.includes(".") ? "show" : ""}`}>
                    <Check size={9} color="white" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className={`field ${mounted ? "in" : ""}`}>
                <label className="f-label">
                  Password
                  <button className="f-forgot" type="button">Forgot password?</button>
                </label>
                <div className="f-wrap">
                  <span className="f-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"} placeholder="••••••••"
                    className="f-input" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onKeyPress={handleKeyPress} disabled={isLoading}
                  />
                  <button type="button" className="f-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={`btn-wrap ${mounted ? "in" : ""}`}>
                <button onClick={submit} disabled={isLoading} className="lg-btn">
                  <span className="btn-inner">
                    {isLoading ? (
                      <><Loader2 size={15} className="spin" /> Signing in…</>
                    ) : (
                      <><LogIn size={15} /> Sign In <ArrowRight size={14} className="btn-arr" /></>
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className={`divider ${mounted ? "in" : ""}`}>
              <div className="div-line" /><span className="div-txt">OR CONTINUE WITH</span><div className="div-line" />
            </div>

            <div className={`sso-strip ${mounted ? "in" : ""}`}>
              {/* Google */}
              <button className="sso-btn">
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              {/* Microsoft */}
              <button className="sso-btn">
                <svg width="15" height="15" viewBox="0 0 23 23">
                  <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                  <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                  <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                  <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
                </svg>
                Microsoft
              </button>
              {/* GitHub */}
              <button className="sso-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>

            <div className={`trust-row ${mounted ? "in" : ""}`}>
              <div className="trust-item">
                <Lock size={11} />
                256-bit SSL
              </div>
              <div className="trust-sep" />
              <div className="trust-item">
                <Shield size={11} />
                SOC 2 Certified
              </div>
              <div className="trust-sep" />
              <div className="trust-item">
                <Star size={11} />
                4.9 / 5 rating
              </div>
            </div>
          </div>
        </div>

        {/* DARK PANEL */}
        <div className="lg-left">
          <ParticleField />
          <Orb style={{ width:400, height:400, background:"rgba(124,92,252,0.16)", top:-90, right:-90, animationDuration:"9s" }} />
          <Orb style={{ width:280, height:280, background:"rgba(192,132,252,0.12)", bottom:50, left:-60, animationDuration:"11s", animationDelay:"2s" }} />
          <Orb style={{ width:180, height:180, background:"rgba(56,189,248,0.08)", top:"42%", left:30, animationDuration:"7s", animationDelay:"1s" }} />

          <div className={`lg-brand ${mounted ? "in" : ""}`}>
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6.5V12.5C4 17 7.5 21.2 12 22.5C16.5 21.2 20 17 20 12.5V6.5L12 2Z" fill="white"/>
              </svg>
            </div>
            <span className="brand-name">BrainMint</span>
            <span className="brand-badge">BETA</span>
          </div>

          <div className="lg-hero">
            <div className={`hero-pill ${mounted ? "in" : ""}`}>
              <span className="pill-dot" /> Live &amp; running
            </div>
            <h1 className="hero-h1">
              {[
                "Your tasks,",
                <>your <TypingText words={["workflow.", "schedule.", "focus.", "momentum."]} /></>,
              ].map((line, i) => (
                <span className="h1-line" key={i}>
                  <span className={`h1-line-inner ${mounted ? "in" : ""}`} style={{ transitionDelay: `${0.18 + i * 0.1}s` }}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p className={`hero-sub ${mounted ? "in" : ""}`}>
              Everything you left off — tasks, priorities, and your team — all waiting right where you left them.
            </p>
          </div>

          <div className={`feat-list ${mounted ? "in" : ""}`}>
            {[
              { icon: Zap,    text: "Instant sync",       sub: "Changes reflect across all devices" },
              { icon: Shield, text: "Enterprise security", sub: "SOC 2 compliant, end-to-end encrypted" },
              { icon: Users,  text: "Team collaboration",  sub: "Real-time updates for your whole team" },
            ].map(({ icon: Icon, text, sub }) => (
              <div className="feat-item" key={text}>
                <div className="feat-icon-wrap"><Icon size={14} color="#7c5cfc" /></div>
                <div>
                  <div className="feat-text">{text}</div>
                  <div className="feat-sub">{sub}</div>
                </div>
                <ArrowRight size={13} className="feat-arrow" />
              </div>
            ))}
          </div>

          <div className={`lg-quote ${mounted ? "in" : ""}`}>
            <div className="q-mark">"</div>
            <p className="q-text">Switching to BrainMint cut our planning meetings in half. Every person on the team knows exactly what to do next.</p>
            <div className="q-row">
              <div className="q-avatar">JL</div>
              <div>
                <div className="q-name">Jamie L.</div>
                <div className="q-role">VP Engineering, Acme Corp</div>
              </div>
              <div className="q-badge"><Check size={9} /> Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ WEBSITE FOOTER ══ */}
      <footer className="site-footer">
        {/* Main columns */}
        <div className="footer-top">
          {/* Brand column */}
          <div className="footer-brand">
            <div className="footer-brand-logo">
              <div className="footer-brand-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6.5V12.5C4 17 7.5 21.2 12 22.5C16.5 21.2 20 17 20 12.5V6.5L12 2Z" fill="white"/>
                </svg>
              </div>
              <span className="footer-brand-name">BrainMint</span>
            </div>
            <p className="footer-brand-desc">
              The modern project management platform built for high-velocity teams.
            </p>
            <div className="footer-social">
              {/* Twitter/X */}
              <button className="footer-social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              {/* LinkedIn */}
              <button className="footer-social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              {/* GitHub */}
              <button className="footer-social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </button>
              {/* YouTube */}
              <button className="footer-social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="footer-col-title">Product</div>
            <div className="footer-col-links">
              <button className="footer-col-link">Features</button>
              <button className="footer-col-link">
                Integrations
                <span className="footer-link-badge badge-new">New</span>
              </button>
              <button className="footer-col-link">Pricing</button>
              <button className="footer-col-link">Changelog</button>
              <button className="footer-col-link">
                AI Assist
                <span className="footer-link-badge badge-hot">Hot</span>
              </button>
              <button className="footer-col-link">Roadmap</button>
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="footer-col-title">Company</div>
            <div className="footer-col-links">
              <button className="footer-col-link">About us</button>
              <button className="footer-col-link">Blog</button>
              <button className="footer-col-link">Careers</button>
              <button className="footer-col-link">Press kit</button>
              <button className="footer-col-link">Contact</button>
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="footer-col-title">Resources</div>
            <div className="footer-col-links">
              <button className="footer-col-link">Documentation</button>
              <button className="footer-col-link">API Reference</button>
              <button className="footer-col-link">Guides</button>
              <button className="footer-col-link">Community</button>
              <button className="footer-col-link">Status page</button>
            </div>
          </div>

          {/* Legal */}
          <div>
            <div className="footer-col-title">Legal</div>
            <div className="footer-col-links">
              <button className="footer-col-link">Privacy Policy</button>
              <button className="footer-col-link">Terms of Service</button>
              <button className="footer-col-link">Cookie Policy</button>
              <button className="footer-col-link">Security</button>
              <button className="footer-col-link">GDPR</button>
            </div>
          </div>
        </div>

        {/* Newsletter strip */}
        <div className="footer-newsletter">
          <div className="newsletter-left">
            <div className="newsletter-title">Stay in the loop</div>
            <div className="newsletter-sub">Product updates, tips, and team spotlights — no spam.</div>
          </div>
          <div className="newsletter-form">
            <input className="newsletter-input" type="email" placeholder="you@company.com" />
            <button className="newsletter-btn">Subscribe</button>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-copy">© 2026 BrainMint Inc. All rights reserved.</span>
            <span className="footer-sep">·</span>
            <button className="footer-legal-link">Privacy</button>
            <span className="footer-sep">·</span>
            <button className="footer-legal-link">Terms</button>
            <span className="footer-sep">·</span>
            <button className="footer-legal-link">Cookies</button>
            <span className="footer-sep">·</span>
            <button className="footer-legal-link">Accessibility</button>
          </div>
          <div className="footer-bottom-right">
            <div className="footer-trust-chips">
              <div className="footer-chip"><Shield size={10} /> SOC 2</div>
              <div className="footer-chip"><Lock size={10} /> GDPR</div>
              <div className="footer-chip"><Check size={10} /> ISO 27001</div>
            </div>
            <button className="footer-locale">
              <Globe size={11} />
              English (US)
              <ChevronDown size={10} />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}