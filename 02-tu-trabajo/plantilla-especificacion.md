# Especificación Formal — Sistema de Préstamo de Libros

> **Autor:** [Bryan Cartagena Hincapie]
> **Fecha:** [05/05/2026]
> **Versión:** 1.0
> **Brief de origen:** Correo de Diana Restrepo, Coordinadora de Biblioteca

> Lo que está entre corchetes `[...]` es lo que tú debes escribir.

---

## 1. Propósito del sistema

[Se desea digitalizar un sistema inteligente de una biblioteca para administrar el prestamo de libros, debido a su alto flujo, se deben tener en cuenta varias condiciones para el correcto funcionamiento de la aplicación]

---

## 2. Alcance

**Incluido en esta versión:**

- [Consulta catalogo de libros disponibles]
- [Solicitud de prestamos por porta de los estudiantes]
- [Devolución de prestamos por parte de los estudiantes]
- [Consulta de prestamos vigentes por parte de los estudiantes]
- [Calculo de multas por incumplimiento del prestamo]
- [Automatización por dias para informar el vencimiento de un prestamos]
- [Generación de datos en memoria]
- [Historial de prestamos por estudiante]

**Explícitamente fuera del alcance:**

- [Funcionalidades para profesores investigadores]
- [Integración con base de datos especifica]
- [FrontEnd]

---

## 3. Modelo de datos

### Entidad: Libro

| Campo     | Tipo     | Obligatorio | Descripción   |
| `[libro_id]` | `[string]` | sí       | [identificador unico por libro] |
| `[nombre]` | `[string]` | sí       | [Nombre del libro] |
| `[autor]` | `[string]` | sí       | [Autor del libro] |
| `[cantidad]` | `[int]` | si       | [cantidad de libros que tiene la biblioteca] |
| `[cantidad_disponible]` | `[int]` | si       | [cantidad actual de libros para prestamo] |



### Entidad: Ejemplar

| Campo     | Tipo     | Obligatorio | Descripción   |
| `[ejemplar_id]` | `[string]` | sí       | [identificador unico por ejemplar] |
| `[disponible]` | `[boolean]` | si       | [identificador unico por libro] |
| `[libro_id]` | `[foreign key]` | si       | [identificador por libro] |
| `[prestamo_id]` | `[foreign key]` | no       | [identificador por libro] |

### Entidad: Estudiante

[Tabla de campos]

### Entidad: Préstamo

[Tabla de campos. Aquí va estudiante_id, ejemplar_id, fecha_prestamo, fecha_devolucion_esperada, fecha_devolucion_real, estado, etc.]

### Entidad: Multa

[Tabla de campos]

### Diagrama de relaciones

```
[Dibuja con texto las relaciones. Por ejemplo:

Libro 1 --- N Ejemplar
Estudiante 1 --- N Prestamo
Ejemplar 1 --- N Prestamo (a lo largo del tiempo)
Prestamo 0..1 --- 1 Multa
]
```

---

## 4. Endpoints REST

| Método | Ruta | Propósito | Body / Query | Respuesta éxito | Códigos error posibles |
|---|---|---|---|---|---|
| `GET` | `/libros` | Listar catálogo | filtros opcionales | `200` con lista | - |
| `GET` | `/libros/:id` | Detalle libro | - | `200` con objeto | `404` |
| `POST` | `/prestamos` | Crear préstamo | `{estudiante_id, ejemplar_id}` | `201` con préstamo | `400`, `404`, `409` |
| ... | ... | ... | ... | ... | ... |

[Llena la tabla con todos los endpoints que necesitas. Mínimo 8.]

---

## 5. Reglas de negocio

### RN1 — [nombre corto de la regla]

- **Trigger:** [cuándo se evalúa]
- **Condición:** [qué se valida exactamente, en términos precisos]
- **Acción si cumple:** [qué hace el sistema]
- **Acción si no cumple:** [código HTTP, mensaje, qué retorna]

**Ejemplo:**

### RN1 — Límite de préstamos por tipo de estudiante

- **Trigger:** al recibir `POST /prestamos`.
- **Condición:**
  - Estudiante de pregrado: máximo 3 préstamos con `estado = "activo"`.
  - Estudiante de posgrado: máximo 5 préstamos con `estado = "activo"`.
- **Acción si cumple:** continuar con el flujo de creación.
- **Acción si no cumple:** retornar `409 Conflict` con `{error: "limite_prestamos_alcanzado", limite: N, actuales: M}`.

[Llena RN2, RN3, RN4... hasta cubrir todas las reglas del correo.]

### RN2 — [...]

[...]

### RN3 — [...]

[...]


---

## 6. Decisiones tomadas (lo que el correo no dice)

### D1 — [Decisión que tomaste]

- **Contexto:** [qué hueco había]
- **Decisión:** [qué decidiste]
- **Justificación:** [por qué esta decisión y no otra]

**Ejemplo:**

### D1 — Cálculo de días para multa

- **Contexto:** el correo no precisa si los días de retraso son calendario o hábiles.
- **Decisión:** usar días calendario.
- **Justificación:** es la interpretación más simple y se alinea con lo que la mayoría de bibliotecas hacen.

[Mínimo 5 decisiones documentadas.]

### D2, D3, D4, D5...


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

- **Stack:** [Node.js 20 LTS + Express]
- **Persistencia:** datos en memoria. No usar base de datos.
- **TypeScript** Si.
- **Sin autenticación** en esta versión.
- **Sin frontend** en esta versión. Solo API REST.