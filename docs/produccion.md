# Funcionamiento y paso a producción

Para quien vaya a mantener el código o a convertir el prototipo en un piloto real.

## Cómo funciona hoy

Es una aplicación web de una sola página (React + TypeScript + Vite) sin servidor propio. Todo corre en el navegador.

### Simulación del bordo

`src/hooks/use-reservoir-sim.ts` reproduce lo que mandarían los sensores. Cada segundo avanza uno o más minutos simulados:

1. La lluvia del escenario elegido llega al bordo con retraso, como escorrentía.
2. El bordo se vacía por el vertedor en proporción a su nivel.
3. El nivel se calcula como lo haría el sensor ultrasónico: altura de instalación menos la distancia medida (300 cm al fondo, desborde a 250 cm).
4. En paralelo se simula el mismo bordo con infraestructura verde, que retiene el 20% de la escorrentía. Ese 20% es un supuesto de diseño, no una medición.
5. Con el porcentaje de llenado y la tasa de ascenso se decide el nivel de alerta. Para bajar de nivel hay un margen de 3 puntos, así la alerta no salta de un nivel a otro con cada lectura.

Las estimaciones ambientales (sedimento, recarga perdida) usan coeficientes de ejemplo para mostrar órdenes de magnitud.

### Alertas a la ciudadanía

`src/lib/citizen-alert.ts` arma un solo mensaje y lo adapta a cada canal:

- **Texto completo** para WhatsApp, Telegram y el tablero público.
- **SMS** sin á, í, ó, ú para que use la codificación GSM-7 y quepa en 160 caracteres (con esas letras el límite baja a 70). Agrega pasos completos mientras quepan; nunca corta una frase.
- **CAP 1.2** (Common Alerting Protocol, OASIS / ITU-T X.1303 bis), el formato estándar para intercambiar alertas con otros sistemas. Los simulacros salen con `status=Exercise`.

### Acceso del personal

`src/lib/auth.ts` guarda las cuentas en `localStorage` con la contraseña derivada con PBKDF2-SHA-256 (150 000 iteraciones y sal aleatoria). Compara en tiempo constante y bloquea 30 segundos tras 5 intentos fallidos. La sesión vive en `sessionStorage` y dura 8 horas.

## Qué falta para un piloto real

### 1. Datos reales de los sensores

- **Nodos:** ESP32 con sensor ultrasónico JSN-SR04T (nivel), pluviómetro de balancín y sensor de turbidez, con panel solar.
- **Comunicación:** LoRaWAN, con gateway en un punto alto, y respaldo 4G.
- **Plataforma:** ThingsBoard, o Node-RED con InfluxDB, para recibir y guardar las lecturas.
- **En la aplicación:** reemplazar `useReservoirSim` por un hook que lea la API o el WebSocket de la plataforma y devuelva la misma forma de datos (`hist`, `last`, `lvl`, `nodes`, etc.). Así el resto de la interfaz no cambia.
- **Calibración:** comparar el sensor con la regla graduada del bordo y ajustar `CFG` con las medidas reales.

### 2. Servidor y seguridad del acceso

**El acceso actual no es seguro para uso real.** Como todo corre en el navegador, alguien con conocimientos puede saltárselo. Para el piloto:

- Mover el inicio de sesión a un servidor: por ejemplo Supabase Auth, Firebase Auth o los usuarios y roles de ThingsBoard.
- Servir la aplicación por HTTPS.
- Validar en el servidor quién puede emitir alertas; no solo ocultar los botones.
- Quitar las cuentas y el código de demostración de `src/lib/auth.ts`.
- Registrar quién emitió cada alerta y a qué hora.

### 3. Envío real de alertas

| Canal | Cómo se implementa | A considerar |
|---|---|---|
| WhatsApp | WhatsApp Business Platform (Cloud API) con una plantilla de categoría Utilidad aprobada por Meta, con variables para nivel, colonias y pasos. | Solo a vecinos que aceptaron recibir mensajes (opt-in). Costo por mensaje. La plantilla se aprueba antes de la temporada de lluvias. |
| SMS | Proveedor de SMS masivo (por ejemplo Twilio u otro con cobertura en México). | Mantener el mensaje en GSM-7 y en 160 caracteres. Costo por mensaje. |
| Telegram | Bot de Telegram que publica en un canal de la colonia. | Gratuito y sin límite de suscriptores. |
| Alerta a celulares | Sistema Nacional de Alertas por Cell Broadcast. | No lo opera el proyecto: lo activan las autoridades. El comité lo solicita a Protección Civil. |
| Perifoneo | Altavoz del comité o de Protección Civil. | Para quien no tiene celular. |

El envío debe hacerlo el servidor, nunca el navegador, para no exponer las claves de los proveedores.

### 4. Datos de la comunidad

Sustituir los valores de ejemplo con los del diagnóstico de campo:

- Coordenadas reales del bordo, los nodos, el canal, la ruta de evacuación y el punto de reunión (`reservoir-map.tsx` y `use-reservoir-sim.ts`).
- Área de la microcuenca y porcentaje de suelo impermeable (`CFG.CUENCA_HA`, `CFG.IMPERMEABLE`).
- Azolve medido por batimetría (`CFG.SILT_PCT`).
- Umbrales ajustados después de las primeras tormentas.

## Publicar la versión web

```bash
npm run build
```

Genera la carpeta `dist/` con archivos estáticos, que se pueden subir a cualquier hosting estático (Netlify, Vercel, GitHub Pages o el servidor del municipio). Mientras no haya servidor de datos, la versión publicada sigue mostrando datos simulados.
