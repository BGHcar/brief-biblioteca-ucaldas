# API Documentation — Biblioteca UCaldas

**Base URL:** `http://localhost:3000/api`

---

## 1. Resumen de módulos

### Catálogo de Libros y Ejemplares
- `GET /api/libros`
- `POST /api/libros`
- `GET /api/libros/:libro_id`
- `POST /api/libros/:libro_id/ejemplares`

### Gestión de Estudiantes
- `GET /api/estudiantes/:estudiante_id`
- `GET /api/estudiantes/:estudiante_id/prestamos`
- `GET /api/estudiantes/:estudiante_id/historial`
- `GET /api/estudiantes/:estudiante_id/multas`
- `POST /api/estudiantes/:estudiante_id/multas/:multa_id/pagar`

### Operaciones de Préstamos
- `POST /api/prestamos`
- `GET /api/prestamos/:prestamo_id`
- `POST /api/prestamos/:prestamo_id/devolver`
- `POST /api/prestamos/:prestamo_id/renovar`

---

## 2. Catálogo de Libros

### `GET /api/libros`
Obtiene la lista de libros del catálogo.

- Query opcional:
  - `disponibles=true` — retorna solo libros con al menos un ejemplar disponible.

**Respuesta:** `200 OK`
```json
[{
  "libro_id": "LIB-001",
  "titulo": "Algoritmos en TypeScript",
  "autor": "Donald Knuth",
  "sala": "Tecnología",
  "alta_demanda": false
}]
```

### `POST /api/libros`
Agrega un nuevo libro al catálogo.

**Body JSON:**
```json
{
  "libro_id": "LIB-004",
  "titulo": "Base de Datos",
  "autor": "E. Codd",
  "sala": "Sistemas",
  "alta_demanda": true
}
```

**Respuestas:**
- `201 Created`
- `400 Bad Request` si faltan campos obligatorios.

### `GET /api/libros/:libro_id`
Recupera los datos de un libro por su identificador.

**Parámetro:**
- `:libro_id` — identificador del libro.

**Respuestas:**
- `200 OK`
- `404 Not Found` si el libro no existe.

---

## 3. Ejemplares

### `POST /api/libros/:libro_id/ejemplares`
Agrega un nuevo ejemplar a un libro existente.

**Parámetro:**
- `:libro_id` — identificador del libro al que pertenece el ejemplar.

**Body JSON:**
```json
{
  "ejemplar_id": "EJ-001-03",
  "disponible": true
}
```

**Respuestas:**
- `201 Created`
- `400 Bad Request` si falta `ejemplar_id`.
- `404 Not Found` si el libro no existe.

---

## 4. Operaciones de Préstamos

### `POST /api/prestamos`
Crea un nuevo préstamo y aplica las reglas de negocio core.

**Body JSON:**
```json
{
  "estudiante_id": "EST-PRE-01",
  "ejemplar_id": "EJ-001-01",
  "fechaPrestamoSimulada": "2026-05-20T10:00:00.000Z"
}
```

**Campos:**
- `estudiante_id` — ID del estudiante que solicita el préstamo.
- `ejemplar_id` — ID del ejemplar a prestar.
- `fechaPrestamoSimulada` — fecha ISO opcional para simular la fecha de préstamo.

**Reglas de negocio relevantes:**
- RN1: pregrado máximo 3 préstamos activos.
- RN2: posgrado máximo 5 préstamos activos.
- RN3: no se permite préstamo si el estudiante tiene un préstamo activo vencido.
- RN5: no se permite prestar un ejemplar que ya está ocupado.
- RN6: libros de alta demanda tienen plazo de 3 días; normales tienen 15 días.

**Respuestas:**
- `201 Created` con el objeto `Prestamo`.
- `400 Bad Request` si falta un campo o `fechaPrestamoSimulada` es inválida.
- `404 Not Found` si estudiante, ejemplar o libro no existen.
- `409 Conflict` si se viola una regla de negocio.

### `GET /api/prestamos/:prestamo_id`
Obtiene los detalles de un préstamo específico.

**Respuestas:**
- `200 OK`
- `404 Not Found` si el préstamo no existe.

### `POST /api/prestamos/:prestamo_id/devolver`
Registra la devolución de un ejemplar.

**Body JSON:**
```json
{
  "fecha_devolucion_real": "2026-06-01T16:00:00.000Z"
}
```

**Respuestas:**
- `200 OK` con el préstamo actualizado.
- `400 Bad Request` si falta `fecha_devolucion_real` o el formato es inválido.
- `404 Not Found` si el préstamo no existe.

### `POST /api/prestamos/:prestamo_id/renovar`
Renueva un préstamo vigente.

**Respuestas:**
- `200 OK` con el préstamo actualizado.
- `409 Conflict` si la renovación no está permitida.

---

## 5. Gestión de Estudiantes

### `GET /api/estudiantes/:estudiante_id`
Recupera la información de un estudiante.

### `GET /api/estudiantes/:estudiante_id/prestamos`
Lista los préstamos vigentes del estudiante.

### `GET /api/estudiantes/:estudiante_id/historial`
Lista todos los préstamos registrados del estudiante.

### `GET /api/estudiantes/:estudiante_id/multas`
Lista las multas asociadas al estudiante.

### `POST /api/estudiantes/:estudiante_id/multas/:multa_id/pagar`
Marca una multa como pagada.

**Respuestas comunes:**
- `200 OK`
- `404 Not Found` si el estudiante o la multa no existen.
- `400 Bad Request` si la multa no pertenece al estudiante.

---

## 6. Ejemplos de `curl` en PowerShell

### Listar libros disponibles
```powershell
curl "http://localhost:3000/api/libros?disponibles=true"
```

### Crear un libro
```powershell
curl -X POST "http://localhost:3000/api/libros" `
  -H "Content-Type: application/json" `
  -d '{
    "libro_id": "LIB-004",
    "titulo": "Bases de Datos Relacionales",
    "autor": "E. F. Codd",
    "sala": "Sistemas",
    "alta_demanda": false
  }'
```

### Agregar un ejemplar a un libro
```powershell
curl -X POST "http://localhost:3000/api/libros/LIB-001/ejemplares" `
  -H "Content-Type: application/json" `
  -d '{
    "ejemplar_id": "EJ-001-03",
    "disponible": true
  }'
```

### Crear un préstamo normal
```powershell
curl -X POST "http://localhost:3000/api/prestamos" `
  -H "Content-Type: application/json" `
  -d '{
    "estudiante_id": "EST-PRE-01",
    "ejemplar_id": "EJ-001-01"
  }'
```

### Crear un préstamo con fecha simulada
```powershell
curl -X POST "http://localhost:3000/api/prestamos" `
  -H "Content-Type: application/json" `
  -d '{
    "estudiante_id": "EST-POS-01",
    "ejemplar_id": "EJ-002-01",
    "fechaPrestamoSimulada": "2026-05-20T10:00:00.000Z"
  }'
```

### Devolver un préstamo
```powershell
curl -X POST "http://localhost:3000/api/prestamos/<PRESTAMO_ID>/devolver" `
  -H "Content-Type: application/json" `
  -d '{
    "fecha_devolucion_real": "2026-06-01T16:00:00.000Z"
  }'
```

### Pagar una multa
```powershell
curl -X POST "http://localhost:3000/api/estudiantes/EST-PRE-01/multas/<MULTA_ID>/pagar"
```

---

## 7. Diccionario de errores

### `400 Bad Request`
Se retorna cuando el cliente envía payload incompleto o con valores inválidos.

Ejemplos:
- Falta `estudiante_id` o `ejemplar_id` en `POST /api/prestamos`.
- `fechaPrestamoSimulada` no es una fecha ISO válida.
- Falta `fecha_devolucion_real` en `POST /api/prestamos/:prestamo_id/devolver`.

### `404 Not Found`
Se retorna cuando el recurso no existe en la base de datos.

Ejemplos:
- `GET /api/libros/LIB-XXX` con libro inexistente.
- `GET /api/estudiantes/NO-EXISTE`.
- `GET /api/prestamos/<PRESTAMO_ID>` si no hay préstamo.

### `409 Conflict`
Se retorna cuando la solicitud viola una regla de negocio.

Ejemplos:
- `RN1` o `RN2`: límite de préstamos activos alcanzado.
- `RN3`: intento de préstamo con un préstamo activo ya vencido.
- `RN5`: intento de prestar un ejemplar ocupado.
- `RN4`: préstamos bloqueados por multas pendientes.
- Renovación no permitida porque otro estudiante espera el ejemplar.

---

## 8. Modelos de datos expuestos

### `Libro`
```json
{
  "libro_id": "LIB-001",
  "titulo": "Algoritmos en TypeScript",
  "autor": "Donald Knuth",
  "sala": "Tecnología",
  "alta_demanda": false
}
```

### `Ejemplar`
```json
{
  "ejemplar_id": "EJ-001-01",
  "libro_id": "LIB-001",
  "disponible": true
}
```

### `Estudiante`
```json
{
  "estudiante_id": "EST-PRE-01",
  "nombre": "Juan Pérez",
  "programa_academico": "Ingeniería Sistemas",
  "semestre": 3,
  "tipo_estudiante": "pregrado",
  "multa_pendiente": false
}
```

### `Prestamo`
```json
{
  "prestamo_id": "...",
  "estudiante_id": "EST-PRE-01",
  "ejemplar_id": "EJ-001-01",
  "fecha_prestamo": "2026-05-26T10:00:00.000Z",
  "fecha_devolucion_esperada": "2026-06-10T10:00:00.000Z",
  "fecha_devolucion_real": null,
  "estado": "activo",
  "renovado": false
}
```

### `Multa`
```json
{
  "multa_id": "...",
  "estudiante_id": "EST-PRE-01",
  "prestamo_id": "...",
  "monto": 2000,
  "dias_retraso": 1,
  "estado": "pendiente",
  "fecha_calculo": "2026-06-01T16:00:00.000Z"
}
```
