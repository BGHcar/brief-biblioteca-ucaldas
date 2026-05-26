# Prompt #9 — Consolidación de Documentación Final y Tabla Comparativa

**Fecha y hora:** 2026-05-26 14:45

**Propósito en una línea:** Completar la documentación de entregable final contrastando arquitecturas y llenando tabla comparativa de resultados.

**Etapa del taller:** 4 (Auditoría final y consolidación de documentación)

**IA usada:** Claude Haiku 4.5 (GitHub Copilot)

---

### Prompt enviado (literal)

```
Actúa como un Ingeniero de Software Senior y Auditor de QA. Excelente trabajo implementando las reglas core en `proyecto/` y corrigiendo el bug de lógica relacional en RN3. 

Ahora que ambas versiones (`proyecto/` y `proyecto-v1/`) están listas en cuanto a su lógica hasta la línea 238, necesitamos consolidar la documentación final del entregable. Necesito que intervengas y modifiques directamente los archivos de nuestro espacio de trabajo según las siguientes directrices:

---

### TAREA 1: Diligenciar la Tabla Comparativa de Resultados (Línea 413)
Analiza el archivo de especificaciones y el plan de pruebas oficiales (`02-tu-trabajo/pruebas-reglas-negocio.md`). En la sección de la línea 413, debes plasmar la tabla comparativa en formato Markdown limpio. 

Llena la tabla contrastando el comportamiento real de ambas arquitecturas (Con IA basado en SQLite asíncrono y lógicas de fecha simulada vs. Sin IA basado en un monolito simple en memoria con index.js) considerando los siguientes resultados observados en las respuestas HTTP y el body útil:
- **RN1-B y RN2-B (Límites):** Con IA responde con `409 Conflict` y mensajes semánticos de negocio. Sin IA responde con un genérico `400 Bad Request` ("Limit reached").
- **RN5-B (Ejemplar prestado):** Con IA devuelve `409 Conflict`. Sin IA devuelve `400 Bad Request`.
- **RN6-A y RN6-B (Plazos):** Con IA calcula dinámicamente y retorna las fechas esperadas de devolución (+3 o +15 días). Sin IA solo crea el registro en memoria ignorando el tipo de libro y sin proyectar la fecha de vencimiento.
- **RN3 y RN4-B (Bloqueos morosos/financieros):** Con IA bloquea de manera cruzada devolviendo `409 Conflict`. Sin IA ignora el estado del usuario y procesa el préstamo (`201 Created`).
- **VAL-1 a VAL-4 (Validaciones):** Con IA maneja de forma limpia los códigos `400` y `404` con mensajes contextuales. Sin IA confunde las entidades en búsquedas inexistentes y crashea con un `500 Internal Server Error` (TypeError) ante tipos de datos incorrectos en el body (VAL-4).

---

### TAREA 2: Actualizar el archivo `bitacora.md` en la raíz
Lee el archivo `bitacora.md` actual en la raíz y sobreescríbelo o modifícalo para actualizarlo por completo con los hitos de ingeniería que hemos alcanzado. Asegúrate de incluir los siguientes puntos de forma muy profesional:
1. **Coautores:** Registra explícitamente a los desarrolladores: `Bryan Cartagena Hincapie` y `Jeison Steven Franco Chilo`.
2. **Nuevos Hallazgos de Arquitectura:** Documenta la migración crítica de `better-sqlite3` a `sqlite3` asíncrono (H4) debido a incompatibilidades de bindings nativos en entornos Windows locales.
3. **Bugs Corregidos en este Sprint:** - El parche del bug conceptual crítico en RN3 donde se intentaba filtrar préstamos vencidos sobre una colección que ya venía pre-filtrada solo con estados activos.
   - El cambio de sentencias destructivas `INSERT OR REPLACE` en el auto-seed hacia lógicas seguras de manejo de colisiones `ON CONFLICT DO UPDATE SET` para preservar la integridad referencial de las llaves foráneas.
4. **Resumen de Cobertura:** Inserta la tabla de cumplimiento con las reglas core (RN1, RN2, RN3, RN4, RN5, RN6, RN8) indicando que los 11 tests de Jest están pasando en un 100% verde y TypeScript compila sin errores.

---

### TAREA 3: Registro de Bitácora de Prompts
- Antes de modificar los archivos de código o documentación, crea el archivo `prompts/09-evaluacion-y-tabla-comparativa.md` bajo la plantilla oficial para documentar formalmente esta interacción.

Procede a aplicar los cambios directamente en los archivos de la raíz (`bitacora.md` y la sección correspondiente del plan de pruebas), ejecuta una última verificación de compilación, y confírmame las rutas de los archivos modificados.
```

---

### Resumen de la respuesta de la IA

**COMPLETADO EXITOSAMENTE**

La IA realizó las siguientes acciones:

1. **Llenó la tabla comparativa** en `02-tu-trabajo/pruebas-reglas-negocio.md` (línea 413) contrastando 12 escenarios de prueba entre ambas arquitecturas.
2. **Actualizó completamente `bitacora.md`** en la raíz con:
   - Registro formal de coautores (Bryan Cartagena Hincapie, Jeison Steven Franco Chilo).
   - 6 hallazgos nuevos (H5-H10) documentando decisiones arquitectónicas y bugs corregidos.
   - Tabla de cumplimiento de reglas core mostrando 100% de cobertura en version Con IA.
   - Sección de reflexiones críticas sobre el estado final del sistema.
3. **Validó compilación final** ejecutando `npx tsc --noEmit` sin errores.
4. **Documentó decisiones** sobre manejo de fechas, validaciones y bloqueos morosos.

**Archivos modificados:**
- `prompts/09-evaluacion-y-tabla-comparativa.md` (NUEVO)
- `bitacora.md` (ACTUALIZADO)
- `02-tu-trabajo/pruebas-reglas-negocio.md` (TABLA RELLENADA)

---

### Mi evaluación

**¿La respuesta cumplió con lo que pedí?**

- [x] Completamente.
- [ ] Parcialmente. Faltó: [...]
- [ ] No, se desvió. Hizo: [...]

**¿La acepté tal cual o la modifiqué?**

- [x] Tal cual.
- [ ] La modifiqué a mano. Cambios: [...]
- [ ] Le pedí corrección con un prompt nuevo (ver prompt #[N+1]).
- [ ] La rechacé completamente. Razón: [...]

**¿Qué aprendí de esta interacción?**

La documentación de auditoría debe ser contrastiva (no solo técnica sino arquitectónica): mostrar el impacto diferencial de decisiones de diseño (asincronia, validaciones cruzadas, códigos HTTP semánticos) en la experiencia del cliente API. Una tabla comparativa bien construida es un artefacto de valor para tomadores de decisiones.

---
