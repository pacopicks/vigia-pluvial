import React from "react";
import { ArrowRight, Droplets, Lock, Menu, X } from "lucide-react";

// Inline Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agua focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-white text-black hover:bg-gray-100",
      secondary: "bg-gray-800 text-white hover:bg-gray-700",
      ghost: "hover:bg-gray-800/50 text-white",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-10 px-5 text-sm",
      lg: "h-12 px-8 text-base",
    };

    return (
      <button ref={ref} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

const NAV_LINKS = [
  { href: "#vista-previa", label: "Estado actual" },
  { href: "#mapa", label: "Mapa" },
  { href: "#protocolo", label: "Qué hacer" },
  { href: "#problema", label: "El problema" },
  { href: "#expertos", label: "Expertos" },
  { href: "#preguntas", label: "Preguntas" },
];

const goTo = (href: string) => {
  document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
};

// Navigation Component
const Navigation = React.memo(({ onOpenMonitor }: { onOpenMonitor: () => void }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-xl font-bold text-white">
            <Droplets className="size-5 text-agua" aria-hidden />
            Vigía Pluvial
          </div>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-6 lg:flex">
            {NAV_LINKS.map((l) => (
              <button key={l.href} type="button" onClick={() => goTo(l.href)} className="cursor-pointer text-sm text-white/60 transition-colors hover:text-white">
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <Button type="button" variant="default" size="sm" onClick={onOpenMonitor}>
              <Lock size={14} aria-hidden />
              Acceso personal
            </Button>
          </div>

          <button
            type="button"
            className="text-white lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="animate-[slideDown_0.3s_ease-out] border-t border-gray-800/50 bg-black/95 backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-4 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                type="button"
                className="py-2 text-left text-sm text-white/60 transition-colors hover:text-white"
                onClick={() => {
                  setMobileMenuOpen(false);
                  goTo(l.href);
                }}
              >
                {l.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 border-t border-gray-800/50 pt-4">
              <Button type="button" variant="default" size="sm" onClick={onOpenMonitor}>
                <Lock size={14} aria-hidden />
                Acceso personal autorizado
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Navigation.displayName = "Navigation";

// Hero Component
const Hero = React.memo(({ preview, banner }: { preview?: React.ReactNode; banner?: React.ReactNode }) => {
  return (
    <section className="px-6 pb-16 pt-28 md:pt-32">
      <div className="mx-auto flex max-w-5xl flex-col">
        {banner}
        <p className="mb-4 text-sm text-gray-400">
          Cuenca de Peñuelas, Querétaro ·{" "}
          <button type="button" onClick={() => goTo("#problema")} className="cursor-pointer text-gray-300 underline underline-offset-4 hover:text-white">
            146 mm en agosto de 2025
          </button>
        </p>

        <h1 className="mb-5 max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
          Que el bordo avise antes de que llegue el agua
        </h1>

        <p className="mb-8 max-w-2xl text-base text-gray-400 md:text-lg">
          Sensores de nivel, lluvia y turbidez, infraestructura verde y un comité vecinal con alertas por WhatsApp, para que Peñuelas,
          Menchaca y San José El Alto actúen antes del desborde y no después.
        </p>

        <div className="mb-12 flex flex-wrap items-center gap-3">
          <Button type="button" variant="default" size="lg" className="rounded-lg" onClick={() => goTo("#mapa")}>
            Ver el mapa de mi zona
            <ArrowRight size={16} />
          </Button>
          <Button type="button" variant="ghost" size="lg" className="rounded-lg" onClick={() => goTo("#protocolo")}>
            Qué hacer en cada alerta
          </Button>
        </div>

        <div id="vista-previa" className="scroll-mt-24">
          {preview}
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

// Main Component
export default function Component({
  onOpenMonitor,
  preview,
  banner,
  children,
}: {
  onOpenMonitor: () => void;
  preview?: React.ReactNode;
  banner?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navigation onOpenMonitor={onOpenMonitor} />
      <Hero preview={preview} banner={banner} />
      {children}
    </main>
  );
}

export { Button as TemplateButton, Navigation, Hero };
