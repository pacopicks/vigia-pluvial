# Guía de uso

Para el comité vecinal, Protección Civil y quien presente el proyecto.

## 1. Página pública

Es lo que ve cualquier vecino al abrir la aplicación.

| Sección | Qué muestra |
|---|---|
| Aviso a la ciudadanía | Aparece arriba de todo solo cuando el personal emite una alerta. Trae el nivel, las colonias y los pasos a seguir. Si es un simulacro, lo dice. |
| Estado actual | Llenado del bordo, si sube o baja, lluvia y turbidez. Se actualiza solo. |
| Mapa | Bordo, zona baja (círculo que cambia de color con la alerta), canal, ruta de evacuación (línea verde punteada) y punto de reunión. Botones: buscar lugar, "Mi ubicación", satélite y claro/oscuro. |
| Qué hacer | Un recuadro por color de alerta. El color actual aparece marcado. |
| El problema | El caso de agosto de 2025 y por qué un bordo no protege por sí solo. |
| Infraestructura verde | Llenado del bordo con y sin obras verdes, con la misma lluvia. |
| Expertos | Resúmenes de guías de la ONU, la OMM, la OMS, CIRIA, la EPA y CENAPRED, con enlace a cada fuente. |
| Preguntas | Preguntas frecuentes por tema. |

**Asistente:** el botón "¿Tienes dudas?" abre un chat que responde preguntas frecuentes, incluida "¿cómo está el bordo ahora?" con los datos del momento. Busca por palabras clave; no es un modelo de lenguaje. Si no encuentra una respuesta, lo dice y recuerda el 911.

## 2. Entrar al monitor

1. En la página pública, toca **Acceso personal**.
2. Escribe tu correo y contraseña. Las cuentas de demostración están en el [README](../README.md#acceso-al-monitor-demostración).
3. Para crear una cuenta, toca **Regístrate con tu código**. Necesitas el código de invitación que entrega el comité o Protección Civil.

Después de 5 intentos fallidos, el acceso se bloquea 30 segundos. La sesión dura 8 horas o hasta cerrar la pestaña. Para salir, usa el botón junto a tu nombre en la barra lateral.

## 3. El monitor

La barra lateral lleva a cada sección. Arriba se ve el nivel de alerta actual.

- **Resumen:** alerta actual con pronóstico, controles de la simulación (escenario de lluvia, velocidad, pausa y mensaje de prueba), lecturas principales, vaso con regla en centímetros, lluvia de 24 horas frente a la tormenta récord y capacidad útil.
- **Nivel y lluvia:** gráficas de las últimas 2 horas con los umbrales de alerta.
- **Mapa de la cuenca:** el mismo mapa de la portada, con el detalle de cada nodo.
- **Simulacro** y **Alertar a la ciudadanía:** ver abajo.
- **Daño ambiental:** sedimento arrastrado, agua que no recargó el acuífero y riesgos (aguas residuales, mosquitos, basura).
- **Infraestructura verde:** comparación con y sin obras.
- **Nodos de campo:** batería, señal y disponibilidad de datos.
- **Bitácora:** todas las alertas enviadas.
- **Protocolo:** qué hace cada quién en cada nivel.

### Niveles de alerta

| Nivel | Cuándo | Quién recibe el aviso |
|---|---|---|
| Verde | Menos de 60% | Comité (resumen diario) |
| Amarillo | 60% o más | Comité vecinal |
| Naranja | 80% o más, o 40% subiendo rápido | Comité y Protección Civil |
| Rojo | 90% o más, o 60% subiendo rápido | Protección Civil, municipio y comité |

"Subiendo rápido" es 2 cm por minuto o más. Los umbrales son iniciales; se ajustan con las primeras tormentas del piloto.

## 4. Hacer un simulacro

1. Ve a **Simulacro** y toca **Simular** en un escenario. El bordo arranca al 40% y la lluvia corre 150 minutos simulados.
2. La velocidad de 1 min/s da unos 2½ minutos reales; 5 min/s, unos 30 segundos. Usa **Pausar** cuando necesites tiempo.
3. Cuando suena una alerta, aparece la lista de pasos de ese nivel:
   - Toca **Alertar a la ciudadanía con pasos a seguir** para redactar y enviar el aviso (ver la sección 5).
   - Marca cada paso cuando el responsable lo cumpla. Se guarda cuántos minutos tardó desde que sonó la alerta.
4. Al terminar se muestran los pasos cumplidos, los minutos entre la primera alerta y el desborde, y qué revisar.
5. La gráfica de barras compara qué tan rápido escala cada escenario simulado.

Si la alerta sube de golpe (por ejemplo, de verde a naranja), también aparecen los pasos del nivel que se saltó, y el aviso a la ciudadanía se envía con el nivel más alto.

## 5. Alertar a la ciudadanía

1. **Nivel:** viene marcado el actual.
2. **Pasos a seguir:** elige de 2 a 4. Puedes escribir uno propio (por ejemplo, dónde está el albergue).
3. **Colonias:** a cuáles va dirigido.
4. **Canales:** WhatsApp, SMS, Telegram, tablero público y perifoneo. "Alerta a celulares" aparece bloqueado porque solo lo activan las autoridades; el comité lo solicita a Protección Civil.
5. **Nota adicional:** opcional.
6. Revisa la vista previa: el mensaje como llega por WhatsApp, la versión SMS (debe caber en 160 caracteres) y el formato técnico CAP.
7. Toca **Enviar simulacro** (o **Emitir alerta** si desmarcaste "Marcar como simulacro").

El aviso aparece de inmediato en la página pública. Durante un simulacro, el mensaje empieza y termina con "ESTO ES UN SIMULACRO".

En este prototipo **no se envía nada a ningún teléfono**: el mensaje se registra en la bitácora y aparece en la portada.

## 6. Presentar el proyecto

Recorrido sugerido de 5 minutos:

1. Portada: estado en vivo y mapa.
2. "El problema": los 146 mm de agosto de 2025.
3. Acceso personal → Simulacro con **Ago 2025 · 146 mm**.
4. Cuando suene la primera alerta: pausar, alertar a la ciudadanía y enviar.
5. Volver a la portada para mostrar el aviso que ve la gente.
6. Volver al monitor, terminar el simulacro y mostrar el resultado.
