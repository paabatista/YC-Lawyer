/* ============================================================
   CONFIGURACIÓN DE FIREBASE
   ------------------------------------------------------------
   1) Entra a https://console.firebase.google.com
   2) Crea un proyecto (ej: "yc-lawyer")
   3) Agrega una App Web (</>) y copia el objeto firebaseConfig
   4) Pega los valores REALES abajo, reemplazando los "PON_AQUI_..."
   5) En la consola habilita:
        - Authentication -> Sign-in method -> Email/Password
        - Firestore Database (modo producción) y aplica firestore.rules
        - Storage (para subir el logo)
   6) En Authentication -> Users, crea el usuario de Yezubey
        (correo + contraseña) para que entre a /admin.html

   Mientras estos valores sean los de ejemplo, la web funciona
   igual con el contenido por defecto (js/defaults.js).
   ============================================================ */

export const firebaseConfig = {
  apiKey: "AIzaSyCiuwRyHBkw7fftMKtV6-MdfF60q1VuI-w",
  authDomain: "yc-lawyer.firebaseapp.com",
  projectId: "yc-lawyer",
  storageBucket: "yc-lawyer.firebasestorage.app",
  messagingSenderId: "331741072202",
  appId: "1:331741072202:web:c3fb4ef472f8d282eecfb3",
  measurementId: "G-N8PENZMDWZ"
};

// Detecta si Firebase todavía no fue configurado (para usar el modo por defecto)
export const firebaseListo = !firebaseConfig.apiKey.startsWith("PON_AQUI");

/* ============================================================
   ENVÍO DE CORREO DEL FORMULARIO (Web3Forms — gratis, sin servidor)
   ------------------------------------------------------------
   Para que al enviar una cotización le llegue un correo a la abogada:
   1) Entra a https://web3forms.com
   2) Escribe el correo de la abogada (abogada.yezubey.calvo@gmail.com)
      y presiona "Create Access Key".
   3) Le llegará una "Access Key" a ese correo. Pégala abajo.
   (La Access Key es pública y segura de publicar; NO es una contraseña.)

   Si lo dejas vacío, la solicitud igual se guarda en el panel (Firestore),
   pero no se enviará el correo automático.
   ============================================================ */
export const WEB3FORMS_KEY = "";
