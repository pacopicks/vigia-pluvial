import * as React from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { ROLES, validEmail, type Role } from "@/lib/auth";

// Pantalla de acceso del personal: inicio de sesión y registro con código de invitación.

interface SignInProps {
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (f: { name: string; email: string; password: string; role: Role; code: string }) => Promise<string | null>;
  onBack: () => void;
}

const field =
  "w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400";

const SignIn = ({ onSignIn, onSignUp, onBack }: SignInProps) => {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("Comité vecinal");
  const [code, setCode] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    if (!validEmail(email)) {
      setError("Escribe un correo válido.");
      return;
    }
    setError("");
    setBusy(true);
    const err = mode === "signin" ? await onSignIn(email, password) : await onSignUp({ name, email, password, role, code });
    setBusy(false);
    if (err) setError(err);
  };

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#121212] px-4 py-12">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 top-4 flex cursor-pointer items-center gap-1.5 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="size-4" /> Volver a la página pública
      </button>

      {/* Centered glass card */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shadow-lg">
          <Lock className="size-5 text-white" aria-hidden />
        </div>
        <h1 className="mb-1 text-center text-2xl font-semibold text-white">{mode === "signin" ? "Acceso al monitor" : "Crear cuenta de personal"}</h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          {mode === "signin" ? "Solo para personal autorizado de Vigía Pluvial" : "Necesitas el código de invitación que entrega el comité o Protección Civil"}
        </p>

        <form className="flex w-full flex-col gap-4" onSubmit={submit} noValidate>
          <div className="flex w-full flex-col gap-3">
            {mode === "signup" && (
              <>
                <label htmlFor="su-name" className="sr-only">
                  Nombre completo
                </label>
                <input id="su-name" placeholder="Nombre completo" autoComplete="name" value={name} className={field} onChange={(e) => setName(e.target.value)} />
                <label htmlFor="su-role" className="sr-only">
                  Organización
                </label>
                <select id="su-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${field} appearance-none`}>
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#121212]">
                      {r}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label htmlFor="si-email" className="sr-only">
              Correo
            </label>
            <input
              id="si-email"
              placeholder="Correo"
              type="email"
              autoComplete="email"
              value={email}
              className={field}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <label htmlFor="si-password" className="sr-only">
                Contraseña
              </label>
              <input
                id="si-password"
                placeholder={mode === "signin" ? "Contraseña" : "Contraseña (10+ caracteres, letras y números)"}
                type={show ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                className={`${field} pr-12`}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-gray-400 hover:text-white"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === "signup" && (
              <>
                <label htmlFor="su-code" className="sr-only">
                  Código de invitación
                </label>
                <input
                  id="su-code"
                  placeholder="Código de invitación"
                  autoComplete="off"
                  value={code}
                  className={`${field} uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal`}
                  onChange={(e) => setCode(e.target.value)}
                />
              </>
            )}
            <div aria-live="polite" className="min-h-5">
              {error && <div className="text-left text-sm text-red-400">{error}</div>}
            </div>
          </div>
          <hr className="opacity-10" />
          <div>
            <button
              type="submit"
              disabled={busy}
              className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white shadow transition hover:bg-white/20 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
            <div className="mt-2 w-full text-center">
              <span className="text-xs text-gray-400">
                {mode === "signin" ? "¿Eres parte del comité o de Protección Civil y no tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button type="button" onClick={switchMode} className="cursor-pointer text-white/80 underline hover:text-white">
                  {mode === "signin" ? "Regístrate con tu código" : "Inicia sesión"}
                </button>
              </span>
            </div>
          </div>
        </form>
      </div>

      <div className="relative z-10 mt-10 flex max-w-sm flex-col items-center text-center">
        <p className="mb-2 text-sm text-gray-400">
          El monitor avanzado, los simulacros y el envío de alertas son solo para el <span className="font-medium text-white">comité vecinal</span>,{" "}
          <span className="font-medium text-white">Protección Civil</span> y el organismo operador.
        </p>
        <p className="text-xs text-gray-500">¿Eres vecino? El estado del bordo, el mapa y qué hacer en cada alerta están en la página pública.</p>
      </div>
    </div>
  );
};

export { SignIn };

export default SignIn;
