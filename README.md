# Vigía Pluvial

Sistema de monitoreo y alerta temprana para el bordo de retención de la cuenca de Peñuelas, en el norte de Querétaro (colonias Peñuelas, Menchaca y San José El Alto).

Proyecto del equipo **Cardenales** (Universidad Politécnica de Querétaro) para el Rally Latinoamericano de Innovación 2026, desafío 05: *Monitoreo inteligente e infraestructura verde en reservorios pluviales*.

> **Estado actual: prototipo.** Las lecturas de los sensores son simuladas y ningún mensaje se envía a teléfonos reales. Ver [docs/produccion.md](docs/produccion.md) para pasar a un piloto real.

---

## Qué hace

La aplicación tiene dos partes:

**Página pública** (cualquier persona, sin cuenta)

- Estado del bordo en vivo: porcentaje de llenado, lluvia, turbidez y nivel de alerta.
- Aviso de alerta a la ciudadanía con 2 a 4 pasos a seguir, cuando el personal lo emite.
- Mapa de la zona con el bordo, la zona baja, la ruta de evacuación y el punto de reunión. Tiene buscador y botón "Mi ubicación".
- Qué hacer en cada color de alerta y qué llevar en la mochila de emergencia.
- El caso de agosto de 2025, el daño ambiental, la comparación con y sin infraestructura verde, lo que dicen las guías técnicas y preguntas frecuentes.
- Asistente de preguntas frecuentes (botón "¿Tienes dudas?").

**Monitor** (solo personal autorizado: comité vecinal, Protección Civil, organismo operador)

- Lecturas de los sensores, gráficas de nivel y lluvia, vaso con regla graduada y nodos de campo.
- Simulacro por escenario (sin lluvia, llovizna, moderada, tormenta y la tormenta de agosto de 2025) con la lista de pasos del protocolo de cada nivel.
- Redactor de alertas a la ciudadanía con vista previa en WhatsApp, SMS y formato CAP.
- Panel de daño ambiental, comparación con infraestructura verde, bitácora de alertas y protocolo de respuesta.

Guía de uso completa: [docs/guia-de-uso.md](docs/guia-de-uso.md).

---

## Requisitos para correrlo

| Programa | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) | 20 o más reciente (recomendado 22 LTS) | Ejecuta la aplicación. Trae `npm` incluido. |
| [Git](https://git-scm.com) | cualquiera reciente | Descargar el repositorio. |
| Navegador | Chrome, Edge, Firefox o Safari actuales | Ver la aplicación. |

Se necesita internet la primera vez (para instalar dependencias) y mientras se usa el mapa (los mosaicos vienen de OpenStreetMap) y las tipografías (Google Fonts).

## Cómo correrlo

```bash
git clone https://github.com/pacopicks/vigia-pluvial.git
cd vigia-pluvial
npm install
npm run dev
```

Abre la dirección que muestra la terminal (normalmente `http://localhost:5173`). Para detenerlo, presiona `Ctrl + C` en la terminal.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática. |
| `npm run build` | Revisa los tipos y genera la versión para publicar en `dist/`. |
| `npm run preview` | Sirve la carpeta `dist/` para probar la versión publicada. |
| `npm run lint` | Revisa el estilo del código. |

## Acceso al monitor (demostración)

| Usuario | Correo | Contraseña |
|---|---|---|
| Comité vecinal | `comite@vigiapluvial.mx` | `Comite2026!` |
| Protección Civil | `proteccioncivil@vigiapluvial.mx` | `ProteCivil2026!` |

Para crear una cuenta nueva desde "Regístrate con tu código", el código de invitación es `CUENCA-PENUELAS-2026`.

Las cuentas nuevas se guardan solo en el navegador donde se crearon. Estas credenciales son de demostración: cámbialas en [src/lib/auth.ts](src/lib/auth.ts) antes de cualquier uso real, y lee la sección de seguridad en [docs/produccion.md](docs/produccion.md).

---

## Dependencias

`npm install` instala todo esto automáticamente a partir de `package.json`.

**De la aplicación**

| Paquete | Uso |
|---|---|
| `react`, `react-dom` | Interfaz. |
| `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css` | Estilos. |
| `leaflet`, `react-leaflet`, `react-leaflet-cluster` | Mapa interactivo. |
| `recharts` | Gráficas de nivel, lluvia y simulacros. |
| `lucide-react` | Íconos. |
| `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-progress`, `@radix-ui/react-slot` | Componentes accesibles (avatar, panel lateral en móvil, barras de progreso). |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variantes y combinación de clases de estilo. |

**De desarrollo**

| Paquete | Uso |
|---|---|
| `vite`, `@vitejs/plugin-react` | Servidor de desarrollo y compilación. |
| `typescript`, `@types/*` | Tipado. |
| `eslint` y complementos | Revisión de estilo. |

---

## Estructura

```
src/
├── App.tsx                     Rutas: portada (#/) y monitor (#/monitor)
├── hooks/use-reservoir-sim.ts  Simulación del bordo, alertas, simulacros y avisos a la ciudadanía
├── lib/
│   ├── auth.ts                 Inicio de sesión y registro del personal
│   ├── citizen-alert.ts        Formato del mensaje (WhatsApp, SMS y CAP 1.2)
│   ├── faq.ts                  Preguntas y respuestas del asistente
│   └── expertos.ts             Resúmenes de guías técnicas de referencia
└── components/
    ├── landing/                Página pública
    ├── monitor/                Monitor del personal
    ├── auth/                   Pantalla de acceso
    ├── chat/                   Asistente de preguntas frecuentes
    ├── charts/                 Gráficas propias
    └── ui/                     Componentes base (botones, tarjetas, mapa, etc.)
```

## Ajustes más comunes

| Qué cambiar | Dónde |
|---|---|
| Umbrales, altura del sensor, nivel de desborde, azolve, área de la cuenca | `CFG` en `src/hooks/use-reservoir-sim.ts` |
| Textos y pasos de cada nivel de alerta | `LEVELS` en `src/hooks/use-reservoir-sim.ts` |
| Ubicación de los nodos | `nodes` en `src/hooks/use-reservoir-sim.ts` |
| Trazos del mapa (cuenca, vaso, canal, ruta, punto de reunión) | `src/components/monitor/reservoir-map.tsx` |
| Pasos de contingencia para la ciudadanía y canales | `src/lib/citizen-alert.ts` |
| Preguntas frecuentes | `src/lib/faq.ts` |
| Cuentas y código de invitación | `src/lib/auth.ts` |

Las coordenadas del mapa y varios valores de la cuenca son **de ejemplo**. Sustitúyelos con los datos del diagnóstico de campo.

## Más documentación

- [docs/guia-de-uso.md](docs/guia-de-uso.md): cómo usar cada pantalla, cómo hacer un simulacro y cómo alertar a la ciudadanía.
- [docs/produccion.md](docs/produccion.md): cómo funciona por dentro y qué falta para un piloto real (sensores, servidor, WhatsApp, SMS y seguridad).
