import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// SUPABASE CLIENT (replace with your credentials)
// ─────────────────────────────────────────────
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

async function supabaseFetch(path, options = {}) {
  const token = localStorage.getItem("sb_token");
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Supabase error");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function authFetch(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Auth error");
  return data;
}

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg: "#F8FAFC",
  dark: "#0F172A",
  emerald: "#10B981",
  emeraldDark: "#059669",
  card: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
  warn: "#F59E0B",
  error: "#EF4444",
};

const styles = {
  app: {
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    background: C.bg,
    minHeight: "100vh",
    color: C.text,
  },
  btn: (variant = "primary", size = "md") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "14px 28px" : "10px 20px",
    borderRadius: "10px",
    border: "none",
    fontWeight: 600,
    fontSize: size === "sm" ? "13px" : size === "lg" ? "16px" : "14px",
    cursor: "pointer",
    transition: "all 0.18s ease",
    textDecoration: "none",
    background:
      variant === "primary"
        ? C.emerald
        : variant === "dark"
        ? C.dark
        : variant === "outline"
        ? "transparent"
        : variant === "ghost"
        ? "transparent"
        : variant === "danger"
        ? "#FEF2F2"
        : "#F1F5F9",
    color:
      variant === "primary"
        ? "#fff"
        : variant === "dark"
        ? "#fff"
        : variant === "outline"
        ? C.dark
        : variant === "ghost"
        ? C.muted
        : variant === "danger"
        ? C.error
        : C.text,
    border:
      variant === "outline"
        ? `1.5px solid ${C.border}`
        : variant === "danger"
        ? `1.5px solid #FECACA`
        : "none",
  }),
  card: {
    background: C.card,
    borderRadius: "14px",
    border: `1px solid ${C.border}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: "10px",
    fontSize: "14px",
    color: C.text,
    background: "#fff",
    outline: "none",
    transition: "border 0.15s",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: C.muted,
    marginBottom: "6px",
    letterSpacing: "0.02em",
  },
  badge: (color = "emerald") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
    background:
      color === "emerald"
        ? "#D1FAE5"
        : color === "warn"
        ? "#FEF3C7"
        : color === "error"
        ? "#FEE2E2"
        : "#F1F5F9",
    color:
      color === "emerald"
        ? "#065F46"
        : color === "warn"
        ? "#92400E"
        : color === "error"
        ? "#991B1B"
        : C.muted,
  }),
};

// ─────────────────────────────────────────────
// UTILITY: FORMAT CURRENCY
// ─────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

// ─────────────────────────────────────────────
// ICONS (inline SVGs)
// ─────────────────────────────────────────────
const Icon = {
  logo: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill="#10B981" />
      <path d="M7 9h14M7 14h9M7 19h11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="21" cy="19" r="3" fill="#fff" opacity="0.9" />
    </svg>
  ),
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  trash: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 4h11M5 4V2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5V4M6 7v4M9 7v4M3.5 4l.5 8.5a.5.5 0 00.5.5h6a.5.5 0 00.5-.5L11.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  download: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v7M5 7l3 3 3-3M3 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eye: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  copy: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 10V3a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  edit: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M10.5 2.5l2 2-7 7H3.5v-2l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrow: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  star: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 1l1.5 4H13l-3.5 2.5 1.5 4L7 9l-4 2.5 1.5-4L1 5h4.5L7 1z" />
    </svg>
  ),
  x: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  upload: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 13V6M7 9l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 14a4 4 0 01.5-7.9A5 5 0 0115 8.5a3.5 3.5 0 01-.5 7H3z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  user: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  logout: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 11l3-3-3-3M13 8H6M7 3H3a1 1 0 00-1 1v8a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─────────────────────────────────────────────
// PDF GENERATOR (uses @react-pdf/renderer if available, else jsPDF fallback)
// ─────────────────────────────────────────────
function generatePDF(proposal, isPro, logoUrl) {
  // Dynamic import of jsPDF (CDN fallback)
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  document.head.appendChild(script);
  script.onload = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const margin = 18;
    let y = 20;

    // Colors
    const emerald = [16, 185, 129];
    const dark = [15, 23, 42];
    const muted = [100, 116, 139];
    const lightGray = [241, 245, 249];

    // Header bar
    doc.setFillColor(...dark);
    doc.rect(0, 0, W, 38, "F");

    // Logo square
    doc.setFillColor(...emerald);
    doc.roundedRect(margin, 9, 20, 20, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("C", margin + 7.5, 22);

    // Company name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Cotizify", margin + 24, 21);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...emerald);
    doc.text("Propuesta Profesional", margin + 24, 27);

    // Proposal number (right side)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`#${String(proposal.proposal_number || proposal.id).padStart(4, "0")}`, W - margin, 21, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...emerald);
    doc.text(fmtDate(proposal.created_at || new Date()), W - margin, 28, { align: "right" });

    y = 52;

    // Client section
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y - 6, W - margin * 2, 22, 4, 4, "F");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.text("CLIENTE", margin + 6, y + 1);
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(proposal.client_name, margin + 6, y + 10);
    y += 30;

    // Services table header
    doc.setFillColor(...dark);
    doc.roundedRect(margin, y - 5, W - margin * 2, 10, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPCIÓN", margin + 4, y + 1.5);
    doc.text("CANT.", 130, y + 1.5, { align: "right" });
    doc.text("P. UNIT.", 155, y + 1.5, { align: "right" });
    doc.text("TOTAL", W - margin - 2, y + 1.5, { align: "right" });
    y += 10;

    // Services rows
    const services = proposal.services || [];
    services.forEach((svc, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, W - margin * 2, 9, "F");
      }
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "normal");
      doc.text(svc.description || "-", margin + 4, y + 1.5, { maxWidth: 85 });
      doc.text(String(svc.quantity || 0), 130, y + 1.5, { align: "right" });
      doc.text(fmt(svc.unit_price), 155, y + 1.5, { align: "right" });
      doc.text(fmt((svc.quantity || 0) * (svc.unit_price || 0)), W - margin - 2, y + 1.5, { align: "right" });
      y += 9;
    });

    // Divider
    y += 4;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(margin, y, W - margin, y);
    y += 8;

    // Totals block (right aligned)
    const totX = 120;
    const totW = W - margin - totX;

    const addTotal = (label, value, bold = false, accent = false) => {
      if (bold) {
        doc.setFillColor(...(accent ? emerald : dark));
        doc.roundedRect(totX, y - 4, totW, 9, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
      } else {
        doc.setTextColor(...muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }
      doc.text(label, totX + 4, y + 1.5);
      doc.text(value, W - margin - 2, y + 1.5, { align: "right" });
      y += 10;
    };

    addTotal("Subtotal", fmt(proposal.subtotal));
    if (proposal.tax_rate > 0) addTotal(`Impuesto (${proposal.tax_rate}%)`, fmt(proposal.tax_amount));
    if (proposal.discount_rate > 0) addTotal(`Descuento (${proposal.discount_rate}%)`, `-${fmt(proposal.discount_amount)}`);
    addTotal("TOTAL", fmt(proposal.total), true, true);

    // Notes
    if (proposal.notes) {
      y += 6;
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(margin, y - 4, W - margin * 2, 20, 4, 4, "F");
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.setFont("helvetica", "bold");
      doc.text("NOTAS", margin + 6, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...dark);
      const lines = doc.splitTextToSize(proposal.notes, W - margin * 2 - 12);
      doc.text(lines, margin + 6, y + 8);
      y += 24;
    }

    // Watermark for free plan
    if (!isPro) {
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.setFontSize(42);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.text("Cotizify - Versión Gratuita", W / 2, 148, { align: "center", angle: 30 });
      doc.setGState(new doc.GState({ opacity: 1 }));

      // Watermark banner
      doc.setFillColor(254, 243, 199);
      doc.rect(0, 280, W, 17, "F");
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Creado con Cotizify (Versión Gratuita) • Actualiza a Pro para eliminar esta marca de agua",
        W / 2,
        290,
        { align: "center" }
      );
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.setFont("helvetica", "normal");
    doc.text("Generado con Cotizify • cotizify.app", margin, 295);
    doc.text(fmtDate(new Date()), W - margin, 295, { align: "right" });

    doc.save(`Propuesta-${proposal.client_name}-${proposal.proposal_number || proposal.id}.pdf`);
  };
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, []);
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        background: type === "error" ? C.error : type === "warn" ? C.warn : C.dark,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        animation: "slideUp 0.25s ease",
        maxWidth: "340px",
      }}
    >
      <span style={{ fontSize: "16px" }}>
        {type === "error" ? "✗" : type === "warn" ? "⚠" : "✓"}
      </span>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...styles.card,
          width: "100%",
          maxWidth: "480px",
          padding: "32px",
          animation: "popIn 0.2s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: C.dark }}>{title}</h2>
          <button onClick={onClose} style={{ ...styles.btn("ghost"), padding: "4px" }}>
            <Icon.x />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
function Navbar({ user, profile, onNavigate, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav
      style={{
        background: C.dark,
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <button
        onClick={() => onNavigate("dashboard")}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
      >
        <Icon.logo />
        <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          Cotizify
        </span>
      </button>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={styles.badge(profile?.plan === "pro" ? "emerald" : "default")}>
            {profile?.plan === "pro" ? (
              <><Icon.star /> PRO</>
            ) : (
              "FREE"
            )}
          </span>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                ...styles.btn("ghost"),
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <Icon.user />
              <span style={{ fontSize: "13px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </span>
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  ...styles.card,
                  width: "200px",
                  padding: "8px",
                  zIndex: 200,
                }}
              >
                <button
                  onClick={() => { onNavigate("profile"); setMenuOpen(false); }}
                  style={{ ...styles.btn("ghost"), width: "100%", justifyContent: "flex-start", padding: "8px 12px", borderRadius: "8px" }}
                >
                  <Icon.user /> Mi Perfil
                </button>
                <hr style={{ margin: "4px 0", border: "none", borderTop: `1px solid ${C.border}` }} />
                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  style={{ ...styles.btn("ghost"), width: "100%", justifyContent: "flex-start", padding: "8px 12px", borderRadius: "8px", color: C.error }}
                >
                  <Icon.logout /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────
function AuthPage({ onAuth, toast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return toast("Completa todos los campos", "error");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "token?grant_type=password" : "signup";
      const data = await authFetch(endpoint, { email, password });
      const token = data.access_token;
      const userId = data.user?.id;
      localStorage.setItem("sb_token", token);
      localStorage.setItem("sb_user", JSON.stringify(data.user));

      if (mode === "register") {
        // Create profile
        try {
          await supabaseFetch("/profiles", {
            method: "POST",
            body: JSON.stringify({ id: userId, email, plan: "free" }),
          });
        } catch (_) {}
      }
      onAuth(data.user, token);
    } catch (e) {
      toast(e.message, "error");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.dark,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "8px" }}>
          <Icon.logo />
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>Cotizify</span>
        </div>
        <p style={{ color: "#94A3B8", fontSize: "15px", margin: 0 }}>
          Propuestas profesionales en minutos
        </p>
      </div>

      <div
        style={{
          ...styles.card,
          width: "100%",
          maxWidth: "420px",
          padding: "36px",
          position: "relative",
        }}
      >
        {/* Tab switch */}
        <div
          style={{
            display: "flex",
            background: "#F1F5F9",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "28px",
          }}
        >
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.15s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? C.dark : C.muted,
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "login" ? "Iniciar Sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={styles.label}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={styles.label}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.btn("primary", "lg"),
            width: "100%",
            justifyContent: "center",
            opacity: loading ? 0.7 : 1,
            background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})`,
          }}
        >
          {loading ? "Procesando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          {!loading && <Icon.arrow />}
        </button>

        {/* Benefits list */}
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${C.border}` }}>
          {["Crea propuestas en minutos", "Genera PDF profesionales", "Gestiona tu historial"].map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ color: C.emerald, fontSize: "13px" }}><Icon.check /></span>
              <span style={{ fontSize: "13px", color: C.muted }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ user, profile, proposals, onNavigate, onDelete, onDuplicate, toast }) {
  const isPro = profile?.plan === "pro";

  const handleDownload = (p) => generatePDF(p, isPro, profile?.logo_url);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, color: C.dark }}>
            Mis Propuestas
          </h1>
          <p style={{ margin: 0, color: C.muted, fontSize: "14px" }}>
            {proposals.length} propuesta{proposals.length !== 1 ? "s" : ""} guardada{proposals.length !== 1 ? "s" : ""}
            {!isPro && ` · Máximo 3 en plan gratuito`}
          </p>
        </div>
        <button
          onClick={() => {
            if (!isPro && proposals.length >= 3) {
              toast("Límite alcanzado. Actualiza a Pro para crear más propuestas.", "warn");
              return;
            }
            onNavigate("new-proposal");
          }}
          style={{
            ...styles.btn("primary"),
            background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})`,
            boxShadow: `0 4px 14px rgba(16,185,129,0.3)`,
          }}
        >
          <Icon.plus /> Nueva Propuesta
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Propuestas", value: proposals.length, sub: !isPro ? `/ 3 máx.` : "ilimitadas" },
          { label: "Plan Actual", value: isPro ? "Pro ✦" : "Free", sub: isPro ? "Sin límites" : "Hasta 3 propuestas" },
          { label: "Total Facturado", value: fmt(proposals.reduce((s, p) => s + (p.total || 0), 0)), sub: "Suma de propuestas" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...styles.card, padding: "20px 24px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {stat.label}
            </p>
            <p style={{ margin: "0 0 2px", fontSize: "22px", fontWeight: 800, color: C.dark }}>{stat.value}</p>
            <p style={{ margin: 0, fontSize: "12px", color: C.muted }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Upgrade banner (free users) */}
      {!isPro && (
        <div
          style={{
            background: "linear-gradient(135deg, #0F172A, #1E293B)",
            borderRadius: "14px",
            padding: "20px 24px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#fff", fontSize: "15px" }}>
              ✦ Actualiza a Cotizify Pro
            </p>
            <p style={{ margin: 0, color: "#94A3B8", fontSize: "13px" }}>
              Propuestas ilimitadas · PDF sin marca de agua · Logo personalizado
            </p>
          </div>
          <button
            onClick={() => onNavigate("upgrade")}
            style={{
              ...styles.btn("primary"),
              background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})`,
              whiteSpace: "nowrap",
            }}
          >
            <Icon.star /> USD $9 único
          </button>
        </div>
      )}

      {/* Proposals list */}
      {proposals.length === 0 ? (
        <div
          style={{
            ...styles.card,
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <h3 style={{ margin: "0 0 8px", color: C.dark }}>Sin propuestas aún</h3>
          <p style={{ color: C.muted, margin: "0 0 20px" }}>Crea tu primera propuesta profesional</p>
          <button
            onClick={() => onNavigate("new-proposal")}
            style={{ ...styles.btn("primary") }}
          >
            <Icon.plus /> Nueva Propuesta
          </button>
        </div>
      ) : (
        <div style={{ ...styles.card, overflow: "hidden" }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 130px 80px 140px",
              padding: "12px 20px",
              background: "#F8FAFC",
              borderBottom: `1px solid ${C.border}`,
              gap: "12px",
            }}
          >
            {["#", "Cliente", "Total", "Fecha", "Acciones"].map((h) => (
              <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {proposals.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 130px 80px 140px",
                padding: "14px 20px",
                borderBottom: i < proposals.length - 1 ? `1px solid ${C.border}` : "none",
                alignItems: "center",
                gap: "12px",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: C.emerald,
                  background: "#D1FAE5",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  display: "inline-block",
                }}
              >
                #{String(p.proposal_number || p.id).padStart(4, "0")}
              </span>
              <span style={{ fontWeight: 600, color: C.dark, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.client_name}
              </span>
              <span style={{ fontWeight: 700, color: C.dark, fontSize: "15px" }}>{fmt(p.total)}</span>
              <span style={{ fontSize: "13px", color: C.muted }}>{fmtDate(p.created_at)}</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  title="Ver"
                  onClick={() => onNavigate("view-proposal", p)}
                  style={{ ...styles.btn("ghost", "sm"), padding: "5px 8px", color: C.dark }}
                >
                  <Icon.eye />
                </button>
                <button
                  title="Descargar PDF"
                  onClick={() => handleDownload(p)}
                  style={{ ...styles.btn("ghost", "sm"), padding: "5px 8px", color: C.emerald }}
                >
                  <Icon.download />
                </button>
                <button
                  title="Duplicar"
                  onClick={() => onDuplicate(p)}
                  style={{ ...styles.btn("ghost", "sm"), padding: "5px 8px" }}
                >
                  <Icon.copy />
                </button>
                <button
                  title="Eliminar"
                  onClick={() => onDelete(p.id)}
                  style={{ ...styles.btn("ghost", "sm"), padding: "5px 8px", color: C.error }}
                >
                  <Icon.trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PROPOSAL FORM
// ─────────────────────────────────────────────
function ProposalForm({ user, profile, existing, onSave, onCancel, toast }) {
  const isPro = profile?.plan === "pro";
  const [clientName, setClientName] = useState(existing?.client_name || "");
  const [services, setServices] = useState(
    existing?.services || [{ id: Date.now(), description: "", quantity: 1, unit_price: 0 }]
  );
  const [taxRate, setTaxRate] = useState(existing?.tax_rate || 0);
  const [discountRate, setDiscountRate] = useState(existing?.discount_rate || 0);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [saving, setSaving] = useState(false);

  const subtotal = services.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_price) || 0), 0);
  const taxAmount = subtotal * (Number(taxRate) / 100);
  const discountAmount = subtotal * (Number(discountRate) / 100);
  const total = subtotal + taxAmount - discountAmount;

  const addService = () =>
    setServices([...services, { id: Date.now(), description: "", quantity: 1, unit_price: 0 }]);

  const removeService = (id) => {
    if (services.length === 1) return;
    setServices(services.filter((s) => s.id !== id));
  };

  const updateService = (id, field, value) =>
    setServices(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const handleSave = async () => {
    if (!clientName.trim()) return toast("El nombre del cliente es obligatorio", "error");
    if (services.some((s) => !s.description.trim())) return toast("Completa la descripción de todos los servicios", "error");
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        client_name: clientName,
        services,
        tax_rate: Number(taxRate),
        discount_rate: Number(discountRate),
        notes,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total,
      };
      let result;
      if (existing?.id) {
        result = await supabaseFetch(`/proposals?id=eq.${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
        });
        toast("Propuesta actualizada");
      } else {
        // Get next proposal number
        const existing_proposals = await supabaseFetch(`/proposals?user_id=eq.${user.id}&select=proposal_number&order=proposal_number.desc&limit=1`);
        const nextNum = ((existing_proposals?.[0]?.proposal_number) || 0) + 1;
        result = await supabaseFetch("/proposals", {
          method: "POST",
          body: JSON.stringify({ ...payload, proposal_number: nextNum }),
        });
        toast("Propuesta guardada");
      }
      onSave(Array.isArray(result) ? result[0] : result);
    } catch (e) {
      toast(e.message, "error");
    }
    setSaving(false);
  };

  const inputHover = (e, focus) => {
    e.target.style.borderColor = focus ? C.emerald : C.border;
    e.target.style.boxShadow = focus ? `0 0 0 3px rgba(16,185,129,0.12)` : "none";
  };

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button onClick={onCancel} style={{ ...styles.btn("outline", "sm") }}>← Volver</button>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: C.dark }}>
            {existing ? "Editar Propuesta" : "Nueva Propuesta"}
          </h1>
        </div>
      </div>

      {/* Client name */}
      <div style={{ ...styles.card, padding: "24px", marginBottom: "16px" }}>
        <label style={styles.label}>Nombre del Cliente *</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Ej: Empresa ABC S.A."
          style={styles.input}
          onFocus={(e) => inputHover(e, true)}
          onBlur={(e) => inputHover(e, false)}
        />
      </div>

      {/* Services */}
      <div style={{ ...styles.card, padding: "24px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: C.dark }}>Servicios / Ítems</h3>
          <button onClick={addService} style={{ ...styles.btn("outline", "sm") }}>
            <Icon.plus /> Agregar línea
          </button>
        </div>

        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 110px 36px", gap: "8px", marginBottom: "8px" }}>
          {["Descripción", "Cant.", "P. Unitario", "Total", ""].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {services.map((svc) => (
          <div key={svc.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 110px 36px", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
            <input
              type="text"
              value={svc.description}
              onChange={(e) => updateService(svc.id, "description", e.target.value)}
              placeholder="Descripción del servicio"
              style={styles.input}
              onFocus={(e) => inputHover(e, true)}
              onBlur={(e) => inputHover(e, false)}
            />
            <input
              type="number"
              min="0"
              value={svc.quantity}
              onChange={(e) => updateService(svc.id, "quantity", e.target.value)}
              style={styles.input}
              onFocus={(e) => inputHover(e, true)}
              onBlur={(e) => inputHover(e, false)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={svc.unit_price}
              onChange={(e) => updateService(svc.id, "unit_price", e.target.value)}
              style={styles.input}
              onFocus={(e) => inputHover(e, true)}
              onBlur={(e) => inputHover(e, false)}
            />
            <div style={{
              padding: "10px 14px",
              background: "#F8FAFC",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: C.dark,
              border: `1px solid ${C.border}`,
            }}>
              {fmt((Number(svc.quantity) || 0) * (Number(svc.unit_price) || 0))}
            </div>
            <button
              onClick={() => removeService(svc.id)}
              style={{ ...styles.btn("danger", "sm"), padding: "8px", justifyContent: "center" }}
              disabled={services.length === 1}
            >
              <Icon.trash />
            </button>
          </div>
        ))}
      </div>

      {/* Tax & Discount */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={{ ...styles.card, padding: "20px" }}>
          <label style={styles.label}>Impuesto (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            style={styles.input}
            onFocus={(e) => inputHover(e, true)}
            onBlur={(e) => inputHover(e, false)}
          />
        </div>
        <div style={{ ...styles.card, padding: "20px" }}>
          <label style={styles.label}>Descuento (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discountRate}
            onChange={(e) => setDiscountRate(e.target.value)}
            style={styles.input}
            onFocus={(e) => inputHover(e, true)}
            onBlur={(e) => inputHover(e, false)}
          />
        </div>
      </div>

      {/* Notes */}
      <div style={{ ...styles.card, padding: "24px", marginBottom: "16px" }}>
        <label style={styles.label}>Notas adicionales</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Términos, condiciones, agradecimiento..."
          rows={3}
          style={{ ...styles.input, resize: "vertical", fontFamily: "inherit" }}
          onFocus={(e) => inputHover(e, true)}
          onBlur={(e) => inputHover(e, false)}
        />
      </div>

      {/* Totals summary */}
      <div style={{ ...styles.card, padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: C.dark }}>Resumen</h3>
        {[
          ["Subtotal", fmt(subtotal)],
          taxRate > 0 ? [`Impuesto (${taxRate}%)`, fmt(taxAmount)] : null,
          discountRate > 0 ? [`Descuento (${discountRate}%)`, `-${fmt(discountAmount)}`] : null,
        ]
          .filter(Boolean)
          .map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: C.muted, fontSize: "14px" }}>{label}</span>
              <span style={{ color: C.dark, fontSize: "14px", fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        <div style={{ borderTop: `2px solid ${C.border}`, marginTop: "12px", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: "18px", color: C.dark }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: "22px", color: C.emerald }}>{fmt(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={styles.btn("outline")}>Cancelar</button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.btn("primary"),
            background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})`,
            boxShadow: `0 4px 14px rgba(16,185,129,0.3)`,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Guardando..." : existing ? "Actualizar Propuesta" : "Guardar Propuesta"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VIEW PROPOSAL
// ─────────────────────────────────────────────
function ViewProposal({ proposal, profile, onBack, onEdit, toast }) {
  const isPro = profile?.plan === "pro";

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <button onClick={onBack} style={{ ...styles.btn("outline", "sm") }}>← Volver</button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onEdit} style={styles.btn("outline", "sm")}>
            <Icon.edit /> Editar
          </button>
          <button
            onClick={() => generatePDF(proposal, isPro, profile?.logo_url)}
            style={{ ...styles.btn("primary", "sm"), background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})` }}
          >
            <Icon.download /> Descargar PDF
          </button>
        </div>
      </div>

      {/* Watermark banner */}
      {!isPro && (
        <div style={{
          background: "#FEF3C7",
          border: "1px solid #FDE68A",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <p style={{ margin: 0, fontSize: "13px", color: "#92400E" }}>
            <strong>Esta propuesta tiene marca de agua.</strong> Actualiza a Pro para eliminarla y acceder a propuestas ilimitadas.
          </p>
        </div>
      )}

      {/* Proposal card */}
      <div style={{ ...styles.card, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: C.dark, padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Icon.logo />
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "20px", color: "#fff" }}>Cotizify</p>
              <p style={{ margin: 0, fontSize: "12px", color: C.emerald }}>Propuesta Profesional</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 2px", color: "#fff", fontWeight: 700, fontSize: "16px" }}>
              #{String(proposal.proposal_number || proposal.id).padStart(4, "0")}
            </p>
            <p style={{ margin: 0, color: "#94A3B8", fontSize: "13px" }}>{fmtDate(proposal.created_at)}</p>
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>
          {/* Client */}
          <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "16px 20px", marginBottom: "24px" }}>
            <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Cliente
            </p>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: C.dark }}>{proposal.client_name}</p>
          </div>

          {/* Services table */}
          <div style={{ borderRadius: "10px", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 110px", background: C.dark, padding: "10px 16px", gap: "8px" }}>
              {["Descripción", "Cant.", "P. Unit.", "Total"].map((h) => (
                <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {(proposal.services || []).map((svc, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 70px 110px 110px",
                  padding: "11px 16px",
                  gap: "8px",
                  borderTop: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? "#fff" : "#F8FAFC",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "14px", color: C.dark }}>{svc.description}</span>
                <span style={{ fontSize: "14px", color: C.muted }}>{svc.quantity}</span>
                <span style={{ fontSize: "14px", color: C.dark }}>{fmt(svc.unit_price)}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: C.dark }}>
                  {fmt((svc.quantity || 0) * (svc.unit_price || 0))}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "260px" }}>
              {[
                ["Subtotal", fmt(proposal.subtotal)],
                proposal.tax_rate > 0 ? [`Impuesto (${proposal.tax_rate}%)`, fmt(proposal.tax_amount)] : null,
                proposal.discount_rate > 0 ? [`Descuento (${proposal.discount_rate}%)`, `-${fmt(proposal.discount_amount)}`] : null,
              ]
                .filter(Boolean)
                .map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: C.muted, fontSize: "13px" }}>{label}</span>
                    <span style={{ color: C.dark, fontSize: "13px", fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              <div style={{
                background: C.emerald,
                borderRadius: "10px",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px",
              }}>
                <span style={{ fontWeight: 700, color: "#fff" }}>TOTAL</span>
                <span style={{ fontWeight: 800, fontSize: "18px", color: "#fff" }}>{fmt(proposal.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {proposal.notes && (
            <div style={{ background: "#F0FDF4", borderRadius: "10px", padding: "16px 20px", marginTop: "24px", border: "1px solid #BBF7D0" }}>
              <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>Notas</p>
              <p style={{ margin: 0, fontSize: "14px", color: C.dark, lineHeight: 1.6 }}>{proposal.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────
function ProfilePage({ user, profile, onUpgrade, onLogoUpload, toast }) {
  const isPro = profile?.plan === "pro";
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Solo se permiten imágenes", "error");
    if (file.size > 2 * 1024 * 1024) return toast("La imagen debe ser menor a 2MB", "error");
    await onLogoUpload(file);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ margin: "0 0 28px", fontSize: "22px", fontWeight: 800, color: C.dark }}>Mi Perfil</h1>

      <div style={{ ...styles.card, padding: "28px", marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: C.dark }}>Información de Cuenta</h3>
        <div style={{ display: "grid", gap: "12px" }}>
          {[
            ["Correo electrónico", user?.email],
            ["Plan actual", isPro ? "Pro ✦" : "Free"],
            ["Miembro desde", fmtDate(profile?.created_at || new Date())],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.muted, fontSize: "14px" }}>{label}</span>
              <span style={{ fontWeight: 600, color: C.dark, fontSize: "14px" }}>
                {val}
                {label === "Plan actual" && (
                  <span style={{ ...styles.badge(isPro ? "emerald" : "default"), marginLeft: "8px" }}>
                    {isPro ? "ACTIVO" : "GRATUITO"}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Logo upload */}
      <div style={{ ...styles.card, padding: "28px", marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700, color: C.dark }}>Logo de tu Negocio</h3>
        <p style={{ margin: "0 0 16px", color: C.muted, fontSize: "13px" }}>Aparecerá en tus propuestas PDF</p>

        {!isPro ? (
          <div style={{
            padding: "20px",
            background: "#F8FAFC",
            borderRadius: "10px",
            border: `2px dashed ${C.border}`,
            textAlign: "center",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: "14px", color: C.muted }}>🔒 Disponible solo en plan Pro</p>
            <button onClick={onUpgrade} style={{ ...styles.btn("primary", "sm") }}>
              <Icon.star /> Actualizar a Pro
            </button>
          </div>
        ) : (
          <div>
            {profile?.logo_url && (
              <div style={{ marginBottom: "12px" }}>
                <img
                  src={profile.logo_url}
                  alt="Logo"
                  style={{ maxHeight: "80px", borderRadius: "8px", border: `1px solid ${C.border}` }}
                />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            <button onClick={() => fileRef.current.click()} style={styles.btn("outline")}>
              <Icon.upload /> {profile?.logo_url ? "Cambiar logo" : "Subir logo"}
            </button>
          </div>
        )}
      </div>

      {!isPro && (
        <div style={{ ...styles.card, padding: "28px", background: "linear-gradient(135deg, #0F172A, #1E293B)" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: "#fff" }}>✦ Cotizify Pro</h3>
          <p style={{ margin: "0 0 16px", color: "#94A3B8", fontSize: "13px" }}>Pago único de USD $9 · Sin suscripciones</p>
          {[
            "Propuestas ilimitadas",
            "PDF sin marca de agua",
            "Logo personalizado en PDFs",
            "Soporte prioritario",
          ].map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ color: C.emerald }}><Icon.check /></span>
              <span style={{ color: "#CBD5E1", fontSize: "13px" }}>{b}</span>
            </div>
          ))}
          <button
            onClick={onUpgrade}
            style={{
              ...styles.btn("primary"),
              marginTop: "16px",
              background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})`,
              boxShadow: `0 4px 14px rgba(16,185,129,0.4)`,
            }}
          >
            <Icon.star /> Actualizar a Pro · USD $9
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// UPGRADE MODAL
// ─────────────────────────────────────────────
function UpgradeModal({ open, onClose, onSimulate, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="✦ Cotizify Pro">
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: "4px",
          marginBottom: "8px",
        }}>
          <span style={{ fontSize: "40px", fontWeight: 800, color: C.dark }}>$9</span>
          <span style={{ color: C.muted, fontSize: "16px" }}>USD · pago único</span>
        </div>
        <p style={{ margin: 0, color: C.muted, fontSize: "13px" }}>Sin suscripciones. Tuyo para siempre.</p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        {[
          ["✦", "Propuestas ilimitadas"],
          ["✦", "PDF sin marca de agua"],
          ["✦", "Logo personalizado en PDFs"],
          ["✦", "Soporte prioritario"],
        ].map(([icon, benefit]) => (
          <div key={benefit} style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 0",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ color: C.emerald, fontWeight: 700 }}>{icon}</span>
            <span style={{ fontSize: "14px", color: C.dark }}>{benefit}</span>
          </div>
        ))}
      </div>

      {/* TODO: Replace with real payment webhook (Tropipay/crypto) */}
      <button
        onClick={onSimulate}
        disabled={loading}
        style={{
          ...styles.btn("primary", "lg"),
          width: "100%",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})`,
          boxShadow: `0 4px 20px rgba(16,185,129,0.35)`,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Procesando..." : "Simular Pago · Activar Pro"}
      </button>
      <p style={{ textAlign: "center", marginTop: "12px", fontSize: "11px", color: C.muted }}>
        Modo demo — reemplazar con webhook real (Tropipay/cripto)
      </p>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("auth");
  const [pageData, setPageData] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [toast, setToast] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Load session on mount
  useEffect(() => {
    const token = localStorage.getItem("sb_token");
    const savedUser = localStorage.getItem("sb_user");
    if (token && savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      loadProfile(u.id);
      loadProposals(u.id);
      setPage("dashboard");
    }

    // Add CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      * { box-sizing: border-box; }
      button:hover { filter: brightness(0.96); }
    `;
    document.head.appendChild(style);
  }, []);

  const loadProfile = async (userId) => {
    try {
      const data = await supabaseFetch(`/profiles?id=eq.${userId}`);
      if (data?.length) setProfile(data[0]);
    } catch (_) {}
  };

  const loadProposals = async (userId) => {
    try {
      const data = await supabaseFetch(`/proposals?user_id=eq.${userId}&order=created_at.desc`);
      setProposals(data || []);
    } catch (_) {}
  };

  const handleAuth = (u, token) => {
    setUser(u);
    loadProfile(u.id);
    loadProposals(u.id);
    setPage("dashboard");
    showToast("¡Bienvenido a Cotizify!");
  };

  const handleLogout = () => {
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_user");
    setUser(null);
    setProfile(null);
    setProposals([]);
    setPage("auth");
  };

  const handleNavigate = (p, data = null) => {
    setPage(p);
    setPageData(data);
    if (p === "upgrade") setUpgradeOpen(true);
    window.scrollTo(0, 0);
  };

  const handleSaveProposal = (saved) => {
    if (pageData?.id) {
      // Edit mode
      setProposals((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      setProposals((prev) => [saved, ...prev]);
    }
    handleNavigate("dashboard");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta propuesta?")) return;
    try {
      await supabaseFetch(`/proposals?id=eq.${id}`, { method: "DELETE" });
      setProposals((prev) => prev.filter((p) => p.id !== id));
      showToast("Propuesta eliminada");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleDuplicate = async (p) => {
    if (!profile?.plan === "pro" && proposals.length >= 3) {
      showToast("Límite alcanzado. Actualiza a Pro.", "warn");
      return;
    }
    try {
      const existing_proposals = await supabaseFetch(`/proposals?user_id=eq.${user.id}&select=proposal_number&order=proposal_number.desc&limit=1`);
      const nextNum = ((existing_proposals?.[0]?.proposal_number) || 0) + 1;
      const { id, created_at, updated_at, ...rest } = p;
      const data = await supabaseFetch("/proposals", {
        method: "POST",
        body: JSON.stringify({ ...rest, proposal_number: nextNum, client_name: `${p.client_name} (copia)` }),
      });
      setProposals((prev) => [data[0], ...prev]);
      showToast("Propuesta duplicada");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleSimulatePay = async () => {
    setUpgradeLoading(true);
    try {
      await supabaseFetch(`/profiles?id=eq.${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ plan: "pro" }),
      });
      setProfile((prev) => ({ ...prev, plan: "pro" }));
      setUpgradeOpen(false);
      showToast("¡Plan Pro activado! 🎉");
      // TODO: Replace simulation with real payment webhook (Tropipay / crypto)
    } catch (e) {
      showToast(e.message, "error");
    }
    setUpgradeLoading(false);
  };

  const handleLogoUpload = async (file) => {
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;
      const token = localStorage.getItem("sb_token");
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/logos/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": file.type,
        },
        body: file,
      });
      if (!res.ok) throw new Error("Error subiendo logo");
      const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/logos/${path}`;
      await supabaseFetch(`/profiles?id=eq.${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ logo_url: logoUrl }),
      });
      setProfile((prev) => ({ ...prev, logo_url: logoUrl }));
      showToast("Logo actualizado");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  return (
    <div style={styles.app}>
      {user && (
        <Navbar
          user={user}
          profile={profile}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {page === "auth" && (
        <AuthPage onAuth={handleAuth} toast={showToast} />
      )}

      {page === "dashboard" && user && (
        <Dashboard
          user={user}
          profile={profile}
          proposals={proposals}
          onNavigate={handleNavigate}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          toast={showToast}
        />
      )}

      {(page === "new-proposal" || page === "edit-proposal") && user && (
        <ProposalForm
          user={user}
          profile={profile}
          existing={page === "edit-proposal" ? pageData : null}
          onSave={handleSaveProposal}
          onCancel={() => handleNavigate("dashboard")}
          toast={showToast}
        />
      )}

      {page === "view-proposal" && pageData && (
        <ViewProposal
          proposal={pageData}
          profile={profile}
          onBack={() => handleNavigate("dashboard")}
          onEdit={() => handleNavigate("edit-proposal", pageData)}
          toast={showToast}
        />
      )}

      {page === "profile" && user && (
        <ProfilePage
          user={user}
          profile={profile}
          onUpgrade={() => setUpgradeOpen(true)}
          onLogoUpload={handleLogoUpload}
          toast={showToast}
        />
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSimulate={handleSimulatePay}
        loading={upgradeLoading}
      />

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
