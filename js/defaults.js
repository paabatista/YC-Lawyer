/* ============================================================
   CONTENIDO POR DEFECTO
   Se usa si Firebase no está configurado o si aún no hay datos.
   Yezubey puede editar todo esto desde el panel /admin.html
   ============================================================ */

export const DEFAULTS = {
  // Datos principales / Hero
  nombre: "Lcda. Yezubey Calvo",
  profesion: "Abogada",
  eslogan: "Asesoría legal con compromiso, ética y cercanía",
  descripcion:
    "Acompaño a mis clientes en cada paso de su proceso legal, con atención personalizada, comunicación clara y total confidencialidad. Tu tranquilidad es mi prioridad.",

  // Contacto
  telefono: "+507 6831-5054",
  whatsapp: "50768315054",            // solo dígitos, con código de país
  email: "abogada.yezubey.calvo@gmail.com",
  instagram: "Yc.lawyer",             // sin el @
  ubicacion: "Panamá",

  // Identidad visual (editable desde el panel)
  colorPrimario: "#0f2a6b",
  colorAcento: "#e2b84f",
  logoUrl: "",                        // si está vacío usa assets/logo.svg
  fotoUrl: "",                        // foto para la sección "Sobre mí"

  // Estadísticas de "Sobre mí"
  aniosExperiencia: "5+",
  casosAtendidos: "100+",

  /* ---------------------------------------------------------
     SECCIONES: controlan el header (nav), el orden, si se
     muestran o no, y los textos de cabecera de cada sección.
     El ORDEN de este arreglo define el orden en la web y en el menú.
     'id' es fijo (no cambiar); lo demás es editable desde el panel.
     --------------------------------------------------------- */
  secciones: [
    {
      id: "servicios",
      nav: "Servicios",
      visible: true,
      eyebrow: "Áreas de práctica",
      titulo: "Servicios legales",
      descripcion: "Soluciones legales claras y efectivas en las áreas que más importan."
    },
    {
      id: "sobre-mi",
      nav: "Sobre mí",
      visible: true,
      eyebrow: "Sobre mí",
      titulo: "Lcda. Yezubey Calvo",
      descripcion: "Soy la Lcda. Yezubey Calvo, abogada dedicada a brindar soluciones legales efectivas y humanas. Creo en el trato honesto, la puntualidad y en explicar cada caso con palabras sencillas para que mis clientes siempre entiendan sus opciones."
    },
    {
      id: "valores",
      nav: "¿Por qué yo?",
      visible: true,
      eyebrow: "Mi compromiso",
      titulo: "¿Por qué elegirme?",
      descripcion: ""
    },
    {
      id: "cotizar",
      nav: "Contacto",
      visible: true,
      eyebrow: "Contacto",
      titulo: "Cotiza tu caso",
      descripcion: "Cuéntame tu situación y te responderé lo antes posible. Puedes escribirme directamente por WhatsApp o llenar el formulario."
    }
  ],

  // Áreas de práctica / servicios (tarjetas)
  servicios: [
    { icono: "👨‍👩‍👧", titulo: "Derecho de Familia",   descripcion: "Alimentos, guarda y crianza, y demás trámites familiares." },
    { icono: "💼", titulo: "Derecho Laboral",      descripcion: "Permisos de trabajo y asuntos laborales." },
    { icono: "📜", titulo: "Derecho Civil",        descripcion: "Sucesiones, demandas y asuntos civiles." },
    { icono: "⚖️", titulo: "Derecho Penal",        descripcion: "Querellas, defensa y representación en procesos penales." },
    { icono: "🏢", titulo: "Derecho Comercial",    descripcion: "Constitución de sociedades y asesoría comercial." },
    { icono: "🛂", titulo: "Derecho Migratorio",   descripcion: "Residencia, levantamiento y trámites migratorios." }
  ],

  // Valores / por qué elegirla (tarjetas)
  valores: [
    { titulo: "Compromiso",        descripcion: "Cada caso recibe dedicación total y seguimiento constante." },
    { titulo: "Confidencialidad",  descripcion: "Tu información y tu caso están siempre protegidos." },
    { titulo: "Cercanía",          descripcion: "Comunicación clara, sin tecnicismos innecesarios." },
    { titulo: "Ética",             descripcion: "Actuación transparente y honesta en todo momento." }
  ]
};
