import { fmtTime, forecast, LEVELS, type Level, type Reading } from "@/hooks/use-reservoir-sim";

// Mensaje de alerta a la ciudadanía.
// La estructura sigue los campos de texto del Common Alerting Protocol (CAP 1.2, OASIS / ITU-T X.1303 bis):
// headline (encabezado), description (qué pasa), instruction (qué hacer) y areaDesc (zona).
// Un mismo mensaje se adapta a cada canal: WhatsApp/Telegram (texto completo), SMS (corto) y tablero público.

export const COLONIAS = ["Peñuelas", "Menchaca", "San José El Alto"];

// Pasos de contingencia para vecinos, por nivel. Se eligen de 2 a 4 para el mensaje.
export const CONTINGENCY: Record<Exclude<Level, 0>, string[]> = {
  1: [
    "Mantente atento a este canal",
    "Sube documentos y objetos de valor a lo alto",
    "No tires basura: tapa las coladeras",
    "Revisa que tu mochila de emergencia esté lista",
  ],
  2: [
    "Ten lista tu mochila de emergencia",
    "Mueve tu auto a una calle alta",
    "Ubica la ruta al punto de reunión",
    "Ayuda a vecinos mayores o con discapacidad a prepararse",
    "No te acerques al canal ni al bordo",
  ],
  3: [
    "Sal de las zonas bajas por la ruta marcada",
    "No cruces calles con corriente",
    "Ve al punto de reunión y avisa que llegaste",
    "Desconecta luz y gas si puedes hacerlo sin riesgo",
    "Emergencia: llama al 911",
  ],
};

export const DEFAULT_STEPS: Record<Exclude<Level, 0>, number[]> = { 1: [0, 1], 2: [0, 1, 2], 3: [0, 1, 2, 4] };

export interface Channel {
  id: string;
  label: string;
  how: string;
  available: boolean;
}

// Canales y cómo se implementan de verdad en el piloto
export const CHANNELS: Channel[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    how: "WhatsApp Business Platform: plantilla de categoría Utilidad aprobada por Meta, solo a vecinos que dieron su consentimiento (opt-in).",
    available: true,
  },
  {
    id: "sms",
    label: "SMS",
    how: "Proveedor de SMS masivo. Versión corta sin acentos para que quepa en 160 caracteres (con á, í, ó, ú baja a 70).",
    available: true,
  },
  {
    id: "telegram",
    label: "Telegram",
    how: "Bot de Telegram que publica en un canal público de la colonia. Gratuito y sin límite de suscriptores.",
    available: true,
  },
  {
    id: "tablero",
    label: "Tablero público",
    how: "Banner en la página pública de Vigía Pluvial, visible para cualquiera sin registrarse.",
    available: true,
  },
  {
    id: "perifoneo",
    label: "Perifoneo",
    how: "Altavoz del comité o de Protección Civil recorriendo las calles bajas, para quien no tiene celular.",
    available: true,
  },
  {
    id: "cell",
    label: "Alerta a celulares",
    how: "Cell Broadcast del Sistema Nacional de Alertas: llega a todos los celulares de la zona aunque no tengan saldo. Solo lo activan las autoridades; el comité lo solicita a Protección Civil.",
    available: false,
  },
];

const SEVERITY: Record<Exclude<Level, 0>, { urgency: string; severity: string; certainty: string; response: string }> = {
  1: { urgency: "Expected", severity: "Moderate", certainty: "Likely", response: "Monitor" },
  2: { urgency: "Expected", severity: "Severe", certainty: "Likely", response: "Prepare" },
  3: { urgency: "Immediate", severity: "Extreme", certainty: "Observed", response: "Evacuate" },
};

export interface AlertDraft {
  lvl: Exclude<Level, 0>;
  exercise: boolean;
  steps: string[];
  areas: string[];
  note: string;
  last: Reading;
  rate: number;
  now: number;
}

export function buildAlert(d: AlertDraft) {
  const lv = LEVELS[d.lvl];
  const tag = d.exercise ? "ESTO ES UN SIMULACRO. " : "";
  const zona = d.areas.length ? d.areas.join(", ") : "zona baja del bordo";
  const f = forecast(d.last, d.rate);
  const headline = `${lv.title.toUpperCase()} por inundación · ${zona}`;
  const description = `El bordo de retención está al ${Math.min(d.last.p, 100).toFixed(0)}% de su capacidad y ${
    d.rate > 0.2 ? `sube ${d.rate.toFixed(1)} cm por minuto` : "el nivel se mantiene"
  }. ${f.label}: ${f.value}.`;

  const text = [
    d.exercise ? "*ESTO ES UN SIMULACRO*" : null,
    `*${headline}*`,
    "",
    description,
    "",
    "*Qué hacer ahora:*",
    ...d.steps.map((s, i) => `${i + 1}. ${s}`),
    d.note.trim() ? `\n${d.note.trim()}` : null,
    "",
    `Vigía Pluvial · Comité vecinal y Protección Civil · ${fmtTime(d.now)}`,
    d.exercise ? "ESTO ES UN SIMULACRO. No es una emergencia real." : null,
  ]
    .filter((x) => x !== null)
    .join("\n");

  // SMS: sin acentos y en un solo mensaje de 160. Se agregan pasos completos mientras quepan; nunca se corta a media frase.
  const pct = Math.min(d.last.p, 100).toFixed(0);
  const tail = " Emergencia: 911";
  let base = toGsm7(`${tag}ALERTA ${lv.name.toUpperCase()} INUNDACION ${zona}: bordo ${pct}%.`, 999);
  if (base.length + tail.length > 140) base = toGsm7(`${tag}ALERTA ${lv.name.toUpperCase()} INUNDACION zona baja: bordo ${pct}%.`, 999);
  let sms = base;
  for (const step of d.steps) {
    const next = `${sms} ${toGsm7(step, 999)}.`;
    if (next.length + tail.length > 160) break;
    sms = next;
  }
  sms += tail;

  const s = SEVERITY[d.lvl];
  const cap = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>vigia-pluvial-${d.now}</identifier>
  <sender>comite@vigiapluvial.mx</sender>
  <sent>${new Date(d.now).toISOString().replace(/\.\d{3}Z$/, "+00:00")}</sent>
  <status>${d.exercise ? "Exercise" : "Actual"}</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <language>es-MX</language>
    <category>Met</category>
    <event>Inundación por desbordamiento de bordo</event>
    <responseType>${s.response}</responseType>
    <urgency>${s.urgency}</urgency>
    <severity>${s.severity}</severity>
    <certainty>${s.certainty}</certainty>
    <senderName>Vigía Pluvial · Comité vecinal de agua</senderName>
    <headline>${escapeXml(headline)}</headline>
    <description>${escapeXml(description)}</description>
    <instruction>${escapeXml(d.steps.join(". "))}</instruction>
    <area>
      <areaDesc>${escapeXml(zona)}, Querétaro</areaDesc>
    </area>
  </info>
</alert>`;

  return { headline, description, text, sms, cap, smsInfo: smsInfo(sms) };
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Alfabeto GSM-7 básico (3GPP TS 23.038). Fuera de él, el SMS pasa a UCS-2 y cabe en 70 caracteres.
const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

export function toGsm7(text: string, max = 160) {
  return text
    .replace(/[áÁ]/g, (c) => (c === "á" ? "a" : "A"))
    .replace(/[íÍ]/g, (c) => (c === "í" ? "i" : "I"))
    .replace(/[óÓ]/g, (c) => (c === "ó" ? "o" : "O"))
    .replace(/[úÚ]/g, (c) => (c === "ú" ? "u" : "U"))
    .replace(/[·•]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .split("")
    .filter((c) => GSM7.includes(c))
    .join("")
    .slice(0, max);
}

export function smsInfo(text: string) {
  const gsm = text.split("").every((c) => GSM7.includes(c));
  const len = text.length;
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  const segments = len <= single ? 1 : Math.ceil(len / multi);
  return { encoding: gsm ? "GSM-7" : "UCS-2", len, single, segments };
}
