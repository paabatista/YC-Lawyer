/* ============================================================
   site.js — Lógica de la página informativa
   - Carga la configuración desde Firestore (o usa DEFAULTS)
   - Aplica colores, logo, foto y textos
   - Renderiza servicios y valores
   - Maneja el formulario de cotización -> Firestore + WhatsApp
   ============================================================ */

import { firebaseConfig, firebaseListo, WEB3FORMS_KEY } from "./firebase-config.js";
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
    const textoBtn = btn.textContent;
    btn.textContent = "Enviando...";
    msgBox.className = "form-msg";

    // Se envía por correo (Web3Forms) y se guarda en el panel (Firestore).
    // Con que uno de los dos funcione, la solicitud queda registrada.
    const [okEmail, okDB] = await Promise.all([
      enviarEmail(data, cfg).catch(() => false),
      guardarSolicitud(data).then(() => true).catch(() => false)
    ]);

    if (okEmail || okDB) {
      msgBox.className = "form-msg ok";
      msgBox.textContent = "✓ ¡Solicitud enviada! La Lcda. Yezubey te contactará pronto.";
      form.reset();
    } else {
      // Fallback: si nada funcionó, ofrece WhatsApp
      const texto =
        `Hola, quiero una cotización.\n\n` +
        `Nombre: ${data.nombre}\nTeléfono: ${data.telefono}\n` +
        (data.email ? `Correo: ${data.email}\n` : "") +
        `Área: ${data.area}\nCaso: ${data.mensaje}`;
      const waUrl = `https://wa.me/${(cfg.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
      msgBox.className = "form-msg err";
      msgBox.innerHTML = `No se pudo enviar. Intenta de nuevo o <a href="${waUrl}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">escríbenos por WhatsApp</a>.`;
    }

    btn.disabled = false;
    btn.textContent = textoBtn;
  });
}

async function guardarSolicitud(data) {
  if (!db) throw new Error("Firestore no disponible");
  const { collection, addDoc, serverTimestamp } =
    await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  await addDoc(collection(db, "solicitudes"), {
    ...data,
    leido: false,
    fecha: serverTimestamp()
  });
}

/* Envía la solicitud por correo a la abogada usando Web3Forms.
   Devuelve true si el correo se envió correctamente. */
async function enviarEmail(data, cfg) {
  if (!WEB3FORMS_KEY) return false;
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: `Nueva solicitud de cotización — ${data.nombre}`,
      from_name: "Sitio web YC Lawyer",
      replyto: data.email || undefined,
      Nombre: data.nombre,
      Teléfono: data.telefono,
      Correo: data.email || "(no indicó)",
      "Área legal": data.area,
      Mensaje: data.mensaje
    })
  });
  const json = await res.json().catch(() => ({}));
  return json.success === true;
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

/* ---- Botón "volver arriba" ---- */
function initBackToTop() {
  const btn = document.getElementById("toTop");
  if (!btn) return;
  const alternar = () => btn.classList.toggle("show", window.scrollY > 400);
  window.addEventListener("scroll", alternar, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  alternar();
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

/* ---- Partículas interactivas (estilo antigravity) ----
   Pequeños trazos dorados que se mueven solos y reaccionan al mouse:
   cuando el cursor se acerca, los empuja; luego vuelven a su deriva suave. */
function initParticles() {
  const c = document.getElementById("particles");
  if (!c) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = c.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const R = 150;          // radio de influencia del mouse
  const FUERZA = 1.1;     // intensidad del empuje
  const mouse = { x: -9999, y: -9999, activo: false };
  let w, h, parts;

  function crear() {
    const ang = Math.random() * Math.PI * 2;
    const sp = 0.10 + Math.random() * 0.22;      // deriva base (nunca se detiene)
    return {
      x: Math.random() * w, y: Math.random() * h,
      bvx: Math.cos(ang) * sp, bvy: Math.sin(ang) * sp,
      pvx: 0, pvy: 0,                             // empuje del mouse (se disipa)
      len: 3 + Math.random() * 6,
      a: 0.22 + Math.random() * 0.45
    };
  }
  function resize() {
    w = window.innerWidth || document.documentElement.clientWidth;
    h = window.innerHeight || document.documentElement.clientHeight;
    if (!w || !h) { requestAnimationFrame(resize); return; }  // aún sin layout: reintenta
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + "px"; c.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(140, Math.round((w * h) / 13000));
    parts = Array.from({ length: n }, crear);
  }

  function draw() {
    if (!parts) { requestAnimationFrame(draw); return; }  // espera a tener partículas
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      if (mouse.activo) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R) * FUERZA;
          p.pvx += (dx / d) * f; p.pvy += (dy / d) * f;
        }
      }
      p.pvx *= 0.9; p.pvy *= 0.9;                 // el empuje se disipa
      const vx = p.bvx + p.pvx, vy = p.bvy + p.pvy;
      p.x += vx; p.y += vy;

      // envolver bordes
      if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
      if (p.y < -12) p.y = h + 12; else if (p.y > h + 12) p.y = -12;

      // trazo orientado según su movimiento
      const vlen = Math.hypot(vx, vy) || 1;
      const L = p.len + Math.min(Math.hypot(p.pvx, p.pvy) * 6, 14); // se estira al ser empujado
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (vx / vlen) * L, p.y + (vy / vlen) * L);
      ctx.strokeStyle = `rgba(226,184,79,${p.a})`;
      ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  if (!reduce) {
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.activo = true; }, { passive: true });
    window.addEventListener("mouseleave", () => { mouse.activo = false; });
  }
  draw();
}

/* ---- Arranque ---- */
(async function () {
  document.getElementById("year").textContent = new Date().getFullYear();
  initMenu();
  initAdminAcceso();
  initBackToTop();
  initParticles();
  initFormulario();
  await initFirebase();
  const cfg = await cargarConfig();
  aplicar(cfg);
})();
