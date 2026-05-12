# Guía Rápida — Sistema de Préstamo de Libros

## Inicio rápido

```bash
cd proyecto
npm install
npm run dev
```

La API estará disponible en `http://localhost:3000`

---

## Ejemplos de uso (curl)

### 1. Listar libros disponibles
```bash
curl http://localhost:3000/api/libros?disponibles=true
```

Respuesta:
```json
[
  {
    "libro_id": "LIB001",
    "titulo": "Algoritmos en TypeScript",
    "autor": "Donald Knuth",
    "sala": "Tecnología",
    "alta_demanda": true
  }
]
```

### 2. Obtener información de un estudiante
```bash
curl http://localhost:3000/api/estudiantes/EST001
```

### 3. Crear un préstamo
```bash
curl -X POST http://localhost:3000/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST001",
    "ejemplar_id": "EJ001"
  }'
```

Respuesta (201 Created):
```json
{
  "prestamo_id": "abc-123-def",
  "estudiante_id": "EST001",
  "ejemplar_id": "EJ001",
  "fecha_prestamo": "2026-05-12T15:30:00.000Z",
  "fecha_devolucion_esperada": "2026-05-27T15:30:00.000Z",
  "fecha_devolucion_real": null,
  "estado": "activo",
  "renovado": false
}
```

### 4. Ver préstamos vigentes de un estudiante
```bash
curl http://localhost:3000/api/estudiantes/EST001/prestamos
```

### 5. Devolver un libro
```bash
curl -X POST http://localhost:3000/api/prestamos/abc-123-def/devolver \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_devolucion_real": "2026-05-25T10:00:00.000Z"
  }'
```

### 6. Ver multas
```bash
curl http://localhost:3000/api/estudiantes/EST001/multas
```

---

## Errores comunes

### 409 Conflict — Límite alcanzado
```json
{
  "error": "limite_prestamos_alcanzado",
  "limite": 3,
  "actuales": 3
}
```
**Solución:** El estudiante debe devolver un libro antes de pedir otro.

### 409 Conflict — Multas pendientes
```json
{
  "error": "multas_pendientes",
  "multas": [...]
}
```
**Solución:** El estudiante debe pagar las multas antes (endpoint futuro).

### 404 Not Found
```json
{
  "error": "Estudiante no encontrado"
}
```
**Solución:** Verificar que el ID existe en los datos iniciales.

---

## Datos de prueba iniciales

### Estudiantes
- EST001: Juan Pérez (Pregrado, máx 3)
- EST002: María González (Posgrado, máx 5)
- EST003: Carlos López (Pregrado, máx 3)

### Libros
- LIB001: Algoritmos en TypeScript (Alta demanda: 3 días)
- LIB002: Historia de Colombia (Normal: 15 días)
- LIB003: Cálculo Superior (Alta demanda: 3 días)

### Ejemplares
- EJ001: Ejemplar de LIB001 (disponible)
- EJ002: Ejemplar de LIB001 (disponible)
- EJ003: Ejemplar de LIB002 (disponible)
- EJ004: Ejemplar de LIB003 (disponible)

---

## Pruebas recomendadas

### Caso 1: Flujo normal
1. Crear préstamo para EST001 con EJ001
2. Ver préstamos vigentes de EST001
3. Devolver el préstamo a tiempo
4. Verificar que ejemplar vuelve a estar disponible

### Caso 2: Incumplimiento con multa
1. Crear préstamo para EST001 con EJ001
2. Devolver con 5 días de retraso
3. Ver multas de EST001 (debe haber una multa de 10.000)
4. Intentar crear otro préstamo (debe fallar por multas pendientes)

### Caso 3: Límite de préstamos
1. Crear 3 préstamos para EST001 (con EJ001, EJ002, EJ003)
2. Intentar crear 4to préstamo (debe fallar con 409)
3. Devolver uno
4. Crear 4to préstamo (debe ser exitoso)

---

## Ejecutar tests automáticamente

```bash
npm test
```

Todos los tests deben pasar: **11/11 ✅**

---

## Stack técnico

- **Runtime:** Node.js 20 LTS
- **Framework:** Express 4.18
- **Lenguaje:** TypeScript 5.0
- **Testing:** Jest 29.5
- **Persistencia:** En memoria (Maps)

---

## Próximas mejoras (fuera del scope)

1. [ ] Endpoint POST para pagar multas
2. [ ] Persistencia en PostgreSQL o MongoDB
3. [ ] Autenticación JWT
4. [ ] Rate limiting
5. [ ] Swagger/OpenAPI documentation
6. [ ] Tests E2E con Postman
7. [ ] Docker & Docker Compose
8. [ ] CI/CD pipeline (GitHub Actions)
