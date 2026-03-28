/**
 * @component LandingPage
 * @description Pantalla de bienvenida / onboarding de Elevate Sports.
 * Estetica EA Sports/FIFA con dos caminos: Demo o Nuevo Club.
 *
 * @props { onDemo, onRegister, onLogin }
 * @author @Desarrollador (Andres) + @Data (Mateo) v2 Auth
 * @version 2.0.0
 */

import { useState } from "react";
import { PALETTE } from "../constants/palette";
import { sanitizeText, sanitizeTextFinal, sanitizeEmail, sanitizePhone } from "../utils/sanitize";
import { ROLES } from "../constants/roles";
import { isSupabaseReady } from "../lib/supabase";

/* ── Keyframe para glow pulsante ── */
if (typeof document !== "undefined" && !document.getElementById("landing-kf")) {
  const s = document.createElement("style");
  s.id = "landing-kf";
  s.textContent = [
    "@keyframes ldg_glow{0%,100%{box-shadow:0 0 30px rgba(200,255,0,0.2)}50%{box-shadow:0 0 60px rgba(200,255,0,0.45)}}",
    "@keyframes ldg_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}",
    "@keyframes ldg_fade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}",
  ].join("");
  document.head.appendChild(s);
}

const REQUIRED_FIELDS = ["nombre", "ciudad", "entrenador", "categorias"];

export default function LandingPage({ onDemo, onRegister, onLogin }) {
  const [step, setStep] = useState("landing"); // landing | register | login
  const [form, setForm] = useState({
    nombre: "", disciplina: "Futbol", ciudad: "", entrenador: "",
    temporada: "2025-26", categorias: "", campo: "",
    telefono: "", email: "", role: "admin", password: "",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hoverDemo, setHoverDemo] = useState(false);
  const [hoverReg, setHoverReg] = useState(false);
  const [hoverLogin, setHoverLogin] = useState(false);

  const updateField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validateAndSubmit = async () => {
    const errs = {};
    REQUIRED_FIELDS.forEach(k => {
      if (!form[k] || !form[k].trim()) errs[k] = "Campo obligatorio";
    });
    // Email obligatorio para auth
    const cleanEmail = sanitizeEmail(form.email);
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = "Email obligatorio y valido";
    }
    // Password obligatorio para auth
    if (!form.password || form.password.length < 6) {
      errs.password = "Minimo 6 caracteres";
    }
    if (!ROLES[form.role]) {
      errs.role = "Rol invalido";
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      // Sanitizar y hacer trim final solo en el momento de persistencia
      await onRegister({
        ...form,
        nombre:     sanitizeTextFinal(form.nombre),
        ciudad:     sanitizeTextFinal(form.ciudad),
        entrenador: sanitizeTextFinal(form.entrenador),
        categorias: sanitizeTextFinal(form.categorias),
        campo:      sanitizeTextFinal(form.campo),
        telefono:   sanitizePhone(form.telefono),
        email:      cleanEmail,
        password:   form.password,
      });
      setLoading(false);
    }
  };

  const validateAndLogin = async () => {
    const errs = {};
    const cleanEmail = sanitizeEmail(loginForm.email);
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = "Email obligatorio y valido";
    }
    if (!loginForm.password) {
      errs.password = "Ingresa tu contraseña";
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0 && onLogin) {
      setLoading(true);
      await onLogin({ email: cleanEmail, password: loginForm.password });
      setLoading(false);
    }
  };

  const css = {
    page: {
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, rgba(200,255,0,0.04) 0%, #050a14 70%)",
      fontFamily: "'Arial Narrow', Arial, sans-serif", padding: 24, position: "relative", zIndex: 2,
    },
    logo: {
      fontSize: 48, fontWeight: 900, letterSpacing: "-2px", color: "white",
      textTransform: "uppercase", marginBottom: 6, animation: "ldg_fade 0.6s ease-out",
    },
    subtitle: {
      fontSize: 11, textTransform: "uppercase", letterSpacing: "6px",
      color: "rgba(255,255,255,0.3)", marginBottom: 50, animation: "ldg_fade 0.8s ease-out",
    },
    cards: {
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
      maxWidth: 700, width: "100%", animation: "ldg_fade 1s ease-out",
    },
    card: (hover, accent) => ({
      padding: "40px 32px",
      background: hover ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${hover ? accent : "rgba(255,255,255,0.08)"}`,
      borderTop: `4px solid ${accent}`,
      borderRadius: 12,
      cursor: "pointer", transition: "all 0.25s ease",
      transform: hover ? "translateY(-4px)" : "translateY(0)",
      boxShadow: hover ? `0 8px 40px ${accent}33, 0 8px 32px rgba(0,0,0,0.4)` : "0 8px 32px rgba(0,0,0,0.4)",
    }),
    cardTag: (color) => ({
      fontSize: 9, textTransform: "uppercase", letterSpacing: "3px",
      color, marginBottom: 16, fontWeight: 700,
    }),
    cardTitle: {
      fontSize: 26, fontWeight: 900, color: "white", textTransform: "uppercase",
      letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 12,
    },
    cardDesc: { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 20 },
    btn: (hover, accent) => ({
      display: "inline-flex", alignItems: "center",
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px",
      padding: "12px 28px", background: hover ? "white" : accent,
      color: "#0a0a0a", border: "none", cursor: "pointer",
      transition: "background 200ms, transform 200ms",
    }),
    // Register form styles
    formContainer: {
      maxWidth: 560, width: "100%", animation: "ldg_fade 0.5s ease-out",
      background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    },
    formTitle: {
      fontSize: 28, fontWeight: 900, color: "white", textTransform: "uppercase",
      letterSpacing: "-0.5px", marginBottom: 6,
    },
    formSubtitle: {
      fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
      letterSpacing: "2px", marginBottom: 32,
    },
    fieldGroup: { marginBottom: 16 },
    label: {
      fontSize: 9, textTransform: "uppercase", letterSpacing: "1.5px",
      color: "rgba(255,255,255,0.4)", marginBottom: 6, display: "block",
    },
    input: (hasError) => ({
      width: "100%", fontSize: 14, padding: "10px 14px",
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${hasError ? PALETTE.danger : "rgba(255,255,255,0.1)"}`,
      borderRadius: 6,
      color: "white", fontFamily: "inherit", outline: "none",
      transition: "border-color 0.2s",
    }),
    errorText: { fontSize: 10, color: PALETTE.danger, marginTop: 4 },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  };

  // ── LANDING: dos opciones ──
  if (step === "landing") {
    return (
      <div style={css.page}>
        <div style={css.logo}>
          Elevate<span style={{ color: PALETTE.neon }}>Sports</span>
        </div>
        <div style={css.subtitle}>Plataforma de gestion deportiva</div>

        <div style={css.cards}>
          {/* DEMO */}
          <div
            style={css.card(hoverDemo, PALETTE.neon)}
            onMouseEnter={() => setHoverDemo(true)}
            onMouseLeave={() => setHoverDemo(false)}
            onClick={onDemo}
          >
            <div style={css.cardTag(PALETTE.neon)}>Modo exploracion</div>
            <div style={css.cardTitle}>Probar Demo</div>
            <div style={css.cardDesc}>
              Explora la plataforma con datos simulados de un club de ejemplo.
              Perfecto para conocer todas las funcionalidades sin configurar nada.
            </div>
            <div style={css.btn(hoverDemo, PALETTE.neon)}>Iniciar demo →</div>
          </div>

          {/* REGISTRO */}
          <div
            style={css.card(hoverReg, PALETTE.purple)}
            onMouseEnter={() => setHoverReg(true)}
            onMouseLeave={() => setHoverReg(false)}
            onClick={() => setStep("register")}
          >
            <div style={css.cardTag(PALETTE.purple)}>Club real</div>
            <div style={css.cardTitle}>Registrar Nuevo Club</div>
            <div style={css.cardDesc}>
              Configura tu club desde cero con datos reales.
              Nombre, categorias, entrenador y todo lo necesario para arrancar.
            </div>
            <div style={css.btn(hoverReg, PALETTE.purple)}>Crear club →</div>
          </div>
        </div>

        {/* LOGIN link */}
        {isSupabaseReady && (
          <div
            onClick={() => setStep("login")}
            onMouseEnter={() => setHoverLogin(true)}
            onMouseLeave={() => setHoverLogin(false)}
            style={{
              marginTop: 32, fontSize: 12, cursor: "pointer",
              color: hoverLogin ? "white" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase", letterSpacing: "1.5px",
              transition: "color 0.2s", textAlign: "center",
            }}
          >
            Ya tengo cuenta → <span style={{ color: PALETTE.neon, fontWeight: 700 }}>Iniciar sesion</span>
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 10, color: "rgba(255,255,255,0.15)", textTransform: "uppercase", letterSpacing: "2px" }}>
          v2.0 · Elevate Sports
        </div>
      </div>
    );
  }

  // ── REGISTER: formulario de nuevo club ──
  if (step === "register") return (
    <div style={css.page}>
      <div style={css.formContainer}>
        <div style={{ marginBottom: 32 }}>
          <div
            onClick={() => setStep("landing")}
            style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 20 }}
          >
            ← Volver
          </div>
          <div style={css.formTitle}>Registrar tu club</div>
          <div style={css.formSubtitle}>Completa los datos para comenzar</div>
        </div>

        {/* Nombre + Disciplina */}
        <div style={css.row}>
          <div style={css.fieldGroup}>
            <label style={css.label}>Nombre del club *</label>
            <input
              style={css.input(errors.nombre)}
              value={form.nombre}
              onChange={e => updateField("nombre", sanitizeText(e.target.value))}
              placeholder="Ej: Aguilas FC"
              maxLength={60}
            />
            {errors.nombre && <div style={css.errorText}>{errors.nombre}</div>}
          </div>
          <div style={css.fieldGroup}>
            <label style={css.label}>Disciplina</label>
            <select
              style={{ ...css.input(false), cursor: "pointer" }}
              value={form.disciplina}
              onChange={e => updateField("disciplina", e.target.value)}
            >
              {["Futbol", "Futsal", "Baloncesto", "Voleibol", "Otro"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ciudad + Entrenador */}
        <div style={css.row}>
          <div style={css.fieldGroup}>
            <label style={css.label}>Ciudad *</label>
            <input
              style={css.input(errors.ciudad)}
              value={form.ciudad}
              onChange={e => updateField("ciudad", sanitizeText(e.target.value))}
              placeholder="Ej: Medellin"
              maxLength={60}
            />
            {errors.ciudad && <div style={css.errorText}>{errors.ciudad}</div>}
          </div>
          <div style={css.fieldGroup}>
            <label style={css.label}>Director tecnico *</label>
            <input
              style={css.input(errors.entrenador)}
              value={form.entrenador}
              onChange={e => updateField("entrenador", sanitizeText(e.target.value))}
              placeholder="Nombre completo"
              maxLength={60}
            />
            {errors.entrenador && <div style={css.errorText}>{errors.entrenador}</div>}
          </div>
        </div>

        {/* Categoria + Temporada */}
        <div style={css.row}>
          <div style={css.fieldGroup}>
            <label style={css.label}>Categoria principal *</label>
            <input
              style={css.input(errors.categorias)}
              value={form.categorias}
              onChange={e => updateField("categorias", sanitizeText(e.target.value))}
              placeholder="Ej: Sub-17"
              maxLength={30}
            />
            {errors.categorias && <div style={css.errorText}>{errors.categorias}</div>}
          </div>
          <div style={css.fieldGroup}>
            <label style={css.label}>Temporada</label>
            <input
              style={css.input(false)}
              value={form.temporada}
              onChange={e => updateField("temporada", e.target.value)}
              placeholder="2025-26"
              maxLength={10}
            />
          </div>
        </div>

        {/* Campo + Telefono */}
        <div style={css.row}>
          <div style={css.fieldGroup}>
            <label style={css.label}>Campo / Cancha</label>
            <input
              style={css.input(false)}
              value={form.campo}
              onChange={e => updateField("campo", sanitizeText(e.target.value))}
              placeholder="Ej: Cancha La Floresta"
              maxLength={60}
            />
          </div>
          <div style={css.fieldGroup}>
            <label style={css.label}>Telefono</label>
            <input
              style={css.input(false)}
              value={form.telefono}
              onChange={e => updateField("telefono", sanitizePhone(e.target.value))}
              placeholder="300 123 4567"
              maxLength={20}
            />
          </div>
        </div>

        {/* Email + Password (Auth) */}
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "2px", color: PALETTE.neon, marginBottom: 12, fontWeight: 700 }}>
            Cuenta de acceso
          </div>
          <div style={css.row}>
            <div style={css.fieldGroup}>
              <label style={css.label}>Email *</label>
              <input
                style={css.input(errors.email)}
                value={form.email}
                onChange={e => updateField("email", sanitizeEmail(e.target.value))}
                placeholder="tu@email.com"
                maxLength={80}
                type="email"
                autoComplete="email"
              />
              {errors.email && <div style={css.errorText}>{errors.email}</div>}
            </div>
            <div style={css.fieldGroup}>
              <label style={css.label}>Contraseña *</label>
              <input
                style={css.input(errors.password)}
                value={form.password}
                onChange={e => updateField("password", e.target.value)}
                placeholder="Minimo 6 caracteres"
                maxLength={72}
                type="password"
                autoComplete="new-password"
              />
              {errors.password && <div style={css.errorText}>{errors.password}</div>}
            </div>
          </div>
        </div>

        {/* Rol */}
        <div style={css.fieldGroup}>
          <label style={css.label}>Tu rol en el club</label>
          <select
            style={{ ...css.input(errors.role), cursor: "pointer" }}
            value={form.role}
            onChange={e => updateField("role", e.target.value)}
          >
            {Object.entries(ROLES).map(([key, r]) => (
              <option key={key} value={key}>{r.label}</option>
            ))}
          </select>
          {errors.role && <div style={css.errorText}>{errors.role}</div>}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={validateAndSubmit}
            disabled={loading}
            style={{
              flex: 1, padding: "14px 24px", fontSize: 12, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "2px",
              background: loading ? "rgba(200,255,0,0.5)" : PALETTE.neon,
              color: "#0a0a0a", border: "none",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creando cuenta..." : "Crear club y comenzar →"}
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div style={{ marginTop: 12, fontSize: 10, color: PALETTE.danger, textTransform: "uppercase", letterSpacing: "1px" }}>
            Completa los campos obligatorios marcados con *
          </div>
        )}

        {isSupabaseReady && (
          <div
            onClick={() => { setStep("login"); setErrors({}); }}
            style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", textAlign: "center" }}
          >
            Ya tengo cuenta → <span style={{ color: PALETTE.neon }}>Iniciar sesion</span>
          </div>
        )}
      </div>
    </div>
  );

  // ── LOGIN: email + password ──
  if (step === "login") return (
    <div style={css.page}>
      <div style={{ ...css.formContainer, maxWidth: 400 }}>
        <div style={{ marginBottom: 32 }}>
          <div
            onClick={() => { setStep("landing"); setErrors({}); }}
            style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 20 }}
          >
            ← Volver
          </div>
          <div style={css.formTitle}>Iniciar sesion</div>
          <div style={css.formSubtitle}>Accede a tu club</div>
        </div>

        <div style={css.fieldGroup}>
          <label style={css.label}>Email</label>
          <input
            style={css.input(errors.email)}
            value={loginForm.email}
            onChange={e => { setLoginForm(p => ({ ...p, email: e.target.value })); if (errors.email) setErrors(p => { const n = { ...p }; delete n.email; return n; }); }}
            placeholder="tu@email.com"
            maxLength={80}
            type="email"
            autoComplete="email"
          />
          {errors.email && <div style={css.errorText}>{errors.email}</div>}
        </div>

        <div style={css.fieldGroup}>
          <label style={css.label}>Contraseña</label>
          <input
            style={css.input(errors.password)}
            value={loginForm.password}
            onChange={e => { setLoginForm(p => ({ ...p, password: e.target.value })); if (errors.password) setErrors(p => { const n = { ...p }; delete n.password; return n; }); }}
            placeholder="Tu contraseña"
            type="password"
            autoComplete="current-password"
            onKeyDown={e => e.key === "Enter" && validateAndLogin()}
          />
          {errors.password && <div style={css.errorText}>{errors.password}</div>}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={validateAndLogin}
            disabled={loading}
            style={{
              flex: 1, padding: "14px 24px", fontSize: 12, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "2px",
              background: loading ? "rgba(200,255,0,0.5)" : PALETTE.neon,
              color: "#0a0a0a", border: "none",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Ingresando..." : "Entrar →"}
          </button>
        </div>

        <div
          onClick={() => { setStep("register"); setErrors({}); }}
          style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", textAlign: "center" }}
        >
          No tengo cuenta → <span style={{ color: PALETTE.purple }}>Registrar club</span>
        </div>
      </div>
    </div>
  );

  return null;
}
