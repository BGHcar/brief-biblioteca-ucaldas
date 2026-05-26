**API Docs**

- **Base URL:** `/api`

**Endpoints principales**

## 📚 Catálogo (Libros)

- **GET /libros**: Lista todos los libros.
  - Query: `disponibles=true` (opcional) — filtra solo libros con ejemplares disponibles.
  - Respuesta 200: array de `Libro`.

- **POST /libros**: **(Admin)** Agregar un nuevo libro al catálogo.
  - Body JSON:
    - `libro_id` (string, requerido)
    - `titulo` (string, requerido)
    - `autor` (string, requerido)
    - `sala` (string, requerido)
    - `alta_demanda` (boolean, opcional, default: false)
  - 201: `{ mensaje: 'Libro agregado exitosamente', libro: Libro }`
  - 400: `{ error: 'libro_id, titulo, autor y sala son requeridos' }`

- **GET /libros/:libro_id**: Detalle de un libro.
  - 200: `Libro`
  - 404: `{ error: 'Libro LIB-XXX no encontrado' }`

## 📖 Ejemplares

- **POST /ejemplares**: **(Admin)** Agregar un nuevo ejemplar al catálogo.
  - Body JSON:
    - `ejemplar_id` (string, requerido)
    - `libro_id` (string, requerido)
    - `disponible` (boolean, opcional, default: true)
  - 201: `{ mensaje: 'Ejemplar agregado exitosamente', ejemplar: Ejemplar }`
  - 400: `{ error: 'ejemplar_id y libro_id son requeridos' }`
  - 404: `{ error: 'Libro {libro_id} no encontrado' }`

- **POST /prestamos**: Crear nuevo préstamo.
  - Body JSON:
    - `estudiante_id` (string, requerido)
    - `ejemplar_id` (string, requerido)
    - `fechaPrestamoSimulada` (string ISO 8601, opcional) — si se suministra, la fecha del préstamo se guardará usando este valor (útil para pruebas).
  - 201: `Prestamo` (objeto)
  - 400: `{ error: 'estudiante_id y ejemplar_id son requeridos' }` o `{ error: 'fechaPrestamoSimulada inválida' }`
  - 404: cuando estudiante/ejemplar/libro no existen
  - 409: conflictos de reglas de negocio — ejemplo:
    - `{ error: 'limite_prestamos_alcanzado', limite: 3, actuales: 3 }`
    - `{ error: 'prestamo_vencido_sin_devolver', prestamo_id: '...' }`
    - `{ error: 'multas_pendientes', multas: [...] }`

- **GET /prestamos/:prestamo_id**: Obtener préstamo.
  - 200: `Prestamo`
  - 404: `{ error: 'Préstamo no encontrado' }`

- **POST /prestamos/:prestamo_id/devolver**: Registrar devolución.
  - Body JSON: `{ fecha_devolucion_real: string (ISO 8601) }` (requerido)
  - 200: `Prestamo` actualizado (puede generar multa)
  - 400: `{ error: 'fecha_devolucion_real es requerida' }`
  - 404: préstamo no encontrado

- **POST /prestamos/:prestamo_id/renovar**: Renovar préstamo.
  - 200: `Prestamo` actualizado
  - 409: `{ error: 'renovacion_no_permitida', razon: 'otro_estudiante_espera_libro' }`

- **GET /estudiantes/:estudiante_id**: Info estudiante.
  - 200: `Estudiante`
  - 404: `{ error: 'Estudiante no encontrado' }`

- **GET /estudiantes/:estudiante_id/prestamos**: Préstamos vigentes del estudiante.
  - 200: array `Prestamo` activos

- **GET /estudiantes/:estudiante_id/historial**: Historial completo.
  - 200: array `Prestamo`

- **GET /estudiantes/:estudiante_id/multas**: Listar multas.
  - 200: array `Multa`

- **POST /estudiantes/:estudiante_id/multas/:multa_id/pagar**: Marcar multa como pagada.
  - 200: `Multa` actualizada (estado: `pagada`)
  - 400: `{ error: 'La multa no pertenece al estudiante' }`
  - 404: `{ error: 'Multa no encontrada' }`

**Modelos (resumen)**
- `Libro`: { libro_id, titulo, autor, sala, alta_demanda }
- `Ejemplar`: { ejemplar_id, libro_id, disponible }
- `Estudiante`: { estudiante_id, nombre, programa_academico, semestre, tipo_estudiante, multa_pendiente }
- `Prestamo`: { prestamo_id, estudiante_id, ejemplar_id, fecha_prestamo, fecha_devolucion_esperada, fecha_devolucion_real, estado, renovado }
- `Multa`: { multa_id, estudiante_id, prestamo_id, monto, dias_retraso, estado, fecha_calculo }

**Códigos de estado y errores**
- `400 Bad Request`: Datos faltantes o formato inválido.
- `404 Not Found`: Recurso no existe en la base de datos.
- `409 Conflict`: Violación de regla negocio (límite de préstamos, multas pendientes, préstamos vencidos, renovación no permitida).

**Notas**
- La creación de préstamo acepta `fechaPrestamoSimulada` (ISO) para pruebas que necesitan simular vencimientos o devoluciones en fechas pasadas.
- La base de datos SQLite se guarda en `proyecto/biblioteca.db`. Para inicializar con el seed predefinido, ejecutar el script `proyecto/sql/init.sql` con un cliente SQLite.

**Inicialización Automática del Catálogo**
- Al ejecutar `npm run dev`, si la base de datos está vacía, se carga automáticamente el catálogo de ejemplo con:
  - 3 libros (LIB001, LIB002, LIB003)
  - 5 ejemplares distribuidos (EJ001-EJ005)
  - 3 estudiantes de prueba (EST001-EST003)
- Este comportamiento **solo ocurre en desarrollo** (`NODE_ENV !== 'test'`). 
- Durante pruebas unitarias (`npm test`), se usa una BD en memoria sin seed automático.
- Puede agregar más libros/ejemplares dinámicamente usando los endpoints `POST /libros` y `POST /ejemplares`.
