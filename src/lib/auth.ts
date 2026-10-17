import { useCallback, useState } from "react";

// Acceso al monitor solo para personal autorizado.
// Nota: esto corre completo en el navegador y sirve para la demostración. En el piloto la validación
// debe hacerse en un servidor (p. ej. Supabase Auth o los usuarios y roles de ThingsBoard), con HTTPS,
// porque cualquier control que solo vive en el navegador se puede saltar.

export type Role = "Comité vecinal" | "Protección Civil" | "Organismo operador" | "Equipo técnico";
export const ROLES: Role[] = ["Comité vecinal", "Protección Civil", "Organismo operador", "Equipo técnico"];

export interface Session {
  email: string;
  name: string;
  role: Role;
  exp: number;
}

interface StoredUser {
  name: string;
  role: Role;
  salt: string;
  hash: string;
}

const USERS_KEY = "vigia:users";
const SESSION_KEY = "vigia:session";
const SESSION_MS = 8 * 60 * 60 * 1000; // un turno de 8 horas
const ITERATIONS = 150_000;

// Cuentas de demostración y código de invitación que entrega el comité o Protección Civil.
// Cambiarlos (o quitarlos) antes de cualquier uso real.
const DEMO_USERS: { email: string; name: string; role: Role; password: string }[] = [
  { email: "comite@vigiapluvial.mx", name: "Comité vecinal de agua", role: "Comité vecinal", password: "Comite2026!" },
  { email: "proteccioncivil@vigiapluvial.mx", name: "Protección Civil municipal", role: "Protección Civil", password: "ProteCivil2026!" },
];
const INVITE_CODE = "CUENCA-PENUELAS-2026";

const enc = new TextEncoder();
const toB64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS }, key, 256);
  return toB64(bits);
}

// Comparación en tiempo constante para no filtrar información por tiempos de respuesta
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function readUsers(): Record<string, StoredUser> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeUsers(u: Record<string, StoredUser>) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  } catch {
    /* almacenamiento bloqueado: la cuenta dura solo esta sesión */
  }
}

async function makeUser(name: string, role: Role, password: string): Promise<StoredUser> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { name, role, salt: toB64(salt), hash: await derive(password, salt) };
}

let seeding: Promise<Record<string, StoredUser>> | null = null;
function users() {
  if (!seeding) {
    seeding = (async () => {
      const u = readUsers();
      let changed = false;
      for (const d of DEMO_USERS) {
        if (!u[d.email]) {
          u[d.email] = await makeUser(d.name, d.role, d.password);
          changed = true;
        }
      }
      if (changed) writeUsers(u);
      return u;
    })();
  }
  return seeding;
}

function readSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null") as Session | null;
    return s && s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export function passwordProblem(p: string) {
  if (p.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(p) || !/\d/.test(p)) return "La contraseña debe combinar letras y números.";
  return null;
}

// Bloqueo temporal tras varios intentos fallidos
let failures = 0;
let lockedUntil = 0;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(readSession);

  const start = (email: string, u: StoredUser) => {
    const s: Session = { email, name: u.name, role: u.role, exp: Date.now() + SESSION_MS };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch {
      /* sin almacenamiento: la sesión vive solo en memoria */
    }
    setSession(s);
  };

  const signIn = useCallback(async (emailRaw: string, password: string): Promise<string | null> => {
    const now = Date.now();
    if (now < lockedUntil) return `Demasiados intentos. Espera ${Math.ceil((lockedUntil - now) / 1000)} segundos.`;
    const email = emailRaw.trim().toLowerCase();
    const u = (await users())[email];
    // Se calcula el hash aunque el correo no exista, para no revelar qué cuentas hay
    const hash = await derive(password, u ? fromB64(u.salt) : new Uint8Array(16));
    if (!u || !safeEqual(hash, u.hash)) {
      failures++;
      if (failures >= 5) {
        lockedUntil = Date.now() + 30_000;
        failures = 0;
      }
      return "Correo o contraseña incorrectos.";
    }
    failures = 0;
    start(email, u);
    return null;
  }, []);

  const signUp = useCallback(
    async (f: { name: string; email: string; password: string; role: Role; code: string }): Promise<string | null> => {
      const email = f.email.trim().toLowerCase();
      if (!f.name.trim()) return "Escribe tu nombre.";
      if (!validEmail(email)) return "Escribe un correo válido.";
      const pp = passwordProblem(f.password);
      if (pp) return pp;
      if (f.code.trim().toUpperCase() !== INVITE_CODE) return "El código de invitación no es válido. Pídelo al comité vecinal o a Protección Civil.";
      const all = await users();
      if (all[email]) return "Ya existe una cuenta con ese correo. Inicia sesión.";
      const u = await makeUser(f.name.trim(), f.role, f.password);
      all[email] = u;
      writeUsers(all);
      start(email, u);
      return null;
    },
    [],
  );

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* nada que borrar */
    }
    setSession(null);
  }, []);

  return { session, signIn, signUp, signOut };
}
