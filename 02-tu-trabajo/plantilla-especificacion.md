# Especificación Formal — Sistema de Préstamo de Libros

> **Autor:** [Bryan Cartagena Hincapie]
> **Fecha:** [05/05/2026]
> **Versión:** 1.0
> **Brief de origen:** Correo de Diana Restrepo, Coordinadora de Biblioteca

> Lo que está entre corchetes `[...]` es lo que tú debes escribir.

---

## 1. Propósito del sistema

Sistema API REST que permite gestionar el préstamo de libros de la biblioteca de la Universidad de Caldas, automatizando el control de disponibilidad, límites de préstamo por tipo de estudiante, cálculo de multas por retraso, renovaciones y notificación de vencimientos.

---

## 2. Alcance

**Incluido en esta versión:**

- Consulta del catálogo de libros y disponibilidad
- Solicitud de préstamos por parte de estudiantes de pregrado y posgrado
- Registro de devoluciones de libros
- Consulta de préstamos vigentes de un estudiante
- Cálculo automático de multas por retraso (2.000 pesos/día)
- Detección y bloqueo de préstamos vencidos sin devolver
- Renovación de préstamos (si no hay solicitudes pendientes)
- Generación de datos en memoria
- Historial completo de préstamos por estudiante
- Control de límites de préstamos según tipo de estudiante (pregrado: 3, posgrado: 5)

**Explícitamente fuera del alcance:**

- Funcionalidades para profesores investigadores
- Integración con base de datos (datos persistidos en memoria)
- Frontend de usuario
- Sistema de autenticación
- Integración con app móvil o portal de estudiantes

---

## 3. Modelo de datos

### Entidad: Libro

| Campo     | Tipo     | Obligatorio | Descripción   |
| `libro_id` | `string` | sí       | Identificador único del libro |
| `titulo` | `string` | sí       | Título del libro |
| `autor` | `string` | sí       | Autor del libro |
| `sala` | `string` | sí       | Ubicación física (sala de la biblioteca) |
| `alta_demanda` | `boolean` | sí       | Indica si es libro de alta demanda (plazo 3 días) |



### Entidad: Ejemplar

| Campo     | Tipo     | Obligatorio | Descripción   |
| `ejemplar_id` | `string` | sí       | Identificador único por ejemplar (código de inventario) |
| `libro_id` | `foreign key` | sí       | Referencia al libro catálogo |
| `disponible` | `boolean` | sí       | Indica si el ejemplar está disponible para préstamo |

### Entidad: Estudiante

| Campo     | Tipo     | Obligatorio | Descripción   |
| `estudiante_id` | `string` | sí       | Identificador único del estudiante |
| `nombre` | `string` | sí       | Nombre completo del estudiante |
| `programa_academico` | `string` | sí       | Programa académico (pregrado/posgrado) |
| `semestre` | `int` | sí       | Semestre actual del estudiante |
| `tipo_estudiante` | `enum` | sí       | Tipo: "pregrado" o "posgrado" |
| `multa_pendiente` | `boolean` | sí       | Indica si tiene multas sin pagar |

### Entidad: Préstamo

| Campo     | Tipo     | Obligatorio | Descripción   |
| `prestamo_id` | `string` | sí       | Identificador único del préstamo |
| `estudiante_id` | `foreign key` | sí       | Referencia al estudiante |
| `ejemplar_id` | `foreign key` | sí       | Referencia al ejemplar prestado |
| `fecha_prestamo` | `date` | sí       | Fecha de inicio del préstamo |
| `fecha_devolucion_esperada` | `date` | sí       | Fecha en que debe devolver (15 o 3 días) |
| `fecha_devolucion_real` | `date` | no       | Fecha actual de devolución |
| `estado` | `enum` | sí       | "activo", "devuelto", "vencido" |
| `renovado` | `boolean` | sí       | Si el préstamo fue renovado |

### Entidad: Multa

| Campo     | Tipo     | Obligatorio | Descripción   |
| `multa_id` | `string` | sí       | Identificador único de la multa |
| `estudiante_id` | `foreign key` | sí       | Referencia al estudiante multado |
| `prestamo_id` | `foreign key` | sí       | Referencia al préstamo que generó multa |
| `monto` | `number` | sí       | Monto en pesos (2.000 por día de retraso) |
| `dias_retraso` | `int` | sí       | Número de días de retraso |
| `estado` | `enum` | sí       | "pendiente" o "pagada" |
| `fecha_calculo` | `date` | sí       | Fecha en que se calculó la multa |

### Diagrama de relaciones

```
Libro 1 --- N Ejemplar
Estudiante 1 --- N Prestamo
Estudiante 1 --- N Multa
Ejemplar 1 --- N Prestamo (a lo largo del tiempo)
Prestamo 0..1 --- 1 Multa
```

---

## 4. Endpoints REST

| Método | Ruta | Propósito | Body / Query | Respuesta éxito | Códigos error posibles |
|---|---|---|---|---|---|
| `GET` | `/libros` | Listar catálogo completo | query: `disponibles=true` (opcional) | `200` con lista | - |
| `GET` | `/libros/:libro_id` | Detalle de un libro | - | `200` con objeto | `404` |
| `POST` | `/prestamos` | Crear nuevo préstamo | `{estudiante_id, ejemplar_id}` | `201` con préstamo creado | `400`, `404`, `409` |
| `GET` | `/prestamos/:prestamo_id` | Obtener detalles de un préstamo | - | `200` con objeto | `404` |
| `GET` | `/estudiantes/:estudiante_id/prestamos` | Listar préstamos vigentes de un estudiante | query: `estado=activo` | `200` con lista | `404` |
| `GET` | `/estudiantes/:estudiante_id/historial` | Historial completo de préstamos | - | `200` con lista | `404` |
| `POST` | `/prestamos/:prestamo_id/devolver` | Registrar devolución de un libro | `{fecha_devolucion_real}` | `200` con préstamo actualizado | `400`, `404`, `409` |
| `POST` | `/prestamos/:prestamo_id/renovar` | Renovar un préstamo | - | `200` con préstamo renovado | `400`, `404`, `409` |
| `GET` | `/estudiantes/:estudiante_id/multas` | Listar multas de un estudiante | - | `200` con lista | `404` |
| `GET` | `/estudiantes/:estudiante_id` | Información del estudiante | - | `200` con objeto | `404` |

---

## 5. Reglas de negocio

### RN1 — Límite de préstamos por tipo de estudiante

- **Trigger:** al recibir `POST /prestamos`.
- **Condición:**
  - Estudiante de pregrado: máximo 3 préstamos con `estado = "activo"`.
  - Estudiante de posgrado: máximo 5 préstamos con `estado = "activo"`.
- **Acción si cumple:** continuar con el flujo de creación.
- **Acción si no cumple:** retornar `409 Conflict` con `{error: "limite_prestamos_alcanzado", limite: N, actuales: M}`.

### RN2 — Cálculo de plazo según tipo de libro

- **Trigger:** al crear un préstamo (`POST /prestamos`).
- **Condición:**
  - Si el libro es marcado como "alta demanda": plazo = 3 días.
  - Si el libro es normal: plazo = 15 días.
- **Acción si cumple:** `fecha_devolucion_esperada = fecha_prestamo + plazo`.
- **Acción si no cumple:** no aplica; siempre se ejecuta.

### RN3 — Bloqueo de préstamo si hay vencido sin devolver

- **Trigger:** al intentar crear un préstamo (`POST /prestamos`).
- **Condición:** el estudiante tiene al menos un préstamo con `estado = "vencido"` y `fecha_devolucion_real = null`.
- **Acción si cumple:** retornar `409 Conflict` con `{error: "prestamo_vencido_sin_devolver", prestamo_id: ID}`.
- **Acción si no cumple:** continuar con el flujo.

### RN4 — Bloqueo de préstamo si tiene multas pendientes

- **Trigger:** al intentar crear un préstamo (`POST /prestamos`).
- **Condición:** el estudiante tiene multas con `estado = "pendiente"`.
- **Acción si cumple:** retornar `409 Conflict` con `{error: "multas_pendientes"}` y listar multas.
- **Acción si no cumple:** continuar con el flujo.

### RN5 — Control de disponibilidad del ejemplar

- **Trigger:** al crear un préstamo (`POST /prestamos`).
- **Condición:** el ejemplar tiene `disponible = true` y no está referenciado en otro préstamo con `estado = "activo"`.
- **Acción si cumple:** marcar ejemplar como `disponible = false` y crear préstamo.
- **Acción si no cumple:** retornar `409 Conflict` con `{error: "ejemplar_no_disponible"}`.

### RN6 — Cálculo automático de multa en devolución tardía

- **Trigger:** al devolver un libro (`POST /prestamos/:prestamo_id/devolver`).
- **Condición:** `fecha_devolucion_real > fecha_devolucion_esperada`.
- **Acción si cumple:** 
  - `dias_retraso = diferenciaEnDias(fecha_devolucion_real, fecha_devolucion_esperada)`
  - `monto = dias_retraso * 2000`
  - Crear multa con `estado = "pendiente"`
  - Marcar estudiante con `multa_pendiente = true`
- **Acción si no cumple:** crear devolución sin multa.

### RN7 — Renovación solo si no hay solicitudes pendientes

- **Trigger:** al solicitar renovación (`POST /prestamos/:prestamo_id/renovar`).
- **Condición:** no existe otro préstamo o solicitud pendiente para el mismo ejemplar de otro estudiante.
- **Acción si cumple:** 
  - Extender `fecha_devolucion_esperada` por 15 días (o 3 si es alta demanda)
  - Marcar `renovado = true`
  - Retornar `200` con préstamo actualizado
- **Acción si no cumple:** retornar `409 Conflict` con `{error: "renovacion_no_permitida", razon: "otro_estudiante_espera_libro"}`.

### RN8 — Detección automática de vencimiento

- **Trigger:** cualquier operación que consulte préstamos.
- **Condición:** `fecha_devolucion_esperada < hoy` y `estado = "activo"` y `fecha_devolucion_real = null`.
- **Acción si cumple:** marcar préstamo con `estado = "vencido"`.
- **Acción si no cumple:** mantener estado actual.


---

## 6. Decisiones tomadas (lo que el correo no dice)

### D1 — Cálculo de días para multa

- **Contexto:** el correo no precisa si los días de retraso son calendario o hábiles.
- **Decisión:** usar días calendario.
- **Justificación:** es la interpretación más simple y se alinea con lo que la mayoría de bibliotecas hacen.

### D2 — Ejemplares vs. Libros

- **Contexto:** el correo menciona que un libro puede tener varios ejemplares, cada uno con código aparte.
- **Decisión:** crear entidad separada "Ejemplar" con su propio ID único, y que cada préstamo referencia a un ejemplar específico, no al libro.
- **Justificación:** permite controlar disponibilidad de cada copia física independientemente.

### D3 — Automatización del estado "vencido"

- **Contexto:** el correo no especifica cuándo se marca un préstamo como vencido ni quién lo hace.
- **Decisión:** marcar automáticamente como "vencido" cuando se consulta un préstamo y `fecha_devolucion_esperada < hoy`.
- **Justificación:** evita la necesidad de un proceso batch externo y refleja el estado real en tiempo de consulta.

### D4 — Renovación por tipo de libro, no por estudiante

- **Contexto:** el correo menciona que libros de alta demanda se renuevan 3 días, los normales 15.
- **Decisión:** la renovación extiende el plazo según el tipo de libro original, no según el estudiante.
- **Justificación:** alinea con la política de biblioteca: los plazos los define la disponibilidad, no el tipo de estudiante.

### D5 — Multa pendiente como flag booleano

- **Contexto:** el correo dice que si tiene multas pendientes no puede prestar. No especifica si es suma total o existencia.
- **Decisión:** usar flag booleano `multa_pendiente` que se activa si existe cualquier multa con estado="pendiente".
- **Justificación:** simplifica la validación en cada préstamo sin necesidad de consultar tabla de multas cada vez.

### D6 — Datos en memoria sin persistencia

- **Contexto:** el cliente dice "manejen los datos en memoria por ahora", y menciona base de datos después.
- **Decisión:** usar arrays u objetos en memoria (sin MongoDB, PostgreSQL, etc.).
- **Justificación:** cumple requisito del cliente para la versión 1.0; la persistencia es trabajo futuro.


## 7. Códigos HTTP usados

| Código | Significado | Cuándo se usa |
|---|---|---|
| 200 | OK | GET exitosos |
| 201 | Created | POST exitosos que crean recursos |
| 400 | Bad Request | Body malformado o validación fallida |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Reglas de negocio violadas (límite alcanzado, duplicado, etc.) |
| 500 | Internal Server Error | Error no controlado del servidor |


---

## 8. Restricciones técnicas

- **Stack:** Node.js 20 LTS + Express
- **Persistencia:** datos en memoria. No usar base de datos.
- **TypeScript:** Sí.
- **Sin autenticación** en esta versión.
- **Sin frontend** en esta versión. Solo API REST.