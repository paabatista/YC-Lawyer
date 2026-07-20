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
  apiKey: "PON_AQUI_TU_API_KEY",
  authDomain: "PON_AQUI.firebaseapp.com",
  projectId: "PON_AQUI_TU_PROJECT_ID",
  storageBucket: "PON_AQUI.appspot.com",
  messagingSenderId: "PON_AQUI",
  appId: "PON_AQUI"
};

// Detecta si Firebase todavía no fue configurado (para usar el modo por defecto)
export const firebaseListo = !firebaseConfig.apiKey.startsWith("PON_AQUI");
