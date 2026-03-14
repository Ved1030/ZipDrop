"use client";

import { useEffect, useRef } from "react";
import UploadCard from "../components/UploadCard";
import ReceiveCard from "../components/ReceiveCard";

/* ─── Animated Particle Background ──────────── */

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 55;

    interface Particle {
      x: number; y: number;
      r: number;
      dx: number; dy: number;
      alpha: number;
      dAlpha: number;
    }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
      dAlpha: (Math.random() - 0.5) * 0.005,
    }));

    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha += p.dAlpha;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        if (p.alpha < 0.05 || p.alpha > 0.5) p.dAlpha *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 245, 255, ${p.alpha})`;
        ctx.fill();
      }

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 245, 255, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

/* ─── Logo ────────────────────────────── */

function ZipDropLogo() {
  return (
    <div
      className="logo-icon"
      style={{
        width: 48,
        height: 48,
        background: "linear-gradient(135deg, rgba(0,245,255,0.2), rgba(34,211,238,0.1))",
        border: "1px solid rgba(0,245,255,0.4)",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 24px rgba(0,245,255,0.25)",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00F5FF" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91A16 16 0 0015.1 17.9l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    </div>
  );
}



/* ─── Stats strip ──────────────────────── */

function StatsStrip() {
  const stats = [
    { label: "Transfers Today", value: "12,847" },
    { label: "Avg. Transfer Time", value: "0.4s" },
    { label: "Files Shared", value: "3.2M+" },
    { label: "Uptime", value: "99.98%" },
  ];

  return (
    <div style={{
      display: "flex",
      gap: "32px",
      justifyContent: "center",
      flexWrap: "wrap",
      margin: "0 auto",
      padding: "0 24px",
    }}>
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: "center" }}>
          <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--cyan)", fontFamily: "var(--font-mono)", textShadow: "0 0 16px rgba(0,245,255,0.5)" }}>
            {s.value}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────── */

export default function Home() {
  return (
    <>
      {/* Background layers */}
      <div className="grid-bg" />
      <ParticleBackground />

      {/* Radial glow blobs */}
      <div style={{
        position: "fixed",
        top: "-20%",
        left: "-10%",
        width: "50vw",
        height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)",
        zIndex: 0,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed",
        bottom: "-20%",
        right: "-10%",
        width: "40vw",
        height: "40vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)",
        zIndex: 0,
        pointerEvents: "none",
      }} />



      <main
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "80px",
          paddingBottom: "80px",
          paddingLeft: "24px",
          paddingRight: "24px",
          gap: "56px",
        }}
      >
        {/* ── HERO SECTION ── */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
            maxWidth: "640px",
            animation: "fadeInDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          {/* Top badge */}
          <div className="badge" style={{ fontSize: "11px", padding: "5px 14px" }}>
            <span className="badge-dot" />
            No sign-up · No limits · Instant sharing
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(64px, 12vw, 108px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
          }}>
            Zip<span
              className="glow-text"
              style={{
                position: "relative",
                display: "inline-block",
              }}
            >
              Drop
              <span style={{
                position: "absolute",
                bottom: -6,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, transparent, var(--cyan), transparent)",
                borderRadius: 2,
                boxShadow: "0 0 12px rgba(0,245,255,0.6)",
              }} />
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: "clamp(14px, 2vw, 18px)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: "480px",
          }}>
            ZipDrop lets you securely share files and text across devices in seconds.
            Upload, get a code, receive—no accounts needed.
          </p>
        </section>

        {/* ── CARDS SECTION ── */}
        <section
          style={{
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "100%",
            maxWidth: "900px",
          }}
        >
          <UploadCard />
          <ReceiveCard />
        </section>

        {/* ── STATS ── */}
        <section style={{ animation: "fadeInUp 0.8s 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          <StatsStrip />
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          maxWidth: "700px",
          width: "100%",
          animation: "fadeInUp 0.8s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        }}>
          <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            How it works
          </h2>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { step: "01", title: "Upload", desc: "Drop your files or paste text into the Share panel." },
              { step: "02", title: "Get Code", desc: "A unique 4-digit code is generated instantly." },
              { step: "03", title: "Receive", desc: "Enter the code on any device to retrieve your content." },
            ].map((item) => (
              <div
                key={item.step}
                className="glass-card"
                style={{
                  flex: "1 1 180px",
                  maxWidth: "200px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--cyan)",
                  letterSpacing: "0.08em",
                  textShadow: "0 0 10px rgba(0,245,255,0.5)",
                }}>
                  {item.step}
                </span>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {item.title}
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          textAlign: "center",
          fontSize: "12px",
          color: "var(--text-muted)",
          animation: "fadeIn 1s 0.6s ease both",
        }}>
          <div className="divider" style={{ marginBottom: "16px", width: "300px", margin: "0 auto 16px" }} />
          Built with ☄ by ZipDrop · Zero-knowledge file sharing
        </footer>
      </main>
    </>
  );
}