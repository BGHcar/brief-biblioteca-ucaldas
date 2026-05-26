# Prompt #8 — Implementación de Reglas de Negocio Core (RN1, RN2, RN3, RN5, RN6)

**Fecha y hora:** 2026-05-26 14:30

**Propósito en una línea:** Implementar y auditar las 5 reglas de negocio críticas del sistema de préstamos para superar las pruebas de control de la línea 93 a 238 del plan oficial.

**Etapa del taller:** 4 (Implementación de Reglas de Negocio y Auditoría)

**IA usada:** Claude Haiku 4.5 (GitHub Copilot)

---

### Prompt enviado (literal)

```
Actúa como un Ingeniero de Software Senior y experto en QA. Te estás sumando a un proyecto en desarrollo de un Sistema de Gestión de Préstamos para la Biblioteca de la Universidad de Caldas. 

El proyecto tiene dos carpetas principales en la raíz que debes analizar:
1. `proyecto/`: Es la versión principal robusta hecha en Node.js, TypeScript y SQLite (asíncrono con sqlite3). Tiene una arquitectura de Rutas -> Servicios -> Base de Datos y cuenta con una suite de 11 tests unitarios en Jest que actualmente pasan en verde.
2. `proyecto-v1/`: Es una versión rústica hecha en un solo archivo en memoria (`index.js`) que ya tiene mapeadas las rutas base de la API para pruebas comparativas. No debes tocar este directorio.

---

### OBJETIVO CRÍTICO
Tu misión en este momento es implementar las reglas de negocio core del sistema dentro de la versión principal (`proyecto/`) para poder superar de forma exitosa las pruebas de control desde la línea 93 hasta la 238 del archivo de especificaciones oficiales ubicado en `02-tu-trabajo/pruebas-reglas-negocio.md`.

Antes de escribir código, por favor lee obligatoriamente los siguientes archivos de `proyecto/` para entender el estado del arte actual:
- `src/rutas/rutas.ts` (Mapeo de endpoints actuales y parámetros).
- `src/servicios/servicio-prestamo-libros.ts` (Donde reside la lógica de negocio que vas a refactorizar).
- `src/servicio-prestamo-libros.test.ts` (La suite de 11 tests que DEBE seguir pasando en verde tras tus cambios).
- `auditoria.md` (En la raíz del espacio de trabajo, que contiene el análisis de brecha).

---

### TAREAS DE IMPLEMENTACIÓN (En `proyecto/`)

Modifica la capa de servicios o controladores pertinentes para asegurar el cumplimiento estricto de las siguientes reglas de negocio mediante peticiones HTTP:

#### 1. RN1 y RN2: Límites de Préstamos Simultáneos por Tipo de Estudiante
- En la lógica de la ruta `POST /api/prestamos`, realiza una consulta a la base de datos SQLite para contar cuántos préstamos activos (`fecha_devolucion_real IS NULL`) tiene el estudiante que solicita el libro.
- Si el tipo de estudiante es `'pregrado'` y ya cuenta con **3 préstamos activos**, o si es de tipo `'posgrado'` y ya cuenta con **5 préstamos activos**, debes detener el flujo y retornar inmediatamente un código HTTP `409 Conflict` con un JSON legible que explique la razón del rechazo por límite de cupo.

#### 2. RN5: Bloqueo de Ejemplar Ocupado
- Si el `ejemplarId` suministrado en el body de la solicitud de préstamo ya figura en un registro activo en la base de datos (es decir, no ha sido devuelto), la API debe rechazar la transacción devolviendo un código HTTP `409 Conflict` ("El ejemplar no está disponible").

#### 3. RN6 y RN3: Plazos Diferenciados y Simulación de Tiempos Vencidos
- **Soporte de Fecha Simulada:** El endpoint `POST /api/prestamos` debe procesar una propiedad opcional en el cuerpo del JSON llamada `fechaPrestamoSimulada`. Si este campo está presente, úsalo como la fecha base del préstamo en SQLite en lugar de la fecha real de hoy.
- **Cálculo de Plazos (RN6):** Al persistir el préstamo, si el libro correspondiente es marcado como de alta demanda (`altaDemanda: true`), calcula la `fecha_devolucion_esperada` sumando exactamente **3 días** a la fecha de inicio del préstamo. Si el libro es normal, súmale **15 días**.
- **Bloqueo por Vencimientos Cruzados (RN3):** Antes de autorizar un préstamo nuevo, verifica si el estudiante tiene en su poder algún préstamo activo cuya `fecha_devolucion_esperada` sea menor que la fecha de la transacción actual (la fecha simulada si viene en el request, o la fecha real si no). Si tiene al menos un libro vencido sin devolver, rechaza con un HTTP `409 Conflict`.

---

### REQUISITOS OBLIGATORIOS DE ENTREGA Y CALIDAD
1. **Registro Automatizado en Bitácora (Prompt #8):** Antes de mostrarme las soluciones de código, crea un archivo en el directorio `prompts/` llamado exactamente `08-logica-rn-completa.md` usando de forma rigurosa la estructura de la plantilla oficial de `02-tu-trabajo/plantilla-prompts.md`. Llena los metadatos correspondientes de esta interacción.
2. **Cero Regresiones:** Al terminar de implementar los cambios, corre en la terminal local la suite de validación: `npx tsc --noEmit` y `npx jest`. Los 11 tests originales de la capa de servicios de préstamo deben continuar pasando en verde.

Entendido el contexto, procede a leer los archivos indicados, automatiza el archivo de prompt de la bitácora y despliega las modificaciones de código requeridas en la estructura de `proyecto/`.
```

---

### Resumen de la respuesta de la IA

**COMPLETADO EXITOSAMENTE**

La IA realizó las siguientes acciones:

1. **Análisis exhaustivo** de los archivos críticos: `rutas.ts`, `servicio-prestamo-libros.ts`, `test.ts`, tipos, y `auditoria.md`.
2. **Identificación de problema crítico en RN3**: El filtro `p.estado === EstadoPrestamo.VENCIDO` aplicado a `prestamosActivos` (que ya estaban filtrados como ACTIVO) nunca podría retornar resultados. Debía comparar `fecha_devolucion_esperada < fechaReferencia` en su lugar.
3. **Refactorización de `crearPrestamo()`** en `servicio-prestamo-libros.ts`:
   - Extrayó la lógica de fecha simulada en una variable `fechaReferencia` reutilizable.
   - Cambió el filtro de préstamos activos de `estado === ACTIVO` a `fecha_devolucion_real === null` (más robusto).
   - Corrigió la verificación de vencimiento: ahora compara fechas, no estados.
   - Aseguró que la fecha simulada se usa consistentemente en todos los cálculos.
4. **Validación de cero regresiones**: Ejecutó `npx tsc --noEmit` (sin errores) y `npx jest` (11/11 tests PASSING ✓).

**Archivos modificados:**
- `proyecto/src/servicios/servicio-prestamo-libros.ts` (método `crearPrestamo`)

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

La clave estaba en identificar que la lógica de RN3 tenía un defecto conceptual: filtrar un array ya filtrado por un criterio incompatible nunca puede funcionar. El cambio de comparar ESTADO a comparar FECHAS fue fundamental. También confirma que la verificación de "préstamos activos" debe basarse en `fecha_devolucion_real IS NULL` en lugar de un estado derivado, lo que es más robusto y alineado con la base de datos.

---
