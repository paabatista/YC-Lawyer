# YC Lawyer — Sitio web de la Lcda. Yezubey Calvo

Sitio web informativo, moderno y responsivo para una abogada, con:

- 🎨 Branding fiel a la tarjeta: **azul marino profundo + dorado**, logo "YC Lawyer" con balanza.
- 🌌 **Fondos dinámicos** (manchas azules en movimiento + partículas doradas suaves).
- 📱 Diseño **responsivo** (se ve bien en celular y computadora).
- 💬 **Cotización por WhatsApp**: el formulario abre WhatsApp con el mensaje listo.
- 📨 Guarda cada solicitud en el **panel de administración** (y opcionalmente envía correo).
- 🔐 **Panel de administración** (`/admin.html`) con Firebase para que Yezubey edite **sin tocar código**:
  - **Datos**: nombre, profesión, eslogan, descripción, estadísticas y contacto.
  - **Secciones**: qué secciones se muestran, **su orden**, el **nombre en el menú (header)**
    de cada una, y sus títulos y textos.
  - **Marca**: colores, logo y foto.
  - **Servicios** y **Valores**: agregar, editar o eliminar tarjetas.
  - **Solicitudes**: ver y responder las cotizaciones recibidas.

---

## 📂 Estructura

```
Web de Yesubey/
├── index.html            → Página pública
├── admin.html            → Panel de administración
├── css/styles.css        → Estilos y animaciones
├── js/
│   ├── firebase-config.js → ⚠️ Pega aquí tu configuración de Firebase
│   ├── defaults.js        → Contenido por defecto (funciona sin Firebase)
│   ├── site.js            → Lógica del sitio público
│   └── admin.js           → Lógica del panel
├── assets/logo.svg        → Logo por defecto (dorado)
├── firestore.rules        → Reglas de seguridad de la base de datos
├── storage.rules          → Reglas de seguridad para imágenes
└── README.md
```

> **La web funciona de una vez**, incluso sin Firebase: muestra el contenido de `js/defaults.js`
> y el botón de WhatsApp funciona. Firebase solo se necesita para el **panel de edición**.

---

## 🚀 Paso 1 — Configurar Firebase (para el panel de edición)

1. Entra a <https://console.firebase.google.com> e inicia un **proyecto nuevo** (ej: `yc-lawyer`).
2. Dentro del proyecto, haz clic en el ícono **`</>`** (Web) para **agregar una app web**.
3. Copia el objeto `firebaseConfig` que te muestra y **pégalo en `js/firebase-config.js`**
   reemplazando los valores `PON_AQUI_...`.
4. En el menú lateral, activa estos servicios:
   - **Authentication** → *Sign-in method* → habilita **Correo electrónico/Contraseña**
     **y** también **Google** (elige un correo de soporte al activarlo).
     Si vas a usar contraseña, en la pestaña **Users** crea el usuario de Yezubey.
   - **Firestore Database** → *Crear base de datos* (modo producción).
     Ve a la pestaña **Reglas** y pega el contenido de `firestore.rules`.
   - **Storage** → *Comenzar* (modo producción). En **Reglas** pega el contenido de
     `storage.rules`. *(Solo hace falta si se van a subir imágenes desde el panel; si solo
     usas archivos locales en `assets/`, puedes dejarlo para después.)*

5. Listo. Entra a `admin.html`, inicia sesión (correo o Google) y edita todo.

### 🖼️ Logo y foto (3 formas)

- **Archivo local (por defecto):** el logo usa `assets/logo.svg` y la foto de "Sobre mí"
  usa **`assets/foto.jpg`**. Pon la foto ahí en el proyecto y aparece automáticamente.
  Si no hay foto, se muestra un marco elegante (nunca una imagen rota).
- **Enlace:** en el panel (pestaña **Marca**) pega la URL de una imagen.
- **Subir al panel:** en **Marca** elige un archivo → se guarda en **Firebase Storage** y
  se usa automáticamente (requiere Storage activado y `storage.rules` publicadas).

### 🔑 Quién puede administrar (importante)

Como se puede entrar con Google, **solo los correos de una lista blanca** pueden editar.
Esa lista está en **3 lugares** y debe ser **idéntica** en los tres:

- `js/admin.js` → constante `ADMIN_EMAILS`
- `firestore.rules` → función `esAdmin()`
- `storage.rules` → función `esAdmin()`

Por defecto incluye `abogada.yezubey.calvo@gmail.com` y `pablobatista75@gmail.com`.
Para agregar/quitar administradores, edita esos 3 sitios con el mismo correo y vuelve a
subir el sitio (y a publicar las reglas en Firebase). Cualquier otra cuenta que intente
entrar será rechazada automáticamente.

---

## 🌐 Paso 2 — Subir a GitHub y publicar (GitHub Pages, gratis)

```bash
cd "C:/Users/pablo/OneDrive/Documentos/webs/Web de Yesubey"
git init
git add .
git commit -m "Sitio web YC Lawyer"
git branch -M main
git remote add origin https://github.com/USUARIO/yc-lawyer.git
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Source: `main` / root → Save**.
En 1–2 minutos tu web estará en `https://USUARIO.github.io/yc-lawyer/`.

> ⚠️ **Importante:** en Firebase → *Authentication → Settings → Authorized domains*,
> agrega tu dominio de GitHub Pages (`USUARIO.github.io`) para que el login funcione.

Otras opciones de publicación igual de fáciles: **Netlify** o **Vercel** (arrastrar la carpeta).

---

## 📧 (Opcional) Recibir las cotizaciones también por CORREO

El sitio ya guarda cada solicitud en el panel y abre WhatsApp. Si además quieres un
**correo automático**, usa [EmailJS](https://www.emailjs.com) (gratis):

1. Crea cuenta en EmailJS, un *Service* y un *Template*.
2. En `index.html`, antes de `</body>`, agrega:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   <script>
     emailjs.init("TU_PUBLIC_KEY");
     window.EMAILJS = { serviceId: "TU_SERVICE_ID", templateId: "TU_TEMPLATE_ID", publicKey: "TU_PUBLIC_KEY" };
   </script>
   ```
3. En el template de EmailJS usa las variables: `nombre`, `telefono`, `email`, `area`, `mensaje`, `to_email`.

---

## ✏️ Cómo edita Yezubey su web

1. **Acceso oculto:** en la web pública, hacer **doble clic sobre el logo** (arriba o el del
   inicio) abre el panel. No hay ningún enlace visible de "administración", para que ningún
   visitante curioso intente entrar. (También se puede abrir directo con `tu-sitio.com/admin.html`.)
2. Inicia sesión con su correo/contraseña **o con Google**.
3. Cambia lo que quiera (datos, secciones, colores, logo, servicios…) y presiona **💾 Guardar cambios**.
4. Los cambios aparecen al instante en la web pública. También ve las **solicitudes** recibidas.

---

## 🎨 Datos actuales (por defecto)

- **Nombre:** Lcda. Yezubey Calvo
- **Teléfono/WhatsApp:** +507 6831-5054
- **Correo:** abogada.yezubey.calvo@gmail.com
- **Instagram:** @Yc.lawyer

Todo esto es editable desde el panel.
