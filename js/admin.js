/* ============================================================
   admin.js — Panel de administración (Firebase)
   - Login con Email/Password (Firebase Auth)
   - Editar datos, marca, servicios, valores  (Firestore: config/site)
   - Subir logo y foto (Firebase Storage)
   - Ver solicitudes de cotización (Firestore: solicitudes)
   ============================================================ */

import { firebaseConfig, firebaseListo } from "./firebase-config.js";
import { DEFAULTS } from "./defaults.js";

const CDN = "https://www.gstatic.com/firebasejs/10.12.2/";
let app, auth, db, storage, cfgActual = { ...DEFAULTS };

/* ============================================================
   ⚠️ CORREOS ADMINISTRADORES PERMITIDOS
   Solo estos correos pueden entrar al panel y editar el sitio,
   sin importar si entran con contraseña o con Google.
   Deben coincidir EXACTAMENTE con los correos de las cuentas.
   (Esta lista también debe estar en firestore.rules y storage.rules)
   ============================================================ */
const ADMIN_EMAILS = [
  "abogada.yezubey.calvo@gmail.com",   // Yezubey
  "pablobatista75@gmail.com"           // Pablo (administrador técnico)
];
const esAdminEmail = (email) => ADMIN_EMAILS.map(e => e.toLowerCase()).includes((email || "").toLowerCase());

/* ---------- Utilidades UI ---------- */
const $ = (id) => document.getElementById(id);
function toast(msg, ok = true) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast " + (ok ? "ok" : "err");
  setTimeout(() => (t.className = "toast"), 3200);
}

/* ---------- Init Firebase ---------- */
async function init() {
  if (!firebaseListo) {
    $("noFirebase").classList.remove("hidden");
    return;
  }
  const { initializeApp } = await import(CDN + "firebase-app.js");
  const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
          GoogleAuthProvider, signInWithPopup } = await import(CDN + "firebase-auth.js");
  const { getFirestore } = await import(CDN + "firebase-firestore.js");
  const { getStorage } = await import(CDN + "firebase-storage.js");

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  const err = $("loginErr");
  const mostrarError = (msg) => { err.className = "form-msg err"; err.textContent = msg; };

  // Login con correo y contraseña
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    err.className = "form-msg";
    try {
      await signInWithEmailAndPassword(auth, $("email").value, $("password").value);
    } catch (ex) {
      mostrarError("Correo o contraseña incorrectos.");
    }
  });

  // Login con Google
  $("googleBtn").addEventListener("click", async () => {
    err.className = "form-msg";
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (ex) {
      if (ex.code !== "auth/popup-closed-by-user" && ex.code !== "auth/cancelled-popup-request") {
        mostrarError("No se pudo iniciar sesión con Google.");
      }
    }
  });

  $("logout").addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, (user) => {
    if (user && esAdminEmail(user.email)) {
      // Usuario autorizado
      $("loginView").classList.add("hidden");
      $("panelView").classList.remove("hidden");
      cargarTodo();
    } else if (user) {
      // Autenticado pero NO autorizado -> cerrar sesión
      signOut(auth);
      $("panelView").classList.add("hidden");
      $("loginView").classList.remove("hidden");
      mostrarError("Esta cuenta no tiene permiso para administrar el sitio.");
    } else {
      // Sin sesión
      $("panelView").classList.add("hidden");
      $("loginView").classList.remove("hidden");
    }
  });
}

/* ---------- Cargar datos existentes ---------- */
async function cargarTodo() {
  const { doc, getDoc } = await import(CDN + "firebase-firestore.js");
  try {
    const snap = await getDoc(doc(db, "config", "site"));
    cfgActual = snap.exists() ? { ...DEFAULTS, ...snap.data() } : { ...DEFAULTS };
  } catch (e) {
    cfgActual = { ...DEFAULTS };
  }
  pintarFormulario();
  cargarSolicitudes();
}

function pintarFormulario() {
  const c = cfgActual;
  const set = (id, val) => { const el = $(id); if (el) el.value = val ?? ""; };
  set("f-nombre", c.nombre); set("f-profesion", c.profesion); set("f-eslogan", c.eslogan);
  set("f-descripcion", c.descripcion);
  set("f-aniosExperiencia", c.aniosExperiencia); set("f-casosAtendidos", c.casosAtendidos);
  set("f-telefono", c.telefono); set("f-whatsapp", c.whatsapp); set("f-email", c.email);
  set("f-instagram", c.instagram); set("f-ubicacion", c.ubicacion);
  set("f-colorPrimario", c.colorPrimario || "#0f2a6b");
  set("f-colorAcento", c.colorAcento || "#e2b84f");
  set("f-logoUrl", c.logoUrl);
  set("f-fotoUrl", c.fotoUrl);

  vistaPrevia("f-logoUrl", "logoPrev");
  vistaPrevia("f-fotoUrl", "fotoPrev");

  pintarServicios(c.servicios || []);
  pintarValores(c.valores || []);
  pintarSecciones(c.secciones && c.secciones.length ? c.secciones : DEFAULTS.secciones);
}

/* Muestra la vista previa de una imagen a partir del enlace/ruta escrito */
function vistaPrevia(inputId, imgId) {
  const input = $(inputId), img = $(imgId);
  if (!input || !img) return;
  const actualizar = () => {
    const url = input.value.trim();
    if (!url) { img.classList.add("hidden"); return; }
    img.onload = () => img.classList.remove("hidden");
    img.onerror = () => img.classList.add("hidden");
    img.src = url;
  };
  actualizar();
  input.oninput = actualizar;
}

/* ---------- Secciones (header, orden, visibilidad y textos) ---------- */
const NOMBRE_SECCION = {
  "servicios": "⚖️ Servicios",
  "sobre-mi": "👩‍⚖️ Sobre mí",
  "valores": "✨ ¿Por qué elegirme?",
  "cotizar": "📨 Contacto / Cotizar"
};

function pintarSecciones(arr) {
  const cont = $("seccionesList");
  cont.innerHTML = "";
  arr.forEach(s => cont.appendChild(itemSeccion(s)));
  actualizarBotonesOrden();
}

function itemSeccion(s) {
  const d = document.createElement("div");
  d.className = "item-edit";
  d.dataset.id = s.id;
  const titulo = NOMBRE_SECCION[s.id] || s.id;
  const checked = s.visible === false ? "" : "checked";
  d.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <strong style="font-family:var(--font-serif);color:var(--accent-2)">${titulo}</strong>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="add-btn s-up" type="button" title="Subir">▲</button>
        <button class="add-btn s-down" type="button" title="Bajar">▼</button>
        <label style="display:flex;align-items:center;gap:6px;margin:0;color:var(--text-dim);font-size:.85rem">
          <input class="s-visible" type="checkbox" ${checked} style="width:auto"/> Mostrar
        </label>
      </div>
    </div>
    <div class="field" style="margin:0 0 10px"><label>Nombre en el menú (header)</label><input class="s-nav" value="${attr(s.nav)}" /></div>
    <div class="row3" style="grid-template-columns:1fr 1fr">
      <div class="field" style="margin:0"><label>Título pequeño (arriba)</label><input class="s-eyebrow" value="${attr(s.eyebrow)}" /></div>
      <div class="field" style="margin:0"><label>Título grande</label><input class="s-titulo" value="${attr(s.titulo)}" /></div>
    </div>
    <div class="field" style="margin:10px 0 0"><label>Descripción / texto</label><textarea class="s-desc">${escapeText(s.descripcion)}</textarea></div>`;

  d.querySelector(".s-up").onclick = () => { if (d.previousElementSibling) { d.parentNode.insertBefore(d, d.previousElementSibling); actualizarBotonesOrden(); } };
  d.querySelector(".s-down").onclick = () => { if (d.nextElementSibling) { d.parentNode.insertBefore(d.nextElementSibling, d); actualizarBotonesOrden(); } };
  return d;
}

function actualizarBotonesOrden() {
  const items = [...document.querySelectorAll("#seccionesList .item-edit")];
  items.forEach((it, i) => {
    it.querySelector(".s-up").disabled = (i === 0);
    it.querySelector(".s-down").disabled = (i === items.length - 1);
    it.querySelector(".s-up").style.opacity = (i === 0) ? ".35" : "1";
    it.querySelector(".s-down").style.opacity = (i === items.length - 1) ? ".35" : "1";
  });
}

/* ---------- Servicios (lista editable) ---------- */
function pintarServicios(arr) {
  const cont = $("serviciosList");
  cont.innerHTML = "";
  arr.forEach((s, i) => cont.appendChild(itemServicio(s, i)));
}
function itemServicio(s = { icono: "⚖️", titulo: "", descripcion: "" }, i) {
  const d = document.createElement("div");
  d.className = "item-edit";
  d.innerHTML = `
    <div class="row3">
      <div class="field" style="margin:0"><label>Ícono</label><input class="s-icono" value="${attr(s.icono)}" /></div>
      <div class="field" style="margin:0"><label>Título</label><input class="s-titulo" value="${attr(s.titulo)}" /></div>
    </div>
    <div class="field" style="margin:10px 0 0"><label>Descripción</label><textarea class="s-desc">${escapeText(s.descripcion)}</textarea></div>
    <div style="text-align:right;margin-top:8px"><button class="del-btn" type="button">Eliminar</button></div>`;
  d.querySelector(".del-btn").onclick = () => d.remove();
  return d;
}

/* ---------- Valores (lista editable) ---------- */
function pintarValores(arr) {
  const cont = $("valoresList");
  cont.innerHTML = "";
  arr.forEach((v) => cont.appendChild(itemValor(v)));
}
function itemValor(v = { titulo: "", descripcion: "" }) {
  const d = document.createElement("div");
  d.className = "item-edit";
  d.innerHTML = `
    <div class="field" style="margin:0"><label>Título</label><input class="v-titulo" value="${attr(v.titulo)}" /></div>
    <div class="field" style="margin:10px 0 0"><label>Descripción</label><textarea class="v-desc">${escapeText(v.descripcion)}</textarea></div>
    <div style="text-align:right;margin-top:8px"><button class="del-btn" type="button">Eliminar</button></div>`;
  d.querySelector(".del-btn").onclick = () => d.remove();
  return d;
}

const attr = (s = "") => String(s).replace(/"/g, "&quot;");
const escapeText = (s = "") => String(s).replace(/</g, "&lt;");

/* ---------- Recolectar y guardar ---------- */
function recolectar() {
  const servicios = [...document.querySelectorAll("#serviciosList .item-edit")].map(d => ({
    icono: d.querySelector(".s-icono").value.trim() || "⚖️",
    titulo: d.querySelector(".s-titulo").value.trim(),
    descripcion: d.querySelector(".s-desc").value.trim()
  })).filter(s => s.titulo);

  const valores = [...document.querySelectorAll("#valoresList .item-edit")].map(d => ({
    titulo: d.querySelector(".v-titulo").value.trim(),
    descripcion: d.querySelector(".v-desc").value.trim()
  })).filter(v => v.titulo);

  const secciones = [...document.querySelectorAll("#seccionesList .item-edit")].map(d => ({
    id: d.dataset.id,
    nav: d.querySelector(".s-nav").value.trim(),
    visible: d.querySelector(".s-visible").checked,
    eyebrow: d.querySelector(".s-eyebrow").value.trim(),
    titulo: d.querySelector(".s-titulo").value.trim(),
    descripcion: d.querySelector(".s-desc").value.trim()
  }));

  return {
    nombre: $("f-nombre").value.trim(),
    profesion: $("f-profesion").value.trim(),
    eslogan: $("f-eslogan").value.trim(),
    descripcion: $("f-descripcion").value.trim(),
    secciones,
    aniosExperiencia: $("f-aniosExperiencia").value.trim(),
    casosAtendidos: $("f-casosAtendidos").value.trim(),
    telefono: $("f-telefono").value.trim(),
    whatsapp: $("f-whatsapp").value.replace(/\D/g, ""),
    email: $("f-email").value.trim(),
    instagram: $("f-instagram").value.replace(/@/g, "").trim(),
    ubicacion: $("f-ubicacion").value.trim(),
    colorPrimario: $("f-colorPrimario").value,
    colorAcento: $("f-colorAcento").value,
    logoUrl: $("f-logoUrl").value.trim(),
    fotoUrl: $("f-fotoUrl").value.trim(),
    servicios, valores
  };
}

async function guardar() {
  const btn = $("saveBtn");
  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    // Si se eligió un archivo, se sube a Storage y su enlace llena el campo de URL
    const logoFile = $("f-logoFile").files[0];
    const fotoFile = $("f-fotoFile").files[0];
    if (logoFile) $("f-logoUrl").value = await subirImagen(logoFile, "logo");
    if (fotoFile) $("f-fotoUrl").value = await subirImagen(fotoFile, "foto");

    const datos = recolectar();
    const { doc, setDoc } = await import(CDN + "firebase-firestore.js");
    await setDoc(doc(db, "config", "site"), datos, { merge: true });
    cfgActual = { ...cfgActual, ...datos };
    toast("✅ Cambios guardados correctamente");
    $("f-logoFile").value = ""; $("f-fotoFile").value = "";
    vistaPrevia("f-logoUrl", "logoPrev");
    vistaPrevia("f-fotoUrl", "fotoPrev");
  } catch (e) {
    console.error(e);
    toast("❌ Error al guardar: " + (e.message || e), false);
  }
  btn.disabled = false; btn.textContent = "💾 Guardar cambios";
}

/* Sube una imagen a Firebase Storage y devuelve su enlace público.
   Requiere tener Storage activado y las reglas de storage.rules publicadas. */
async function subirImagen(file, nombre) {
  const { ref, uploadBytes, getDownloadURL } = await import(CDN + "firebase-storage.js");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const r = ref(storage, `sitio/${nombre}.${ext}`);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

/* ---------- Solicitudes ---------- */
async function cargarSolicitudes() {
  const cont = $("solList");
  try {
    const { collection, getDocs, query, orderBy } = await import(CDN + "firebase-firestore.js");
    const q = query(collection(db, "solicitudes"), orderBy("fecha", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) { cont.innerHTML = `<p class="hint">Aún no hay solicitudes.</p>`; $("solCount").textContent = ""; return; }

    let nuevos = 0;
    cont.innerHTML = "";
    snap.forEach(docu => {
      const s = docu.data();
      if (!s.leido) nuevos++;
      const fecha = s.fecha?.toDate ? s.fecha.toDate().toLocaleString("es-PA") : "";
      const wa = "https://wa.me/" + (s.telefono || "").replace(/\D/g, "");
      const div = document.createElement("div");
      div.className = "sol" + (s.leido ? "" : " nuevo");
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <strong>${escapeText(s.nombre || "Sin nombre")}</strong>
          ${s.leido ? "" : '<span class="badge">NUEVO</span>'}
        </div>
        <div class="meta">
          <span>📞 ${escapeText(s.telefono || "-")}</span>
          ${s.email ? `<span>✉️ ${escapeText(s.email)}</span>` : ""}
          <span>⚖️ ${escapeText(s.area || "-")}</span>
          ${fecha ? `<span>🕒 ${fecha}</span>` : ""}
        </div>
        <p style="margin:8px 0;color:var(--text)">${escapeText(s.mensaje || "")}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn-wa" style="padding:7px 14px" target="_blank" href="${wa}">Responder por WhatsApp</a>
          ${s.leido ? "" : `<button class="add-btn btn-leido" data-id="${docu.id}">Marcar como leído</button>`}
          <button class="del-btn btn-del" data-id="${docu.id}">Eliminar</button>
        </div>`;
      cont.appendChild(div);
    });

    $("solCount").innerHTML = nuevos ? `<span class="badge">${nuevos}</span>` : "";
    // Acciones
    cont.querySelectorAll(".btn-leido").forEach(b => b.onclick = () => marcarLeido(b.dataset.id));
    cont.querySelectorAll(".btn-del").forEach(b => b.onclick = () => borrarSolicitud(b.dataset.id));
  } catch (e) {
    console.error(e);
    cont.innerHTML = `<p class="hint">No se pudieron cargar las solicitudes. Revisa las reglas de Firestore.</p>`;
  }
}

async function marcarLeido(id) {
  const { doc, updateDoc } = await import(CDN + "firebase-firestore.js");
  await updateDoc(doc(db, "solicitudes", id), { leido: true });
  cargarSolicitudes();
}
async function borrarSolicitud(id) {
  if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer.")) return;
  const { doc, deleteDoc } = await import(CDN + "firebase-firestore.js");
  await deleteDoc(doc(db, "solicitudes", id));
  toast("Solicitud eliminada");
  cargarSolicitudes();
}

/* ---------- Tabs ---------- */
function initTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const name = tab.dataset.tab;
      document.querySelectorAll(".tab-content").forEach(c => c.classList.toggle("hidden", c.dataset.content !== name));
      // La barra de guardar no aplica a solicitudes
      const sb = document.querySelector("[data-savebar]");
      if (sb) sb.style.display = name === "solicitudes" ? "none" : "block";
    });
  });
}

/* ---------- Arranque ---------- */
initTabs();
document.addEventListener("click", (e) => {
  if (e.target.id === "addServicio") $("serviciosList").appendChild(itemServicio(undefined));
  if (e.target.id === "addValor") $("valoresList").appendChild(itemValor(undefined));
  if (e.target.id === "saveBtn") guardar();
});
init();
