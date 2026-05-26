## Prompt #5

**Fecha y hora:** 2026-05-26 00:00

**Propósito en una línea:** Registrar el prompt de auditoría para el análisis de brecha de la API con respecto al plan de pruebas y la especificación del taller.

**Etapa del taller:** 4

**IA usada:** Tu entorno actual.

---

### Prompt enviado (literal)

```
## TAREA 3: Ejecutar el Análisis de Brecha (Contenido para el Prompt #5)
Una vez creados y guardados los archivos de la Tarea 1 y Tarea 2 en la carpeta correspondiente, procede a realizar un análisis de brecha exhaustivo de la API actual frente al documento de especificaciones y al plan de pruebas ("02-tu-trabajo\pruebas-reglas-negocio.md" hasta la línea 92 e identificando lo faltante en adelante).

Genera un archivo en la raíz del proyecto llamado exactamente `auditoria.md` con la siguiente estructura:

# Informe de Auditoría y Análisis de Brecha — Sistema de Biblioteca
**Fecha:** 2026-05-26

## 1. Estado de Cobertura Actual (Hasta Línea 92 del Plan de Pruebas)
- Detalla qué endpoints y lógicas del Paso 1.1 y 1.2 ya están completamente operativos y verificados en desarrollo (Seeding automático de libros, ejemplares, estudiantes, y los endpoints POST de administración).

## 2. Análisis de Endpoints y Lógicas Faltantes (Gap Analysis)
Identifica qué elementos hacen falta en el código actual (`src/rutas/rutas.ts`, `src/servicios/servicio-prestamo-libros.ts`, etc.) para cumplir con el plan de pruebas del taller (línea 93 en adelante). Evalúa explícitamente:
- **RN3 (Préstamos vencidos):** ¿El endpoint `POST /api/prestamos` soporta la propiedad opcional `fechaPrestamoSimulada` para guardar fechas en el pasado?
- **RN4 y RN8 (Cálculo de multas y Devoluciones):** ¿El endpoint `POST /api/prestamos/:prestamo_id/devolver` calcula la multa con Math.ceil() cobrando 2000 COP por día de retraso?
- **RN7 (Lista de espera / Renovación):** ¿Existe soporte en la base de datos para simular o manejar una lista de espera al renovar?
- **Validaciones de datos (VAL-4):** ¿Hay middleware para rechazar payloads malformados (ej. IDs numéricos)?
- **Endpoints de consulta faltantes:** Lista cuáles endpoints de lectura especificados en los API Docs faltan por mapear (ej. GET de historial, multas o préstamos vigentes por estudiante).

## 3. Plan de Ruta para Refactorización Impecable
- Diseña una lista numerada de pasos sugeridos para implementar lo faltante. Las refactorizaciones deben mantener intactos y en verde los 11 tests unitarios existentes.

---

### Resumen de la respuesta de la IA

[Pendiente de completar después de ejecutar el análisis.]

---

### Mi evaluación

**¿La respuesta cumplió con lo que pedí?**

- [ ] Completamente.
- [ ] Parcialmente. Faltó: [...]
- [ ] No, se desvió. Hizo: [...]

**¿La acepté tal cual o la modifiqué?**

- [ ] Tal cual.
- [ ] La modifiqué a mano. Cambios: [...]
- [ ] Le pedí corrección con un prompt nuevo (ver prompt #[N+1]).
- [ ] La rechacé completamente. Razón: [...]

**¿Qué aprendí de esta interacción?**

[Pendiente de completar después de la auditoría.]
