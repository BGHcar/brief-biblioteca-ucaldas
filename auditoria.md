# Informe de Auditoría y Análisis de Brecha — Sistema de Biblioteca
**Fecha:** 2026-05-26

## 1. Estado de Cobertura Actual (Hasta Línea 92 del Plan de Pruebas)
- El sistema ya soporta la creación de libros mediante `POST /api/libros` y la creación de ejemplares mediante `POST /api/ejemplares`, lo que cubre el Paso 1.2 del plan de pruebas.
- El auto-seed dinámico en `app.ts` permite cargar un catálogo inicial en desarrollo cuando la base de datos está vacía, incluyendo libros, ejemplares y estudiantes de prueba.
- El endpoint `POST /api/prestamos` existe y se puede invocar, lo que permite ejecutar las pruebas de creación de préstamos en RN1, RN2 y RN5.
- El endpoint `POST /api/prestamos/:prestamo_id/devolver` también está presente, lo cual es necesario para las pruebas de devoluciones y multas.
- El endpoint `POST /api/estudiantes/:estudiante_id/multas/:multa_id/pagar` está implementado y cubre acciones de pago de multas, aunque no forma parte directa del Paso 1.1/1.2.

## 2. Análisis de Endpoints y Lógicas Faltantes (Gap Analysis)
A partir del plan de pruebas del taller, se identifican las siguientes brechas en el código actual:

- **RN3 (Préstamos vencidos):**
  - El endpoint `POST /api/prestamos` acepta `fechaPrestamoSimulada` en el body, lo que permite crear préstamos con fecha en el pasado para simular vencidos. Sin embargo, es necesario confirmar que este campo se usa correctamente en la lógica de creación de préstamo y que el estado `VENCIDO` se actualiza en la consulta de préstamos.

- **RN4 y RN8 (Cálculo de multas y Devoluciones):**
  - El endpoint `POST /api/prestamos/:prestamo_id/devolver` existe, pero falta verificar si la lógica de cálculo de multa usa `Math.ceil()` sobre los días de retraso y aplica exactamente `2000 COP` por día.
  - También se debe validar si el endpoint devuelve el monto de multa en la respuesta y si marca la multa como pendiente correctamente.

- **RN7 (Lista de espera / Renovación):**
  - No hay evidencia en la base de datos ni en la capa de rutas/servicios de un mecanismo de lista de espera o reserva de ejemplares para bloquear renovaciones.
  - El endpoint de renovación existe (`POST /api/prestamos/:prestamo_id/renovar`), pero el soporte para denegarla por lista de espera debe implementarse explícitamente y probablemente requiere tablas o estructuras adicionales.

- **Validaciones de datos (VAL-4):**
  - No hay middleware dedicado que rechace payloads malformados en todas las rutas.
  - El código actual valida algunos campos obligatorios manualmente en los endpoints de préstamos, pero no hay validación fuerte de tipos (por ejemplo, rechazar IDs numéricos o valores booleanos incorrectos).

- **Endpoints de consulta faltantes:**
  - Las rutas de lectura requeridas para el plan parecen estar parcialmente presentes, pero es necesario verificar si se implementaron exactamente los siguientes endpoints:
    - `GET /api/estudiantes/:estudiante_id/prestamos` para préstamos vigentes.
    - `GET /api/estudiantes/:estudiante_id/historial` para historial completo.
    - `GET /api/estudiantes/:estudiante_id/multas` para listar multas por estudiante.
  - En la documentación de la API aparecen estos endpoints, pero la brecha real es confirmar si todos están mapeados con la sintaxis esperada y si devuelven los datos correctos según el plan.

## 3. Plan de Ruta para Refactorización Impecable
1. Verificar y documentar el comportamiento actual de `fechaPrestamoSimulada` en `servicio-prestamo-libros.ts` y comprobar que genera préstamos vencidos cuando se utiliza.
2. Auditar la lógica de devolución en `servicio-prestamo-libros.ts` para garantizar que `Math.ceil()` se usa en el cálculo de días de retraso y que se cobra `2000 COP` por cada día completo de tardanza.
3. Añadir validación centralizada de payloads con middleware para `POST /api/prestamos` y otros endpoints críticos, rechazando datos con tipos incorrectos (IDs no string, booleanos mal tipeados, etc.).
4. Verificar y completar todos los endpoints de consulta en `src/rutas/rutas.ts`, en especial los de historial, multas y préstamos vigentes por estudiante.
5. Implementar el soporte de lista de espera para renovaciones si el requerimiento RN7 debe cumplirse: añadir tabla o campo de reserva, endpoint de solicitud de espera, y lógica de bloqueo en `renovarPrestamo`.
6. Mantener los 11 tests actuales en verde construyendo pruebas unitarias adicionales para las nuevas validaciones y para los escenarios de `fechaPrestamoSimulada`, cálculo de multa y renovación bloqueada.
7. Actualizar la documentación en `API_DOCS.md` para reflejar los endpoints de administración, la semántica de `fechaPrestamoSimulada`, y el comportamiento exacto de los errores 400/404/409.
