import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Landmark, Hammer, Wallet, TrendingUp,
  Sun, Moon, Menu, X,
  Mail, Phone, Clock, Send,
  CheckCircle2, ArrowLeft, Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

// ─── Design System: Liquid Glass × Fintech ─────────────────────────────────────
// Brand colors extracted from logo.svg
const BG      = "#0D1F1A";   // logo dark background
const GREEN   = "#7FD4A0";   // logo primary mint green
const GREEN2  = "#A8E6C3";   // lighter green variant
const PURPLE  = "#0D9488";   // CTA teal — same green family as logo
const TEAL    = "#14B8A6";   // secondary teal
const MINT    = "#10B981";   // success green
const TEXT    = "#F8FAFC";
const MUTED   = "#94A3B8";
const NAVY    = BG;          // alias used in MockDashboard
// Legacy aliases
const GOLD    = GREEN;
const GOLD2   = GREEN2;

// ─── Easing util ──────────────────────────────────────────────────────────────
function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
function norm(v: number, lo: number, hi: number) { return clamp((v - lo) / (hi - lo)); }
function spring(t: number) {
  const t2 = clamp(t);
  return 1 - Math.pow(1 - t2, 4) * (1 + 1.4 * t2);
}

// ─── Anti-gravity particle canvas ─────────────────────────────────────────────
const PCOLS = [GOLD, GOLD2, "#FDE68A", PURPLE, "#C4B5FD", MINT, TEAL];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; color: string;
  opacity: number; baseOpacity: number;
  isDash: boolean; dashAngle: number; dashLen: number;
  driftSpeed: number; driftPhase: number; driftAmp: number;
}

function mkP(W: number, H: number): Particle {
  const a = Math.random() * Math.PI * 2;
  const r = 40 + Math.random() * Math.min(W, H) * 0.45;
  return {
    x:           W / 2 + Math.cos(a) * r,
    y:           H / 2 + Math.sin(a) * r,
    vx:          Math.cos(a + Math.PI / 2) * (0.06 + Math.random() * 0.18) * (Math.random() > 0.5 ? 1 : -1),
    vy:          -(0.05 + Math.random() * 0.2),
    size:        0.7 + Math.random() * 2.4,
    color:       PCOLS[Math.floor(Math.random() * PCOLS.length)],
    opacity:     0,
    baseOpacity: 0.15 + Math.random() * 0.45,
    isDash:      Math.random() > 0.42,
    dashAngle:   Math.random() * Math.PI * 2,
    dashLen:     4 + Math.random() * 12,
    driftSpeed:  0.3 + Math.random() * 0.7,
    driftPhase:  Math.random() * Math.PI * 2,
    driftAmp:    0.2 + Math.random() * 0.5,
  };
}

function AntiGravityCanvas({ parallaxOffset = 0 }: { parallaxOffset?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(parallaxOffset);
  offsetRef.current = parallaxOffset;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tick = 0;
    let particles: Particle[] = Array.from({ length: 80 }, () => mkP(canvas.width, canvas.height));
    let raf: number;

    const draw = () => {
      tick++;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Vignette — dark canvas version
      const cx = W / 2, cy = H / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.6);
      grad.addColorStop(0,    "rgba(15,23,42,0)");
      grad.addColorStop(0.58, "rgba(15,23,42,0)");
      grad.addColorStop(1,    "rgba(15,23,42,0.97)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      particles.forEach((p, i) => {
        const drift = reducedMotion ? 0 : Math.sin(tick * 0.008 * p.driftSpeed + p.driftPhase) * p.driftAmp;
        p.x += p.vx + drift;
        p.y += p.vy + offsetRef.current * 0.0006;
        p.opacity = Math.min(p.baseOpacity, p.opacity + 0.003);

        if (p.y < -20 || p.x < -20 || p.x > W + 20) {
          particles[i] = mkP(W, H);
          particles[i].y = H + 10;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = ctx.strokeStyle = p.color;

        if (p.isDash) {
          ctx.lineWidth = p.size * 0.6;
          ctx.lineCap   = "round";
          ctx.translate(p.x, p.y);
          ctx.rotate(p.dashAngle);
          ctx.beginPath();
          ctx.moveTo(-p.dashLen / 2, 0);
          ctx.lineTo(p.dashLen / 2, 0);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }} />
  );
}

// ─── JS-Sticky hook ────────────────────────────────────────────────────────────
// Bypasses CSS sticky (broken by overflow-x:hidden on parent) using JS-computed
// position: fixed while inside scroll range, absolute before/after.
type StickyPhase = "before" | "active" | "after";

function useStickyScroll(wrapRef: React.RefObject<HTMLDivElement>) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState<StickyPhase>("before");
  const [wrapTop, setWrapTop]   = useState(0);

  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) setWrapTop(wrapRef.current.offsetTop);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [wrapRef]);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const scrollY     = window.scrollY;
      const wHeight     = el.offsetHeight;
      const vHeight     = window.innerHeight;
      const scrollRange = wHeight - vHeight;
      const entered     = scrollY - wrapTop;

      if (entered < 0) {
        setPhase("before"); setProgress(0);
      } else if (entered >= scrollRange) {
        setPhase("after"); setProgress(1);
      } else {
        setPhase("active");
        setProgress(entered / scrollRange);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [wrapRef, wrapTop]);

  const stickyStyle: React.CSSProperties =
    phase === "active"
      ? { position: "fixed",    top: 0, left: 0, right: 0, height: "100vh" }
      : phase === "after"
      ? { position: "absolute", bottom: 0, left: 0, right: 0, height: "100vh" }
      : { position: "absolute", top: 0,    left: 0, right: 0, height: "100vh" };

  return { progress, phase, stickyStyle };
}

// ─── Mock Dashboard (dark liquid glass) ───────────────────────────────────────
function MockDashboard({ reveal }: { reveal: number }) {
  const cs = (start: number, range = 0.22) => {
    const t = spring(norm(reveal, start, start + range));
    return {
      opacity:    t,
      transform:  `scale(${0.86 + 0.14 * t}) translateY(${(1 - t) * 16}px)`,
      filter:     `blur(${(1 - t) * 8}px)`,
      transition: "none",
    } satisfies React.CSSProperties;
  };

  const stats = [
    { label: "العقارات",  value: "12",  color: GOLD,   icon: <Landmark className="w-3.5 h-3.5" /> },
    { label: "العقود",    value: "47",  color: MINT,   icon: <Users    className="w-3.5 h-3.5" /> },
    { label: "الصيانة",  value: "8",   color: PURPLE, icon: <Hammer   className="w-3.5 h-3.5" /> },
    { label: "الإيرادات", value: "42K", color: TEAL,   icon: <Wallet   className="w-3.5 h-3.5" /> },
  ];

  const maint = [
    { title: "تسرب مياه",      status: "عاجل",         dot: "#EF4444" },
    { title: "كهرباء المطبخ",  status: "قيد التنفيذ",  dot: GOLD      },
    { title: "صيانة مكيف",    status: "مكتمل",         dot: MINT      },
  ];

  const props = [
    { name: "برج الرياض",  pct: 92, color: GOLD   },
    { name: "فيلا جدة",    pct: 75, color: PURPLE },
    { name: "شقق الدمام",  pct: 58, color: TEAL   },
  ];

  const CARD        = "rgba(255,255,255,0.05)";
  const CARD_BORDER = "rgba(255,255,255,0.08)";

  return (
    <div className="w-full rounded-3xl overflow-hidden"
      style={{
        background:     "rgba(15,23,42,0.92)",
        border:         `0.5px solid rgba(245,158,11,0.25)`,
        boxShadow:      `0 32px 80px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(245,158,11,0.12), 0 0 60px rgba(139,92,246,0.08)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        maxWidth:       800,
        margin:         "0 auto",
      }}>

      {/* Titlebar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: `0.5px solid rgba(255,255,255,0.06)` }}>
        {["#EF4444", GOLD, "#22C55E"].map(c => (
          <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
        ))}
        <div className="flex-1 mx-3">
          <div className="h-4 rounded-full w-44 mx-auto flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
            app.jar.sa/dashboard
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: 400 }}>
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col gap-1.5 p-2.5 w-14 shrink-0"
          style={{ background: "rgba(255,255,255,0.02)", borderRight: `0.5px solid rgba(255,255,255,0.05)` }}>
          {[Landmark, Hammer, Wallet, TrendingUp].map((Icon, i) => (
            <div key={i} className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto"
              style={{
                background: i === 0 ? `${GOLD}22` : "rgba(255,255,255,0.04)",
                color:      i === 0 ? GOLD : "rgba(255,255,255,0.3)",
              }}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl p-2.5"
                style={{ background: CARD, border: `0.5px solid ${CARD_BORDER}`, boxShadow: "0 2px 12px rgba(0,0,0,0.25)", ...cs(i * 0.07) }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 9, color: MUTED }}>{s.label}</span>
                  <span className="w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: `${s.color}22`, color: s.color }}>
                    {s.icon}
                  </span>
                </div>
                <p className="font-black text-lg" style={{ color: TEXT }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {/* Area chart */}
            <div className="rounded-2xl p-3 flex flex-col"
              style={{ background: CARD, border: `0.5px solid ${CARD_BORDER}`, ...cs(0.28) }}>
              <p className="font-semibold mb-2" style={{ color: TEXT, fontSize: 10 }}>الإيرادات الشهرية</p>
              <svg viewBox="0 0 200 64" className="w-full flex-1" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lmg-dark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={GOLD} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={GOLD} stopOpacity="0"   />
                  </linearGradient>
                </defs>
                <path d="M0,60 C18,52 32,34 52,30 C72,26 88,38 108,34 C128,30 144,18 164,12 C176,8 188,6 200,4 L200,64 L0,64 Z"
                  fill="url(#lmg-dark)" />
                <path d="M0,60 C18,52 32,34 52,30 C72,26 88,38 108,34 C128,30 144,18 164,12 C176,8 188,6 200,4"
                  fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
                {[[52,30],[108,34],[164,12],[200,4]].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="3" fill={GOLD} opacity="0.9" />
                ))}
              </svg>
            </div>

            {/* Maintenance list */}
            <div className="rounded-2xl p-3"
              style={{ background: CARD, border: `0.5px solid ${CARD_BORDER}`, ...cs(0.38) }}>
              <p className="font-semibold mb-2.5" style={{ color: TEXT, fontSize: 10 }}>طلبات الصيانة</p>
              <div className="space-y-2">
                {maint.map((m, i) => (
                  <div key={i} className="flex items-center justify-between" style={cs(0.44 + i * 0.1)}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: m.dot, boxShadow: `0 0 4px ${m.dot}` }} />
                      <span style={{ fontSize: 10, color: TEXT }}>{m.title}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ fontSize: 9, background: `${m.dot}22`, color: m.dot }}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Property cards */}
          <div className="grid grid-cols-3 gap-2">
            {props.map((prop, i) => (
              <div key={i} className="rounded-2xl p-2.5"
                style={{ background: CARD, border: `0.5px solid ${CARD_BORDER}`, ...cs(0.72 + i * 0.08) }}>
                <p className="font-semibold truncate mb-0.5" style={{ color: TEXT, fontSize: 10 }}>{prop.name}</p>
                <p className="mb-1.5" style={{ fontSize: 9, color: MUTED }}>{prop.pct}% مأهول</p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-none"
                    style={{ width: `${prop.pct * clamp(norm(reveal, 0.72 + i * 0.08, 1))}%`, background: prop.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Reveal ────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Landing page ──────────────────────────────────────────────────────────────
export default function Landing() {
  const { t, i18n }  = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isAr = i18n.language === "ar";

  const [navScrolled,    setNavScrolled]    = useState(false);
  const [navOpen,        setNavOpen]        = useState(false);
  const [contactSent,    setContactSent]    = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactForm,    setContactForm]    = useState({ name: "", email: "", phone: "", message: "" });

  const wrapRef = useRef<HTMLDivElement>(null);
  const { progress, stickyStyle } = useStickyScroll(wrapRef);

  // Derived animation values
  const heroT     = spring(norm(progress, 0, 0.28));
  const heroOp    = 1 - heroT;
  const heroY     = heroT * -55;
  const dashT     = spring(norm(progress, 0.18, 0.62));
  const dashOp    = dashT;
  const dashScale = 0.68 + 0.32 * dashT;
  const dashBlur  = (1 - dashT) * 18;
  const revealP   = norm(progress, 0.5, 1.0);
  const paralOff  = progress * 80;

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const featS = useInView();
  const contS = useInView();

  const navLinks = [
    { label: t("landing.navFeatures"), href: "#features" },
    { label: t("landing.navContact"),  href: "#contact"  },
  ];

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault(); setContactSending(true);
    await new Promise(r => setTimeout(r, 900));
    setContactSending(false); setContactSent(true);
  };

  // Liquid glass card helper
  const glassCard: React.CSSProperties = {
    background:           "rgba(255,255,255,0.04)",
    border:               "0.5px solid rgba(255,255,255,0.09)",
    backdropFilter:       "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT, fontFamily: "'DM Sans','IBM Plex Sans Arabic','Cairo',sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        body { overflow-x: hidden; background: ${BG}; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── NAVBAR ────────────────────────────────────────────────────────────── */}
      <nav aria-label="Main navigation"
        className="fixed inset-x-4 z-50 rounded-2xl transition-all duration-500"
        style={{
          top:                  navScrolled ? 8 : 12,
          background:           navScrolled ? "rgba(15,23,42,0.94)" : "rgba(15,23,42,0.72)",
          backdropFilter:       "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border:               `0.5px solid ${navScrolled ? `rgba(245,158,11,0.32)` : "rgba(255,255,255,0.07)"}`,
          boxShadow:            navScrolled
            ? "0 8px 40px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(245,158,11,0.08)"
            : "0 4px 20px rgba(0,0,0,0.25)",
        }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2.5 shrink-0 cursor-pointer">
              <img src="/logo.svg" alt="Jar" className="w-8 h-8 rounded-xl object-contain" />
              <span className="text-base font-black hidden sm:block" style={{ color: TEXT }}>
                {isAr ? "منصة جار" : "Jar Platform"}
              </span>
            </a>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex gap-7 text-sm font-semibold flex-1 justify-center">
            {navLinks.map(l => (
              <a key={l.href} href={l.href}
                className="transition-colors duration-200 cursor-pointer hover:text-white"
                style={{ color: MUTED }}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer hover:opacity-80"
              style={{ color: GOLD, background: `${GOLD}18`, border: `0.5px solid ${GOLD}35` }}
              aria-label={isAr ? "Switch to English" : "التحويل للعربية"}>
              {isAr ? "EN" : "عر"}
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:opacity-80"
              style={{ color: MUTED, background: "rgba(255,255,255,0.05)" }}
              aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="hidden md:flex gap-2">
              <Link href="/login">
                <a className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-80 cursor-pointer"
                  style={{ border: `0.5px solid rgba(255,255,255,0.18)`, color: TEXT }}>
                  {t("auth.login")}
                </a>
              </Link>
              <Link href="/register">
                <a className="px-4 py-1.5 rounded-full text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, #0F766E)`, boxShadow: `0 4px 16px ${PURPLE}44` }}>
                  {t("landing.getStarted")}
                </a>
              </Link>
            </div>
            <button
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ color: TEXT }}
              onClick={() => setNavOpen(p => !p)}
              aria-label={navOpen ? "Close menu" : "Open menu"}>
              {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="md:hidden px-5 py-4 flex flex-col gap-3 text-sm font-semibold rounded-b-2xl border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.98)" }}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setNavOpen(false)}
                className="transition-colors duration-200" style={{ color: MUTED }}>
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Link href="/login">
                <a className="flex-1 text-center px-4 py-2 rounded-full text-sm font-semibold cursor-pointer"
                  style={{ border: `0.5px solid rgba(255,255,255,0.18)`, color: TEXT }}>
                  {t("auth.login")}
                </a>
              </Link>
              <Link href="/register">
                <a className="flex-1 text-center px-4 py-2 rounded-full text-sm font-bold text-white cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, #0F766E)` }}>
                  {t("landing.getStarted")}
                </a>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── STICKY SCROLL STORYTELLING ────────────────────────────────────────── */}
      <div ref={wrapRef} className="relative" style={{ height: "300vh" }}>
        <div style={{ ...stickyStyle, overflow: "hidden" }}>

          {/* Layer 0 – dark base */}
          <div className="absolute inset-0" style={{ background: BG }} />

          {/* Ambient glow blobs */}
          <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{
              position: "absolute", top: "18%", left: "12%",
              width: 640, height: 640, borderRadius: "50%",
              background: `radial-gradient(circle, ${GOLD}10 0%, transparent 60%)`,
              filter: "blur(48px)",
            }} />
            <div style={{
              position: "absolute", top: "28%", right: "8%",
              width: 520, height: 520, borderRadius: "50%",
              background: `radial-gradient(circle, ${PURPLE}0C 0%, transparent 60%)`,
              filter: "blur(48px)",
            }} />
          </div>

          {/* Layer 1 – Particles */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ transform: `translateY(${-paralOff}px)`, willChange: "transform" }}>
            <AntiGravityCanvas parallaxOffset={paralOff} />
          </div>

          {/* Layer 2 – Concentric rings */}
          <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: heroOp * 0.65, transform: `translateY(${heroY * 0.4}px)` }}>
            {[440, 310, 200].map((r, i) => (
              <div key={r} className="absolute rounded-full"
                style={{ width: r * 2, height: r * 2, border: `0.5px solid ${GOLD}`, opacity: 0.06 - i * 0.015 }} />
            ))}
          </div>

          {/* Layer 3 – Hero text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{
              opacity:       heroOp,
              transform:     `translateY(${heroY}px)`,
              pointerEvents: progress > 0.15 ? "none" : "auto",
              zIndex:        10,
            }}>
            <div className="text-center max-w-4xl mx-auto select-none">

              {/* Over-title pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
                style={{ background: `${GREEN}14`, border: `0.5px solid ${GREEN}40`, color: GREEN }}>
                <img src="/logo.svg" alt="" className="w-5 h-5 rounded-md object-contain" />
                {t("landing.overTitle")}
              </div>

              {/* Headline */}
              <h1 className="font-black tracking-tight mb-6"
                style={{
                  fontSize:      "clamp(1.85rem, 5vw, 3.75rem)",
                  color:         TEXT,
                  lineHeight:    1.5,
                  letterSpacing: isAr ? "0.01em" : "-0.02em",
                }}>
                {t("landing.heroTitle1")}
                <br />
                <span style={{
                  background:           `linear-gradient(135deg, ${GREEN}, ${GREEN2} 45%, ${PURPLE})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor:  "transparent",
                  backgroundClip:       "text",
                }}>
                  {t("landing.heroTitle2")}
                </span>
              </h1>

              {/* Sub */}
              <p className="text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto leading-relaxed"
                style={{ color: MUTED }}>
                {t("landing.heroSub")}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <a className="inline-flex items-center gap-2 px-9 py-3.5 rounded-full text-base font-bold text-white
                    transition-all duration-300 hover:scale-[1.04] active:scale-[0.97] cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${PURPLE}, #0F766E)`,
                      boxShadow:  `0 8px 32px ${PURPLE}50`,
                    }}>
                    {t("landing.getStarted")}
                    <ArrowLeft className={cn("w-4 h-4", !isAr && "rotate-180")} />
                  </a>
                </Link>
                <a href="#contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold
                    transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
                  style={{
                    border:               `1.5px solid rgba(255,255,255,0.14)`,
                    color:                TEXT,
                    background:           "rgba(255,255,255,0.05)",
                    backdropFilter:       "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}>
                  {t("landing.bookDemo")}
                </a>
              </div>

              {/* Scroll hint */}
              <div className="mt-14 flex flex-col items-center gap-2" style={{ opacity: 0.4 }}>
                <p className="text-xs font-medium" style={{ color: MUTED }}>
                  {isAr ? "مرر للأسفل لاستكشاف المنصة" : "Scroll to explore"}
                </p>
                <div className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                  <div className="w-1 h-2 rounded-full animate-bounce" style={{ background: GOLD }} />
                </div>
              </div>
            </div>
          </div>

          {/* Layer 4 – Radial glow behind dashboard */}
          <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: dashOp * 0.85, zIndex: 15 }}>
            <div style={{
              width:        "min(90vw, 900px)",
              height:       "60vh",
              borderRadius: "50%",
              background:   `radial-gradient(ellipse at center, ${GOLD}18 0%, ${PURPLE}0A 50%, transparent 70%)`,
              filter:       "blur(28px)",
            }} />
          </div>

          {/* Layer 5 – Dashboard zoom-reveal */}
          <div className="absolute inset-0 flex items-center justify-center px-4 md:px-12 pointer-events-none"
            style={{
              opacity:    dashOp,
              transform:  `scale(${dashScale})`,
              filter:     `blur(${dashBlur}px)`,
              zIndex:     20,
              willChange: "transform, opacity, filter",
            }}>
            <MockDashboard reveal={revealP} />
          </div>

          {/* Layer 6 – Keep scrolling label */}
          {progress > 0.65 && progress < 0.95 && (
            <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none" style={{ zIndex: 30 }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                style={{
                  background:           "rgba(15,23,42,0.88)",
                  backdropFilter:       "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border:               `0.5px solid ${GOLD}30`,
                  color:                TEXT,
                  opacity:              Math.min(1, (progress - 0.65) / 0.1) * Math.max(0, 1 - (progress - 0.88) / 0.07),
                }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
                {isAr ? "استمر في التمرير" : "Keep scrolling"}
              </div>
            </div>
          )}

          {/* Bottom fade to dark */}
          <div aria-hidden className="absolute bottom-0 inset-x-0 h-28 pointer-events-none"
            style={{ background: `linear-gradient(to top, ${BG}, transparent)`, zIndex: 35 }} />
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 max-w-6xl mx-auto" ref={featS.ref}>
        <div className={cn("text-center mb-16 transition-all duration-700",
          featS.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
          <h2 className="text-4xl font-black mb-4" style={{ color: TEXT }}>
            {t("landing.featuresTitle")}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: MUTED }}>
            {t("landing.featuresSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.key}
                className={cn("rounded-3xl p-6 transition-all duration-500 group cursor-default",
                  featS.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}
                style={{
                  transitionDelay: `${i * 80}ms`,
                  ...glassCard,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
                }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: f.bg }}>
                  <Icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold mb-2 text-base" style={{ color: TEXT }}>
                  {t(`landing.features.${f.key}`)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                  {t(`landing.features.${f.key}Sub`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-5 max-w-5xl mx-auto" ref={contS.ref}>
        <div className={cn("text-center mb-14 transition-all duration-700",
          contS.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>
          <h2 className="text-4xl font-black mb-4" style={{ color: TEXT }}>
            {t("landing.contactTitle")}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: MUTED }}>
            {t("landing.contactSubtitle")}
          </p>
        </div>

        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-10 items-start transition-all duration-700 delay-100",
          contS.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10")}>

          {/* Contact info */}
          <div className="space-y-4">
            {[
              { Icon: Mail,  color: GOLD,   label: t("landing.contactEmail"),      value: t("landing.contactInfoEmail")  },
              { Icon: Phone, color: TEAL,   label: t("landing.contactPhoneLabel"), value: "+966 11 XXX XXXX"              },
              { Icon: Clock, color: PURPLE, label: t("landing.contactHoursLabel"), value: t("landing.contactInfoHours")  },
            ].map(({ Icon, color, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: `${color}10`, border: `0.5px solid ${color}22` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}20`, border: `0.5px solid ${color}35` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: MUTED }}>{label}</p>
                  <p className="font-bold text-sm" style={{ color: TEXT }}>{value}</p>
                </div>
              </div>
            ))}

            <div className="p-5 rounded-2xl" style={{ border: `0.5px solid ${GOLD}28`, background: `${GOLD}08` }}>
              <p className="font-bold mb-3 text-sm" style={{ color: TEXT }}>
                {t("landing.contactDemoIncludes")}
              </p>
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="flex items-center gap-2 text-sm mb-2" style={{ color: MUTED }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: MINT }} />
                  {t(`landing.contactDemo${n}`)}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl p-7"
            style={{ ...glassCard, boxShadow: `0 20px 60px rgba(0,0,0,0.35), 0 0 0 0.5px ${GOLD}14` }}>
            {contactSent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${MINT}20`, border: `0.5px solid ${MINT}35` }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: MINT }} />
                </div>
                <p className="font-bold text-lg mb-2" style={{ color: TEXT }}>{t("landing.contactSentTitle")}</p>
                <p className="text-sm" style={{ color: MUTED }}>{t("landing.contactSent")}</p>
                <button
                  className="mt-5 px-6 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80 cursor-pointer"
                  style={{ border: `0.5px solid rgba(255,255,255,0.18)`, color: TEXT }}
                  onClick={() => { setContactSent(false); setContactForm({ name: "", email: "", phone: "", message: "" }); }}>
                  {t("landing.contactSendAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                {[
                  { key: "name",  label: t("landing.contactName"),  type: "text",  req: true  },
                  { key: "email", label: t("landing.contactEmail"), type: "email", req: true  },
                  { key: "phone", label: t("landing.contactPhone"), type: "tel",   req: false },
                ].map(f => (
                  <div key={f.key}>
                    <label htmlFor={`contact-${f.key}`} className="text-xs font-semibold mb-1.5 block" style={{ color: MUTED }}>
                      {f.label}{f.req ? " *" : ""}
                    </label>
                    <Input
                      id={`contact-${f.key}`}
                      type={f.type}
                      value={(contactForm as any)[f.key]}
                      onChange={e => setContactForm(p => ({ ...p, [f.key]: e.target.value }))}
                      required={f.req}
                      className="h-11 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: TEXT }} />
                  </div>
                ))}
                <div>
                  <label htmlFor="contact-message" className="text-xs font-semibold mb-1.5 block" style={{ color: MUTED }}>
                    {t("landing.contactMessage")}
                  </label>
                  <textarea
                    id="contact-message"
                    value={contactForm.message}
                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 transition-all"
                    style={{
                      background:          "rgba(255,255,255,0.05)",
                      borderColor:         "rgba(255,255,255,0.1)",
                      color:               TEXT,
                      "--tw-ring-color":   PURPLE,
                    } as any} />
                </div>
                <button
                  type="submit"
                  disabled={contactSending}
                  className="w-full h-11 text-white rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] cursor-pointer disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, #0F766E)`, boxShadow: `0 4px 20px ${PURPLE}40` }}>
                  {contactSending
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("landing.contactSending")}</>
                    : <><Send className="w-4 h-4" />{t("landing.contactSend")}</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t py-10 px-5 text-center text-sm"
        style={{ borderColor: "rgba(255,255,255,0.06)", color: MUTED }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/logo.svg" alt="Jar" className="w-7 h-7 rounded-lg object-contain" />
          <span className="font-bold text-base" style={{ color: TEXT }}>
            {isAr ? "منصة جار" : "Jar Platform"}
          </span>
        </div>
        <p>{t("landing.footer")}</p>
      </footer>
    </div>
  );
}

// ─── Static data (outside component) ──────────────────────────────────────────
const FEATURES = [
  { key: "property",    icon: Landmark,   color: GOLD,   bg: `${GOLD}22`   },
  { key: "maintenance", icon: Hammer,     color: TEAL,   bg: `${TEAL}1E`   },
  { key: "payments",    icon: Wallet,     color: PURPLE, bg: `${PURPLE}1E` },
  { key: "analytics",   icon: TrendingUp, color: MINT,   bg: `${MINT}1E`   },
];
