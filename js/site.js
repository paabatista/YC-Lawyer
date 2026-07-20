/* ============================================================
   site.js — Lógica de la página informativa
   - Carga la configuración desde Firestore (o usa DEFAULTS)
   - Aplica colores, logo, foto y textos
   - Renderiza servicios y valores
   - Maneja el formulario de cotización -> Firestore + WhatsApp
   ============================================================ */

import { firebaseConfig, firebaseListo } from "./firebase-config.js";
import { DEFAULTS } from "./defaults.js";

let db = null;

/* ---- Inicializa Firebase solo si está configurado ---- */
async function initFirebase() {
  if (!firebaseListo) return null;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.warn("No se pudo iniciar Firebase, usando contenido por defecto.", e);
    return null;
  }
}

/* ---- Trae la configuración del sitio desde Firestore ---- */
async function cargarConfig() {
  if (!db) return { ...DEFAULTS };
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const snap = await getDoc(doc(db, "config", "site"));
    if (snap.exists()) {
      // Mezcla defaults + lo guardado (por si faltan campos)
      return { ...DEFAULTS, ...snap.data() };
    }
  } catch (e) {
    console.warn("No se pudo leer la config, usando defaults.", e);
  }
  return { ...DEFAULTS };
}

/* ---- Aplica los datos a la página ---- */
function aplicar(cfg) {
  // Colores
  document.documentElement.style.setProperty("--primary", cfg.colorPrimario || DEFAULTS.colorPrimario);
  document.documentElement.style.setProperty("--accent",  cfg.colorAcento   || DEFAULTS.colorAcento);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", cfg.colorPrimario || DEFAULTS.colorPrimario);

  // Logo (si hay uno subido, reemplaza el SVG por defecto en todos lados)
  if (cfg.logoUrl) {
    ["nav-logo", "hero-logo", "footer-logo"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.src = cfg.logoUrl;
    });
  }

  // Foto de "Sobre mí"
  if (cfg.fotoUrl) {
    const box = document.getElementById("about-photo");
    if (box) box.innerHTML = `<img src="${cfg.fotoUrl}" alt="${cfg.nombre}" />`;
  }

  // Textos con data-atributos (identidad / hero / contacto)
  const map = {
    nombre: cfg.nombre, profesion: cfg.profesion, eslogan: cfg.eslogan,
    descripcion: cfg.descripcion,
    aniosExperiencia: cfg.aniosExperiencia, casosAtendidos: cfg.casosAtendidos,
    telefono: cfg.telefono, email: cfg.email, ubicacion: cfg.ubicacion
  };
  for (const [k, v] of Object.entries(map)) {
    if (v == null) continue;
    document.querySelectorAll(`[data-${k}]`).forEach(el => el.textContent = v);
  }
  document.querySelectorAll("[data-ig]").forEach(el => el.textContent = "@" + (cfg.instagram || ""));

  // Secciones: header dinámico, orden, visibilidad y textos de cabecera
  aplicarSecciones(cfg);

  // Enlaces de contacto
  const telDigits = (cfg.telefono || "").replace(/[^\d+]/g, "");
  document.querySelectorAll("[data-tel-link]").forEach(a => a.href = "tel:" + telDigits);
  document.querySelectorAll("[data-mail-link]").forEach(a => a.href = "mailto:" + cfg.email);
  document.querySelectorAll("[data-ig-link]").forEach(a => a.href = "https://instagram.com/" + (cfg.instagram || ""));

  // WhatsApp
  const waBase = "https://wa.me/" + (cfg.whatsapp || "").replace(/\D/g, "");
  const waMsg = encodeURIComponent(`Hola ${cfg.nombre}, me gustaría una asesoría legal.`);
  const waFull = `${waBase}?text=${waMsg}`;
  ["hero-wa", "info-wa", "wa-float", "foot-wa"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = waFull;
  });
  const footMail = document.getElementById("foot-mail");
  if (footMail) footMail.href = "mailto:" + cfg.email;
  const footIg = document.getElementById("foot-ig");
  if (footIg) footIg.href = "https://instagram.com/" + (cfg.instagram || "");

  // Servicios
  const sg = document.getElementById("servicios-grid");
  if (sg && Array.isArray(cfg.servicios)) {
    sg.innerHTML = cfg.servicios.map(s => `
      <article class="card reveal">
        <span class="ico">${s.icono || "⚖️"}</span>
        <h3>${escapeHtml(s.titulo)}</h3>
        <p>${escapeHtml(s.descripcion)}</p>
      </article>`).join("");
  }

  // Valores
  const vg = document.getElementById("valores-grid");
  if (vg && Array.isArray(cfg.valores)) {
    vg.innerHTML = cfg.valores.map(v => `
      <div class="value reveal">
        <h4>${escapeHtml(v.titulo)}</h4>
        <p>${escapeHtml(v.descripcion)}</p>
      </div>`).join("");
  }

  // Opciones del select del formulario según servicios
  const sel = document.getElementById("q-area");
  if (sel && Array.isArray(cfg.servicios) && cfg.servicios.length) {
    sel.innerHTML = cfg.servicios.map(s => `<option>${escapeHtml(s.titulo)}</option>`).join("") + `<option>Otro</option>`;
  }

  // Guarda config en memoria para el formulario
  window.__cfg = cfg;
  observarReveal();
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---- Secciones: header dinámico, orden, visibilidad y textos ---- */
function aplicarSecciones(cfg) {
  const secciones = Array.isArray(cfg.secciones) && cfg.secciones.length
    ? cfg.secciones : DEFAULTS.secciones;

  // 1) Reconstruir los enlaces del header en el orden configurado
  const navLinks = document.getElementById("navLinks");
  if (navLinks) {
    navLinks.innerHTML = "";
    secciones.forEach(s => {
      if (s.visible === false) return;
      const a = document.createElement("a");
      a.href = "#" + s.id;
      a.textContent = s.nav || s.titulo || s.id;
      navLinks.appendChild(a);
    });
    // Botón CTA "Cotizar" al final (solo si la sección cotizar está visible)
    const cot = secciones.find(s => s.id === "cotizar");
    if (!cot || cot.visible !== false) {
      const cta = document.createElement("a");
      cta.href = "#cotizar";
      cta.className = "btn btn-gold";
      cta.style.padding = "9px 20px";
      cta.textContent = "Cotizar";
      navLinks.appendChild(cta);
    }
    // Cerrar el menú móvil al hacer clic
    navLinks.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => navLinks.classList.remove("open")));
  }

  // 2) Ordenar físicamente las secciones en la página (después del hero)
  const hero = document.getElementById("inicio");
  if (hero && hero.parentNode) {
    let ref = hero;
    secciones.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) { ref.after(el); ref = el; }
    });
  }

  // 3) Visibilidad + textos de cabecera de cada sección
  secciones.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.style.display = (s.visible === false) ? "none" : "";

    const cont = document.querySelector(`[data-section="${s.id}"]`);
    if (!cont) return;
    setHead(cont, "eyebrow", s.eyebrow);
    // Para "sobre-mi", si no hay título usa el nombre
    setHead(cont, "titulo", s.titulo || (s.id === "sobre-mi" ? cfg.nombre : ""));
    setHead(cont, "descripcion", s.descripcion);
  });
}

function setHead(cont, campo, valor) {
  const el = cont.querySelector(`[data-head="${campo}"]`);
  if (!el) return;
  el.textContent = valor || "";
  el.style.display = (valor && String(valor).trim()) ? "" : "none";
}

/* ---- Formulario de cotización ---- */
function initFormulario() {
  const form = document.getElementById("quoteForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cfg = window.__cfg || DEFAULTS;
    const btn = document.getElementById("quoteSubmit");
    const msgBox = document.getElementById("formMsg");
    const data = {
      nombre:  form.nombre.value.trim(),
      telefono: form.telefono.value.trim(),
      email:   form.email.value.trim(),
      area:    form.area.value,
      mensaje: form.mensaje.value.trim()
    };

    btn.disabled = true;
    btn.textContent = "Enviando...";

    // 1) Guarda la solicitud en Firestore (si está disponible)
    await guardarSolicitud(data);

    // 2) Envía por correo (EmailJS opcional, si está configurado)
    enviarEmailOpcional(data, cfg);

    // 3) Abre WhatsApp con el mensaje listo
    const texto =
      `*Nueva solicitud de cotización*\n\n` +
      `👤 Nombre: ${data.nombre}\n` +
      `📞 Teléfono: ${data.telefono}\n` +
      (data.email ? `✉️ Correo: ${data.email}\n` : "") +
      `⚖️ Área: ${data.area}\n\n` +
      `📝 Caso: ${data.mensaje}`;
    const waUrl = `https://wa.me/${(cfg.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;

    msgBox.className = "form-msg ok";
    msgBox.textContent = "¡Gracias! Se abrirá WhatsApp para completar tu solicitud.";
    window.open(waUrl, "_blank");

    btn.disabled = false;
    btn.textContent = "Enviar solicitud";
    form.reset();
  });
}

async function guardarSolicitud(data) {
  if (!db) return;
  try {
    const { collection, addDoc, serverTimestamp } =
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await addDoc(collection(db, "solicitudes"), {
      ...data,
      leido: false,
      fecha: serverTimestamp()
    });
  } catch (e) {
    console.warn("No se pudo guardar la solicitud en Firestore.", e);
  }
}

/* EmailJS: opcional. Si quieres correo automático, agrega el script de EmailJS
   en index.html y define window.EMAILJS = {serviceId, templateId, publicKey}. */
function enviarEmailOpcional(data, cfg) {
  try {
    if (window.emailjs && window.EMAILJS) {
      window.emailjs.send(window.EMAILJS.serviceId, window.EMAILJS.templateId, {
        to_email: cfg.email,
        nombre: data.nombre, telefono: data.telefono,
        email: data.email, area: data.area, mensaje: data.mensaje
      }, window.EMAILJS.publicKey);
    }
  } catch (e) { /* silencioso */ }
}

/* ---- Animación al hacer scroll ---- */
function observarReveal() {
  const els = document.querySelectorAll(".reveal:not(.in)");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ---- Menú móvil ---- */
function initMenu() {
  const t = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (t && links) {
    t.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
  }
}

/* ---- Acceso oculto al panel: doble clic en el logo ----
   No hay enlace visible; solo quien sepa el truco (la clienta) entra. */
function initAdminAcceso() {
  const abrir = (e) => { e.preventDefault(); window.location.href = "admin.html"; };
  ["nav-logo", "hero-logo", "footer-logo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.cursor = "pointer";
      el.addEventListener("dblclick", abrir);
    }
  });
  // Evita que el doble clic sobre el logo del header dispare la navegación del enlace
  const brand = document.querySelector(".brand");
  if (brand) brand.addEventListener("click", (e) => { if (e.detail >= 2) e.preventDefault(); });
}

/* ---- Partículas doradas (ligero, se apaga si prefiere-reduced-motion) ---- */
function initParticles() {
  const c = document.getElementById("particles");
  if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = c.getContext("2d");
  let w, h, parts;
  function resize() {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
    const n = Math.min(70, Math.floor(w / 22));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.2
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > w) p.dx *= -1;
      if (p.y < 0 || p.y > h) p.dy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226,184,79,${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener("resize", resize);
  draw();
}

/* ---- Arranque ---- */
(async function () {
  document.getElementById("year").textContent = new Date().getFullYear();
  initMenu();
  initAdminAcceso();
  initParticles();
  initFormulario();
  await initFirebase();
  const cfg = await cargarConfig();
  aplicar(cfg);
})();
