"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const SUPPORT_EMAIL = "viverevivi37@gmail.com";

type Problem = { title: string; text: string };
type Feature = { title: string; text: string };
type Step = { step: string; title: string; text: string };
type Faq = { q: string; a: string };

export type HomepageContent = {
  login: string;
  badge: string;
  heroTitle: string;
  heroText: string;
  problemsTitle: string;
  problems: readonly Problem[];
  featuresTitle: string;
  features: readonly Feature[];
  stepsTitle: string;
  steps: readonly Step[];
  pricingTitle: string;
  pricingText: string;
  pricingBullets: readonly string[];
  pricingCta: string;
  faqTitle: string;
  faqs: readonly Faq[];
  finalCta: string;
  footerRights: string;
  englishLink?: string;
  portugueseLink?: string;
};

/* ─── SVG Icons ────────────────────────────────────────────────────────────── */

function IconWarehouse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2-3 2z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <path d="M12 2a5 5 0 0 1 5 5c0 2-1 3.5-2.5 4.5V21H9.5V11.5C8 10.5 7 9 7 7a5 5 0 0 1 5-5z" />
    </svg>
  );
}

function IconKitchen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M6 12h4M14 12h4M12 6v4M12 14v4" />
    </svg>
  );
}

function IconOnline() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

function IconFiscal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <path d="M9 14l2 2 4-4" />
      <path d="M4 4h16v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4z" />
      <path d="M8 4V2M16 4V2" />
    </svg>
  );
}

function IconCassa() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M12 11v4M10 13h4" />
    </svg>
  );
}

function IconTeam() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="3" />
      <path d="M19 20a4 4 0 0 0-8 0" />
    </svg>
  );
}

const FEATURE_ICONS = [
  <IconWarehouse key="wh" />,
  <IconOrders key="ord" />,
  <IconMenu key="menu" />,
  <IconKitchen key="kit" />,
  <IconOnline key="onl" />,
  <IconFiscal key="fisc" />,
  <IconCassa key="cass" />,
  <IconTeam key="team" />,
];

const PROBLEM_ICONS = [
  <IconWarehouse key="p1" />,
  <IconOrders key="p2" />,
  <IconReceipt key="p3" />,
];

/* ─── Main component ────────────────────────────────────────────────────────── */

export function RestaurantHomepage({
  content,
  langLinks,
  loginHref = "/login",
  legalLinks,
}: {
  content: HomepageContent;
  langLinks: { href: string; label: string }[];
  loginHref?: string;
  legalLinks: { privacyHref: string; termsHref: string; privacyLabel: string; termsLabel: string };
}) {
  const contactHref = `mailto:${SUPPORT_EMAIL}`;
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (typeof window === "undefined") return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) return;

      // Hero entrance animations (gsap.from ensures elements are visible if animations don't run)
      gsap.from(".hero-badge", { opacity: 0, y: -16, scale: 0.9, duration: 0.7, ease: "back.out(1.4)" });
      gsap.from(".hero-title", { opacity: 0, y: 32, duration: 0.9, ease: "power3.out", delay: 0.15 });
      gsap.from(".hero-text", { opacity: 0, y: 24, duration: 0.8, ease: "power2.out", delay: 0.3 });
      gsap.from(".hero-cta", { opacity: 0, y: 20, scale: 0.95, duration: 0.7, ease: "back.out(1.3)", delay: 0.5 });
      gsap.from(".hero-stat", { opacity: 0, y: 16, duration: 0.6, ease: "power2.out", delay: 0.7, stagger: 0.1 });

      // Scroll-triggered sections
      gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 30, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>(".reveal-card").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 24, scale: 0.98, duration: 0.55, ease: "power2.out",
          delay: (i % 4) * 0.05,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

      // Orb parallax
      gsap.to(".hero-orb-1", {
        y: -50, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.2 },
      });
      gsap.to(".hero-orb-2", {
        y: -80, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1.8 },
      });
    },
    { scope: pageRef }
  );

  return (
    <div ref={pageRef} className="dark-landing" style={{ minHeight: "100vh" }}>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        background: "rgba(10,10,15,0.85)",
      }}>
        <div className="mx-auto max-w-6xl px-6" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Image src="/logo.png" alt="INCASSA" width={38} height={38} className="rounded-full" priority />
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {langLinks.map((l) => (
              <Link key={l.href} href={l.href} style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.color = "var(--foreground)")}
                onMouseOut={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}>
                {l.label}
              </Link>
            ))}
            <Link href={loginHref} style={{
              color: "var(--foreground)", fontSize: 13, fontWeight: 600, textDecoration: "none",
              padding: "7px 18px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--surface-2)",
              transition: "background 0.2s, border-color 0.2s",
            }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
              {content.login}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: "relative", overflow: "hidden", padding: "100px 24px 120px", textAlign: "center" }}>
        <div className="hero-orb-1" aria-hidden style={{
          position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="hero-orb-2" aria-hidden style={{
          position: "absolute", top: 120, right: "8%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px", pointerEvents: "none",
        }} />

        <div className="mx-auto max-w-3xl" style={{ position: "relative" }}>
          <div className="hero-badge">
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 14px", borderRadius: 100,
              border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.03em", color: "#fbbf24", marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbf24", boxShadow: "0 0 8px #fbbf24", display: "inline-block" }} />
              {content.badge}
            </span>
          </div>

          <h1 className="hero-title" style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 800,
            lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 20px",
            background: "linear-gradient(135deg, #f0ede8 0%, #fbbf24 45%, #f0ede8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            {content.heroTitle}
          </h1>

          <p className="hero-text" style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "var(--text-secondary)",
            lineHeight: 1.75, maxWidth: 600, margin: "0 auto 40px",
          }}>
            {content.heroText}
          </p>

          <div className="hero-cta">
            <a href={contactHref} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12,
              background: "linear-gradient(135deg, #f59e0b, #ea580c)",
              color: "#fff", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
              boxShadow: "0 0 40px rgba(245,158,11,0.25), 0 4px 24px rgba(0,0,0,0.3)",
              transition: "transform 0.18s, box-shadow 0.18s",
            }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(245,158,11,0.4), 0 8px 32px rgba(0,0,0,0.3)"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(245,158,11,0.25), 0 4px 24px rgba(0,0,0,0.3)"; }}>
              {content.pricingCta}
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 56, flexWrap: "wrap" }}>
            {[{ label: "Senza installazione", icon: "🌐" }, { label: "Dati sempre tuoi", icon: "🔒" }, { label: "Supporto diretto", icon: "💬" }].map((s) => (
              <div key={s.label} className="hero-stat" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMS ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="reveal-section" style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            {content.problemsTitle}
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 15 }}>Problemi che conosci bene.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {content.problems.map((p, i) => (
            <div key={p.title} className="reveal-card" style={{
              padding: "28px", borderRadius: 16,
              border: "1px solid rgba(245,158,11,0.15)",
              background: "linear-gradient(135deg, var(--surface-1) 0%, var(--surface-2) 100%)",
              transition: "border-color 0.2s, transform 0.2s",
            }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.15)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fbbf24", marginBottom: 16,
              }}>{PROBLEM_ICONS[i]}</div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section style={{ background: "var(--surface-1)", padding: "80px 24px" }}>
        <div className="mx-auto max-w-6xl">
          <div className="reveal-section" style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
              {content.featuresTitle}
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16 }}>
            {content.features.map((f, i) => (
              <div key={f.title} className="reveal-card" style={{
                padding: "24px", borderRadius: 14,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                display: "flex", flexDirection: "column", gap: 12,
                transition: "border-color 0.2s, background 0.2s, transform 0.2s",
              }}
                onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.1))",
                  border: "1px solid rgba(245,158,11,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", flexShrink: 0,
                }}>{FEATURE_ICONS[i] ?? null}</div>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--foreground)", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="reveal-section" style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            {content.stepsTitle}
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}>
          {content.steps.map((s) => (
            <div key={s.step} className="reveal-card" style={{ textAlign: "center" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "1.15rem", color: "#fff",
                margin: "0 auto 20px",
                boxShadow: "0 0 28px rgba(245,158,11,0.3)",
              }}>{s.step}</div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING / CTA ─────────────────────────────────────────────── */}
      <section className="px-6 pb-6">
        <div className="reveal-section mx-auto max-w-3xl" style={{
          borderRadius: 24,
          border: "1px solid rgba(245,158,11,0.2)",
          background: "linear-gradient(135deg, var(--surface-1) 0%, rgba(245,158,11,0.04) 100%)",
          padding: "clamp(36px, 5vw, 64px)", textAlign: "center",
          position: "relative", overflow: "hidden",
        }}>
          <div aria-hidden style={{
            position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
            width: 400, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--foreground)", marginBottom: 12 }}>
            {content.pricingTitle}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
            {content.pricingText}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 auto 40px", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
            {content.pricingBullets.map((b) => (
              <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "var(--text-secondary)" }}>
                <span style={{
                  flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fbbf24", fontSize: 10, fontWeight: 700, marginTop: 1,
                }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
          <a href={contactHref} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 36px", borderRadius: 12,
            background: "linear-gradient(135deg, #f59e0b, #ea580c)",
            color: "#fff", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
            boxShadow: "0 0 40px rgba(245,158,11,0.25)",
            transition: "transform 0.18s, box-shadow 0.18s",
          }}
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(245,158,11,0.4)"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(245,158,11,0.25)"; }}>
            {content.pricingCta}
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884z" />
              <path d="m18 8.118-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118z" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="reveal-section" style={{ textAlign: "center", marginBottom: 44 }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            {content.faqTitle}
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {content.faqs.map((f) => (
            <details key={f.q} className="reveal-card" style={{
              borderRadius: 14,
              border: "1px solid var(--border)", background: "var(--surface-1)", overflow: "hidden",
              transition: "border-color 0.2s",
            }}
              onToggle={(e) => { (e.currentTarget as HTMLElement).style.borderColor = (e.currentTarget as HTMLDetailsElement).open ? "rgba(245,158,11,0.2)" : "var(--border)"; }}>
              <summary style={{
                padding: "18px 22px", cursor: "pointer", listStyle: "none",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontWeight: 600, fontSize: "0.95rem", color: "var(--foreground)", userSelect: "none",
              }}>
                {f.q}
                <span style={{
                  flexShrink: 0, marginLeft: 16, width: 24, height: 24, borderRadius: "50%",
                  border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", fontSize: 16, fontWeight: 300,
                }}>+</span>
              </summary>
              <p style={{ padding: "0 22px 18px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section style={{ padding: "20px 24px 100px", textAlign: "center" }}>
        <div className="reveal-section">
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>Pronto a semplificare il tuo locale?</p>
          <a href={contactHref} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "16px 40px", borderRadius: 14,
            background: "linear-gradient(135deg, #f59e0b, #ea580c)",
            color: "#fff", fontWeight: 700, fontSize: "1.1rem", textDecoration: "none",
            boxShadow: "0 0 60px rgba(245,158,11,0.3), 0 8px 32px rgba(0,0,0,0.3)",
            transition: "transform 0.18s, box-shadow 0.18s",
          }}
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.02)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 80px rgba(245,158,11,0.45), 0 12px 40px rgba(0,0,0,0.3)"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(245,158,11,0.3), 0 8px 32px rgba(0,0,0,0.3)"; }}>
            {content.finalCta}
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 24px", background: "var(--surface-1)" }}>
        <div className="mx-auto max-w-6xl" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Image src="/logo.png" alt="INCASSA" width={30} height={30} className="rounded-full" style={{ opacity: 0.5 }} />
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} INCASSA. {content.footerRights}
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href={legalLinks.privacyHref} style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={(e) => ((e.target as HTMLElement).style.color = "var(--foreground)")}
              onMouseOut={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}>
              {legalLinks.privacyLabel}
            </Link>
            <Link href={legalLinks.termsHref} style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={(e) => ((e.target as HTMLElement).style.color = "var(--foreground)")}
              onMouseOut={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}>
              {legalLinks.termsLabel}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
