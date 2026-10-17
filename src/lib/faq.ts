import { CFG, forecast, fmtTime, LEVELS, type Sim } from "@/hooks/use-reservoir-sim";

// Preguntas frecuentes del asistente. Respuestas escritas para vecinos: cortas, claras y accionables.
// Las que dependen del estado del bordo se calculan con las lecturas en vivo.

export interface Faq {
  id: string;
  q: string;
  keywords: string[];
  a: string | ((sim: Sim) => string);
  action?: { label: string; target: string };
  category: "Ahora" | "Alertas" | "Seguridad" | "El proyecto" | "Medio ambiente" | "Participa";
}

export const FAQS: Faq[] = [
  {
    id: "estado",
    category: "Ahora",
    q: "¿Cómo está el bordo ahora?",
    keywords: ["como esta", "ahora", "estado", "nivel", "lleno", "llenado", "bordo hoy", "actual", "cuanto tiene"],
    a: (sim) => {
      const f = forecast(sim.last, sim.rate);
      const lv = LEVELS[sim.lvl];
      return `A las ${fmtTime(sim.now)} el bordo está al ${Math.min(sim.last.p, 100).toFixed(0)}% (${sim.last.L.toFixed(0)} de ${CFG.NIVEL_MAX} cm).\n\nNivel de alerta: ${lv.name.toUpperCase()}.\n${lv.resident}\n\n${f.label}: ${f.value} (${f.sub}).`;
    },
    action: { label: "Ver el mapa", target: "mapa" },
  },
  {
    id: "lluvia-ahora",
    category: "Ahora",
    q: "¿Está lloviendo mucho?",
    keywords: ["lloviendo", "lluvia", "llueve", "llover", "pronostico", "tormenta hoy", "milimetros", "mm"],
    a: (sim) =>
      `El pluviómetro marca ${sim.last.r.toFixed(1)} mm/h ahora. En la última hora cayeron ${sim.rain1h.toFixed(1)} mm y en 24 horas ${sim.rain24h.toFixed(1)} mm.\n\nComo referencia, la tormenta de agosto de 2025 dejó ${CFG.RECORD_MM} mm. Para el pronóstico del día consulta al Servicio Meteorológico Nacional (SMN).`,
  },
  {
    id: "colores",
    category: "Alertas",
    q: "¿Qué significa cada color de alerta?",
    keywords: ["color", "colores", "semaforo", "significa", "verde", "amarillo", "naranja", "rojo", "niveles"],
    a: "Usamos un semáforo según qué tan lleno está el bordo:\n\n• Verde (menos de 60%): todo normal.\n• Amarillo (60% o más): mantente atento.\n• Naranja (80% o más): prepárate para salir si vives en zona baja.\n• Rojo (90% o más, o si el agua sube muy rápido): sal de las zonas bajas hacia el punto de reunión.",
    action: { label: "Qué hacer en cada alerta", target: "protocolo" },
  },
  {
    id: "amarilla",
    category: "Alertas",
    q: "¿Qué hago en alerta amarilla?",
    keywords: ["amarilla", "amarillo"],
    a: `${LEVELS[1].resident}\n\nNo hace falta salir de casa. Revisa que la coladera de tu calle no esté tapada, sin meterte a la corriente.`,
  },
  {
    id: "naranja",
    category: "Alertas",
    q: "¿Qué hago en alerta naranja?",
    keywords: ["naranja"],
    a: `${LEVELS[2].resident}\n\nSi tienes familiares mayores, niños pequeños o personas con discapacidad en casa, ayúdalos a prepararse desde ahora: son quienes más tiempo necesitan para salir.`,
    action: { label: "Ver la ruta en el mapa", target: "mapa" },
  },
  {
    id: "roja",
    category: "Alertas",
    q: "¿Qué hago en alerta roja?",
    keywords: ["roja", "rojo", "evacuar", "evacuacion", "salir", "emergencia ya"],
    a: `${LEVELS[3].resident}\n\n• Desconecta la luz y el gas si puedes hacerlo sin riesgo.\n• Lleva tu mochila de emergencia.\n• Ve a pie por la ruta marcada en verde en el mapa.\n• Avisa en el punto de reunión que llegaste para que el comité pase lista.`,
    action: { label: "Ver la ruta de evacuación", target: "mapa" },
  },
  {
    id: "recibir",
    category: "Alertas",
    q: "¿Cómo recibo las alertas en mi celular?",
    keywords: ["recibir", "recibo", "celular", "whatsapp", "sms", "telefono", "mensaje", "avisos", "suscribir", "grupo", "registrar"],
    a: "Cada alerta trae qué pasa, en qué colonias y de 2 a 4 pasos a seguir. Llega por:\n\n• WhatsApp y SMS, si diste tu número al comité (tienes que aceptar recibirlas).\n• El canal de Telegram de la colonia.\n• Esta página: aparece arriba de todo.\n• Perifoneo en las calles bajas.\n\nEn emergencias graves, Protección Civil puede pedir la alerta del Sistema Nacional a todos los celulares de la zona, aunque no tengan saldo.\n\nPara darte de alta, pide tu registro al comité vecinal de agua.",
  },
  {
    id: "actualiza",
    category: "Alertas",
    q: "¿Cada cuánto se actualizan los datos?",
    keywords: ["cada cuanto", "actualiza", "actualizan", "frecuencia", "tiempo real", "minutos"],
    a: "Los sensores mandan una lectura cada 5 minutos cuando el bordo está tranquilo, y cada 30 segundos cuando pasa del 60%. El tablero se actualiza solo, no necesitas recargar la página.",
  },
  {
    id: "punto-reunion",
    category: "Seguridad",
    q: "¿Dónde está el punto de reunión?",
    keywords: ["punto de reunion", "reunion", "reuno", "donde voy", "a donde", "donde ir", "refugio", "albergue", "ruta", "camino", "evacuo"],
    a: "En el mapa, el punto de reunión es el marcador azul al final de la línea verde punteada, que es la ruta de evacuación desde la zona baja.\n\nEn el piloto, la ubicación definitiva la acuerdan el comité y Protección Civil y se marca también en un mapa impreso en la colonia.",
    action: { label: "Abrir el mapa", target: "mapa" },
  },
  {
    id: "cruzar",
    category: "Seguridad",
    q: "¿Puedo cruzar una calle con agua?",
    keywords: ["cruzar", "corriente", "calle inundada", "auto", "carro", "coche", "manejar", "pasar"],
    a: "No. Unos 15 cm de agua en movimiento pueden tirar a una persona, y poca más puede arrastrar un auto. En agosto de 2025 hubo personas arrastradas por la corriente en el canal de Peñuelas.\n\nEspera a que baje el agua o busca otra ruta por calles altas.",
  },
  {
    id: "911",
    category: "Seguridad",
    q: "¿A quién llamo en una emergencia?",
    keywords: ["911", "emergencia", "llamar", "proteccion civil", "ayuda", "rescate", "atrapado", "herido"],
    a: "Si alguien está atrapado, herido o en peligro, llama al 911.\n\nAvisa también al grupo del comité vecinal para que Protección Civil sepa en qué calle estás.",
  },
  {
    id: "mochila",
    category: "Seguridad",
    q: "¿Qué llevo en la mochila de emergencia?",
    keywords: ["mochila", "kit", "llevar", "preparar", "documentos", "que necesito"],
    a: "Lo básico:\n\n• Documentos importantes en bolsa de plástico (INE, actas, recetas).\n• Medicinas de uso diario.\n• Agua y algo de comida que no se eche a perder.\n• Lámpara, pilas y cargador del celular.\n• Un cambio de ropa y una cobija ligera.\n• Silbato para pedir ayuda.",
  },
  {
    id: "agosto",
    category: "El proyecto",
    q: "¿Qué pasó en agosto de 2025?",
    keywords: ["agosto", "2025", "paso", "record", "146", "murieron", "inundacion pasada", "historia"],
    a: "Una tormenta de 146 mm (el récord anterior era de 110 mm) desbordó el canal de Peñuelas. Al menos dos personas murieron arrastradas por la corriente y se inundaron calles y viviendas en el norte de Querétaro.\n\nEl comité y Protección Civil reproducen esa tormenta en simulacros para revisar cuándo habría sonado cada alerta y qué mensaje habría recibido la gente.",
  },
  {
    id: "por-que",
    category: "El proyecto",
    q: "¿Por qué se inunda si ya hay bordos?",
    keywords: ["por que", "porque", "si ya hay", "bordos", "cuates", "dren", "obras", "no sirve"],
    a: "Un bordo no protege por sí solo. Pierde eficacia porque:\n\n• El azolve y la basura le quitan capacidad sin que se note.\n• No hay datos públicos del nivel ni de qué tan rápido se llena.\n• Se limpia después del desborde, no antes.\n• El suelo sellado manda más agua y más lodo.\n• Los vecinos no conocen su estado ni participan.\n\nVigía Pluvial ataca esas cinco causas.",
  },
  {
    id: "que-es",
    category: "El proyecto",
    q: "¿Qué es Vigía Pluvial?",
    keywords: ["que es", "vigia", "proyecto", "para que sirve", "quien", "quienes"],
    a: "Es un sistema para cuidar los bordos de retención de la zona: sensores que miden el nivel, la lluvia y la turbidez del agua; alertas por WhatsApp y SMS; obras verdes que reducen el agua que llega de golpe; y un comité vecinal que da mantenimiento.\n\nLo propone el equipo Cardenales de la Universidad Politécnica de Querétaro.",
  },
  {
    id: "bordo",
    category: "El proyecto",
    q: "¿Qué es un bordo de retención?",
    keywords: ["bordo de retencion", "que es un bordo", "reservorio", "vaso regulador", "presa"],
    a: "Es un depósito que guarda el agua de lluvia por un rato y la suelta despacio, para que no llegue toda junta a las calles y canales de abajo. Funciona bien solo si tiene espacio libre, por eso hay que quitarle el azolve y la basura antes de la temporada de lluvias.",
  },
  {
    id: "datos-reales",
    category: "El proyecto",
    q: "¿Los datos son reales?",
    keywords: ["reales", "real", "simulado", "simulacion", "verdad", "confiable", "falso"],
    a: "Por ahora no: este tablero muestra datos simulados para enseñar cómo funcionará. Cuando se instalen los sensores en el piloto, mostrará las lecturas reales de cada nodo.\n\nAun con sensores, el sistema reduce el riesgo pero no lo elimina. Sigue siempre las indicaciones de Protección Civil.",
  },
  {
    id: "sin-senal",
    category: "El proyecto",
    q: "¿Qué pasa si se va la luz o no hay señal?",
    keywords: ["luz", "apagon", "senal", "internet", "sin datos", "falla", "bateria", "solar"],
    a: "Los sensores funcionan con panel solar y batería para varios días nublados. Envían por LoRaWAN con respaldo 4G y SMS, y guardan las lecturas aunque se caiga la comunicación.\n\nSi tu celular no tiene señal, el comité también avisa casa por casa en alerta naranja y roja.",
  },
  {
    id: "azolve",
    category: "Medio ambiente",
    q: "¿Qué es el azolve?",
    keywords: ["azolve", "sedimento", "lodo", "tierra", "desazolve"],
    a: "Es la tierra, arena y lodo que la lluvia arrastra y que se acumula en el fondo del bordo. Cada camión de azolve es espacio que ya no queda para el agua, y el bordo se llena antes de lo previsto.\n\nEn este bordo de ejemplo el azolve ocupa cerca del 18% del volumen.",
  },
  {
    id: "turbidez",
    category: "Medio ambiente",
    q: "¿Qué es la turbidez?",
    keywords: ["turbidez", "ntu", "agua sucia", "turbia", "cafe"],
    a: (sim) =>
      `Es qué tan turbia viene el agua; se mide en NTU. Mientras más alta, más lodo trae la corriente. Ahora marca ${sim.last.turb.toFixed(0)} NTU en la entrada del bordo.\n\nSi en tormentas parecidas la turbidez baja después de construir las obras verdes, quiere decir que funcionan.`,
  },
  {
    id: "naturaleza",
    category: "Medio ambiente",
    q: "¿Cómo daña la naturaleza una inundación?",
    keywords: ["naturaleza", "ambiente", "ambiental", "dano", "contamina", "acuifero", "erosion", "ecologia"],
    a: "Además de casas y calles:\n\n• Erosiona el suelo de las partes altas.\n• El agua no se infiltra y el acuífero no se recarga.\n• Al desbordar, la lluvia se mezcla con drenaje y contamina calles y cauces.\n• Arrastra basura a los canales.\n• Deja charcos donde se cría el mosquito del dengue.",
    action: { label: "Ver el daño ambiental", target: "ambiente" },
  },
  {
    id: "verde",
    category: "Medio ambiente",
    q: "¿Qué es la infraestructura verde?",
    keywords: ["infraestructura verde", "jardin de lluvia", "jardines", "zanja", "humedal", "plantas", "arboles", "verde"],
    a: "Son obras con plantas y suelo que atrapan la lluvia donde cae: jardines de lluvia en camellones, zanjas con vegetación, pavimentos que dejan pasar el agua y un humedal que limpia el agua del bordo.\n\nAsí llega menos agua de golpe y más limpia, y una parte recarga el acuífero.",
  },
  {
    id: "dengue",
    category: "Medio ambiente",
    q: "¿El bordo puede traer mosquitos?",
    keywords: ["mosquito", "mosquitos", "dengue", "zancudo", "charco", "estancada"],
    a: "Sí, si el agua se queda estancada más de uno o dos días. Por eso el diseño busca que el bordo drene a tiempo y el comité vigila que no queden charcos.\n\nEn casa: voltea cubetas, tapa tinacos y limpia canaletas.",
  },
  {
    id: "beber",
    category: "Medio ambiente",
    q: "¿Puedo usar el agua del bordo?",
    keywords: ["beber", "tomar", "usar el agua", "potable", "regar", "lavar"],
    a: "No la tomes ni la uses para cocinar. El agua del bordo puede traer lodo, basura y aguas residuales. Para cualquier reúso, como riego, primero hay que analizarla.",
  },
  {
    id: "ayudar",
    category: "Participa",
    q: "¿Cómo puedo ayudar?",
    keywords: ["ayudar", "participar", "voluntario", "comite", "unirme", "colaborar", "apoyar"],
    a: "Hay varias formas:\n\n• No tires basura en la calle: termina en las rejillas del bordo.\n• Únete al comité vecinal de agua.\n• Participa en las jornadas de limpieza antes de la temporada de lluvias.\n• Ayuda a plantar y cuidar los jardines de lluvia.\n• Asiste a los simulacros.\n• Reporta coladeras tapadas al comité.",
  },
  {
    id: "reportar",
    category: "Participa",
    q: "¿Cómo reporto una coladera tapada?",
    keywords: ["reportar", "reporte", "coladera", "rejilla", "tapada", "basura acumulada", "denunciar"],
    a: "Toma una foto, anota la calle y la referencia más cercana y mándalo al grupo del comité vecinal. El comité lo revisa y, si es una obra mayor, lo canaliza al municipio.",
  },
];

export const SUGGESTED = ["estado", "colores", "roja", "punto-reunion", "recibir", "agosto"];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Busca la pregunta más parecida por palabras clave. Las frases largas pesan más que las palabras sueltas.
export function matchFaq(text: string): Faq | null {
  const t = ` ${norm(text)} `;
  let best: Faq | null = null;
  let bestScore = 0;
  for (const f of FAQS) {
    let score = 0;
    for (const k of f.keywords) {
      const nk = norm(k);
      if (t.includes(` ${nk} `) || (nk.length > 5 && t.includes(nk))) score += nk.split(" ").length * 2 + nk.length / 10;
    }
    if (norm(f.q) === norm(text)) score += 100;
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return bestScore > 0 ? best : null;
}

export const answerOf = (f: Faq, sim: Sim) => (typeof f.a === "function" ? f.a(sim) : f.a);
