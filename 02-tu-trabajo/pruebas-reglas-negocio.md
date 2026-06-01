# Plan de Pruebas — Reglas de Negocio
## Biblioteca UCaldas — Etapa 4

Ejecuta estas pruebas contra **las dos versiones de tu proyecto**: la que generaste con IA y la que construiste manualmente (o el proyecto v1 del análisis). Anota los resultados en la tabla comparativa del final.

---

## Antes de empezar

### Variables — ajusta los puertos segun tu proyecto

```bash
# Version sin IA (o proyecto-v1 del analisis)
BASE_SIN_IA="http://localhost:3000"

# Version con IA (proyecto generado en Etapa 2)
BASE_CON_IA="http://localhost:3001"
```

> **Nota:** si tus endpoints usan rutas distintas a las de este archivo (por ejemplo `/prestamos` en lugar de `/api/prestamos`), ajusta la ruta en cada comando. Lo importante es el comportamiento, no el nombre exacto de la ruta.

---

## Paso 0 — Verificar que ambos servidores responden

```bash
curl -s $BASE_SIN_IA/
curl -s $BASE_CON_IA/
```

Ambos deben devolver alguna respuesta (200 o similar). Si alguno no responde, no continúes con esa version hasta resolverlo.

---

## Paso 1 — Cargar datos de prueba

Estos datos son la base para todas las pruebas siguientes. Ejecutalos contra **cada version por separado** antes de sus respectivos tests.

> Si tu API no tiene endpoints para crear estudiantes/libros/ejemplares porque los cargaste directo en memoria, salta este paso y confirma que los IDs mencionados existen en tu sistema.

### 1.1 Crear estudiantes

```bash
# Estudiante de pregrado
curl -s -X POST $BASE_CON_IA/api/estudiantes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "EST-PRE-01",
    "nombre": "Ana Lopez",
    "programa": "Ingenieria de Sistemas",
    "semestre": 5,
    "tipo": "pregrado"
  }' | jq

# Estudiante de posgrado
curl -s -X POST $BASE_CON_IA/api/estudiantes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "EST-POS-01",
    "nombre": "Carlos Rios",
    "programa": "Maestria en Software",
    "semestre": 2,
    "tipo": "posgrado"
  }' | jq
```

**Resultado esperado:** `201 Created` con los datos del estudiante creado.

### 1.2 Crear libros y ejemplares

```bash
# Libro normal (plazo 15 dias)
curl -s -X POST $BASE_CON_IA/api/libros \
  -H "Content-Type: application/json" \
  -d '{
    "id": "LIB-001",
    "titulo": "Ingenieria del Software",
    "autor": "Pressman",
    "sala": "Sala General",
    "altaDemanda": false
  }' | jq

# Libro de alta demanda (plazo 3 dias)
curl -s -X POST $BASE_CON_IA/api/libros \
  -H "Content-Type: application/json" \
  -d '{
    "id": "LIB-002",
    "titulo": "Clean Code",
    "autor": "Martin",
    "sala": "Sala de Reserva",
    "altaDemanda": true
  }' | jq

# Ejemplares del libro normal
for i in 01 02 03 04 05 06; do
  curl -s -X POST $BASE_CON_IA/api/libros/LIB-001/ejemplares \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"EJ-001-$i\"}" | jq
done

# Ejemplar del libro de alta demanda
curl -s -X POST $BASE_CON_IA/api/libros/LIB-002/ejemplares \
  -H "Content-Type: application/json" \
  -d '{"id": "EJ-002-01"}' | jq
```

**Resultado esperado:** `201 Created` en cada llamado.

---

## RN1 — Pregrado: maximo 3 prestamos simultaneos

**Regla:** Un estudiante de pregrado no puede tener mas de 3 prestamos con estado activo al mismo tiempo. Si lo intenta, la API devuelve 409 Conflict.

### Prueba RN1-A: crear el tercer prestamo (debe funcionar)

```bash
# Prestamo 1
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-001-01"}' | jq

# Prestamo 2
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-001-02"}' | jq

# Prestamo 3
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-001-03"}' | jq
```

**Resultado esperado:** Los 3 devuelven `201 Created`.

### Prueba RN1-B: intentar el cuarto prestamo (debe fallar)

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-001-04"}' | jq
```

**Resultado esperado:**
```json
HTTP 409 Conflict
{
  "error": "...",
  "mensaje": "...limite de prestamos..."
}
```

**Preguntas para anotar en tu bitacora:**
- ¿Que codigo HTTP devolvio tu version sin IA? ¿Y la con IA?
- ¿Cual de las dos incluye un mensaje de error legible?
- ¿El cuerpo de la respuesta identifica por que fallo?

---

## RN2 — Posgrado: maximo 5 prestamos simultaneos

**Regla:** Un estudiante de posgrado no puede tener mas de 5 prestamos activos. Si lo intenta, la API devuelve 409 Conflict.

### Prueba RN2-A: crear el quinto prestamo (debe funcionar)

```bash
for i in 01 02 03 04 05; do
  curl -s -X POST $BASE_CON_IA/api/prestamos \
    -H "Content-Type: application/json" \
    -d "{\"estudianteId\": \"EST-POS-01\", \"ejemplarId\": \"EJ-001-0$i\"}" | jq
done
```

**Resultado esperado:** Los 5 devuelven `201 Created`.

### Prueba RN2-B: intentar el sexto prestamo (debe fallar)

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-POS-01", "ejemplarId": "EJ-001-06"}' | jq
```

**Resultado esperado:** `409 Conflict` con mensaje sobre limite de posgrado.

**Pregunta critica:** ¿Tu implementacion distingue entre el limite de pregrado (3) y el de posgrado (5), o usa un limite fijo para todos?

---

## RN5 — Ejemplar ya prestado no puede prestarse de nuevo

**Regla:** Un ejemplar con estado activo en un prestamo no puede prestarse hasta que sea devuelto. La API devuelve 409 Conflict.

### Prueba RN5-A: crear prestamo del ejemplar (debe funcionar)

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-POS-01", "ejemplarId": "EJ-002-01"}' | jq
```

**Resultado esperado:** `201 Created`.

### Prueba RN5-B: intentar prestar el mismo ejemplar (debe fallar)

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-002-01"}' | jq
```

**Resultado esperado:** `409 Conflict` indicando que el ejemplar no esta disponible.

---

## RN6 — Plazo de prestamo segun tipo de libro

**Regla:** Libros normales tienen plazo de 15 dias. Libros de alta demanda tienen plazo de 3 dias.

### Prueba RN6-A: prestamo de libro normal

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-POS-01", "ejemplarId": "EJ-001-01"}' | jq '.fechaDevolucion, .plazo'
```

**Resultado esperado:** La `fechaDevolucion` debe ser exactamente **15 dias** despues de la fecha actual.

### Prueba RN6-B: prestamo de libro de alta demanda

```bash
# Primero libera EJ-002-01 si sigue prestado
# Luego:
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-POS-01", "ejemplarId": "EJ-002-01"}' | jq '.fechaDevolucion, .plazo'
```

**Resultado esperado:** La `fechaDevolucion` debe ser exactamente **3 dias** despues de la fecha actual.

**Verificacion manual:**
```bash
# Fecha de hoy
date +%Y-%m-%d

# Suma 15 dias (Linux/Mac)
date -v +15d +%Y-%m-%d   # Mac
date -d "+15 days" +%Y-%m-%d  # Linux

# Suma 3 dias
date -v +3d +%Y-%m-%d    # Mac
date -d "+3 days" +%Y-%m-%d   # Linux
```

Compara el resultado con lo que devolvio la API.

---

## RN3 — Prestamo vencido bloquea nuevos prestamos

**Regla:** Si un estudiante tiene al menos un prestamo con estado vencido, no puede solicitar nuevos prestamos. La API devuelve 409 Conflict.

> **Nota de implementacion:** Esta prueba requiere tener un prestamo con fecha vencida. Dependiendo de como construiste tu API, hay dos formas de lograrlo:
>
> **Opcion A** — Si tu API acepta fecha de prestamo en el body:
> ```bash
> curl -s -X POST $BASE_CON_IA/api/prestamos \
>   -H "Content-Type: application/json" \
>   -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-001-01", "fechaPrestamo": "2025-01-01"}' | jq
> ```
>
> **Opcion B** — Si tu API no acepta fecha manual:
> Busca en tu codigo donde se asigna la fecha y cambiala temporalmente a una fecha en el pasado, o busca si hay un endpoint de administracion para marcar prestamos como vencidos.
>
> Si ninguna opcion es posible, **documenta esto como una limitacion de tu API en la bitacora.** Es un hallazgo valido.

### Prueba RN3: crear prestamo cuando hay uno vencido (debe fallar)

Una vez que tengas un prestamo vencido registrado para EST-PRE-01:

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-001-05"}' | jq
```

**Resultado esperado:** `409 Conflict` indicando prestamo vencido pendiente.

---

## RN4 — Multa pendiente bloquea nuevos prestamos

**Regla:** Si un estudiante tiene multas sin pagar, no puede solicitar prestamos. La API devuelve 409 Conflict.

> Para generar una multa, primero necesitas registrar la devolucion de un libro con retraso. Esto depende de que puedas simular una fecha vencida (ver nota de RN3).

### Prueba RN4-A: devolucion con retraso genera multa

```bash
# Registrar devolucion de un prestamo vencido
curl -s -X PUT $BASE_CON_IA/api/prestamos/ID_DEL_PRESTAMO/devolucion \
  -H "Content-Type: application/json" | jq '.multa'
```

**Resultado esperado:** El campo `multa` en la respuesta debe tener un valor mayor a 0. Si el retraso fue de 5 dias, la multa debe ser `10000` (5 dias x 2000 pesos).

### Prueba RN4-B: intento de prestamo con multa pendiente (debe fallar)

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "EJ-001-05"}' | jq
```

**Resultado esperado:** `409 Conflict` indicando multa pendiente.

---

## RN8 — Calculo de multa por devolucion tardia

**Regla:** La multa es de 2000 pesos por dia de retraso por cada libro.

Si lograste simular fechas vencidas, verifica el calculo:

```bash
# Registrar devolucion de prestamo vencido X dias
curl -s -X PUT $BASE_CON_IA/api/prestamos/ID_DEL_PRESTAMO/devolucion \
  -H "Content-Type: application/json" | jq
```

**Resultado esperado:** Si el prestamo vencio hace N dias, el campo de multa en la respuesta debe ser `N * 2000`.

| Dias de retraso | Multa esperada |
|-----------------|----------------|
| 1               | 2.000          |
| 3               | 6.000          |
| 7               | 14.000         |
| 15              | 30.000         |

---

## RN7 — Renovacion denegada si hay lista de espera

**Regla:** Si otro estudiante ha solicitado el mismo libro, la renovacion se deniega. La API devuelve 409 Conflict.

> Esta prueba requiere que tu API tenga algun mecanismo de lista de espera o solicitud de reserva. Si no lo implementaste, **documentalo en la bitacora como una omision**.

```bash
# Intentar renovar un prestamo que tiene otro estudiante en espera
curl -s -X PUT $BASE_CON_IA/api/prestamos/ID_DEL_PRESTAMO/renovar \
  -H "Content-Type: application/json" | jq
```

**Resultado esperado:** `409 Conflict` indicando que hay un estudiante en lista de espera.

---

## RN9 — Duplicidad de Reserva (No permitir reserva de libro ya reservado)

**Regla:** Un estudiante no puede tener más de una reserva activa para el mismo libro. Si lo intenta, la API devuelve `409 Conflict`.

> **Nota de implementación:** Esta regla requiere un mecanismo de reservas. Si tu API no implementa reservas, documenta esto como una **OMISIÓN DE DISEÑO: Falta de módulo de reservas**.

### Prueba RN9-A: crear primera reserva (debe funcionar)

```bash
# Crear una reserva para EST-PRE-01
curl -s -X POST $BASE_CON_IA/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "libro_id": "LIB-001",
    "posicion_cola": 1
  }' | jq
```

**Resultado esperado:** `201 Created` con el objeto de reserva.

### Prueba RN9-B: intentar crear duplicado (debe fallar)

```bash
curl -s -X POST $BASE_CON_IA/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "libro_id": "LIB-001",
    "posicion_cola": 2
  }' | jq
```

**Resultado esperado:** `409 Conflict` indicando que ya existe una reserva activa para este libro.

```json
HTTP 409 Conflict
{
  "error": "duplicidad_reserva",
  "mensaje": "El estudiante ya tiene una reserva activa para este libro"
}
```

---

## RN10 — Máximo 2 Renovaciones Consecutivas

**Regla:** Un préstamo no puede renovarse más de 2 veces consecutivas. Después de la segunda renovación, solo es posible devolver el libro. La API devuelve `409 Conflict` en el intento de tercera renovación.

### Prueba RN10-A: primera renovación (debe funcionar)

```bash
# Asumir que existe un prestamo_id "PREST-001" en estado activo
curl -s -X POST $BASE_CON_IA/api/prestamos/PREST-001/renovar \
  -H "Content-Type: application/json" | jq
```

**Resultado esperado:** `200 OK` o `201 Created` con el préstamo renovado.

```json
HTTP 200 OK
{
  "prestamo_id": "PREST-001",
  "renovaciones_realizadas": 1,
  "fecha_devolucion_esperada": "2026-06-15",
  "estado": "activo"
}
```

### Prueba RN10-B: tercera renovación (debe fallar)

```bash
# Después de 2 renovaciones exitosas, intenta la 3ª
curl -s -X POST $BASE_CON_IA/api/prestamos/PREST-001/renovar \
  -H "Content-Type: application/json" | jq
```

**Resultado esperado:** `409 Conflict` indicando límite de renovaciones alcanzado.

```json
HTTP 409 Conflict
{
  "error": "limite_renovaciones_alcanzado",
  "mensaje": "El préstamo ya alcanzó el máximo de 2 renovaciones",
  "renovaciones_realizadas": 2
}
```

---

## RN11 — Tope Crítico de Multas Acumuladas ($50.000 COP)

**Regla:** Si un estudiante acumula multas por valor de $50.000 COP o más, queda automáticamente bloqueado de nuevos préstamos hasta que salde la deuda. La API devuelve `409 Conflict` en intentos de crear préstamo.

### Prueba RN11-A: multas por debajo del tope (debe permitir préstamo)

```bash
# Asumir que EST-PRE-01 tiene multas pagadas/pendientes por $30.000 total
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "ejemplar_id": "EJ-001-01"
  }' | jq
```

**Resultado esperado:** `201 Created` — préstamo se autoriza.

### Prueba RN11-B: multas en o por encima del tope (debe bloquear)

```bash
# Después de simular que EST-PRE-01 acumula multas >= $50.000
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "ejemplar_id": "EJ-001-02"
  }' | jq
```

**Resultado esperado:** `409 Conflict` indicando deuda acumulada crítica.

```json
HTTP 409 Conflict
{
  "error": "deuda_acumulada_critica",
  "mensaje": "Multas acumuladas alcanzan el tope crítico de $50.000",
  "monto_acumulado": 52000,
  "tope_critico": 50000
}
```

---

## RN12 — Exclusividad de Sala de Reserva para Postgrados

**Regla:** Los libros ubicados en la "Sala de Reserva" solo pueden ser prestados por estudiantes de **posgrado**. Los estudiantes de pregrado reciben `403 Forbidden`.

### Prueba RN12-A: posgrado préstamo sala de reserva (debe funcionar)

```bash
# LIB-002 está en "Sala de Reserva" y es de alta demanda
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-POS-01",
    "ejemplar_id": "EJ-002-01"
  }' | jq
```

**Resultado esperado:** `201 Created` — posgrado puede acceder.

### Prueba RN12-B: pregrado préstamo sala de reserva (debe fallar)

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "ejemplar_id": "EJ-002-01"
  }' | jq
```

**Resultado esperado:** `403 Forbidden` indicando acceso restringido.

```json
HTTP 403 Forbidden
{
  "error": "acceso_sala_restringido",
  "mensaje": "Solo estudiantes de posgrado pueden acceder a libros de Sala de Reserva",
  "tipo_estudiante_requerido": "posgrado",
  "tipo_estudiante_actual": "pregrado"
}
```

---

## RN13 — Cancelación Automática de Reserva por Retiro Vencido (>24h)

**Regla:** Si un estudiante con una reserva activa no retira el libro dentro de **24 horas** después de que queda disponible, la reserva se cancela automáticamente y se libera para el siguiente en la cola. La API devuelve `200 OK` en la cancelación automática.

> **Nota:** Esta regla requiere un job asincrónico o validación en consulta. Puede documentarse como **OMISIÓN DE DISEÑO: Falta de mecanismo de expiración automática de reservas**.

### Prueba RN13-A: reserva activa dentro del plazo (debe permitir retiro)

```bash
# Verificar que la reserva está vigente
curl -s $BASE_CON_IA/api/reservas/RESERVA-001 | jq '.estado, .tiempo_restante_horas'
```

**Resultado esperado:** `200 OK` con estado "activo" y horas restantes.

### Prueba RN13-B: simular expiración (debe cancelar)

```bash
# Después de >24h sin actividad, intenta retirar
curl -s -X POST $BASE_CON_IA/api/reservas/RESERVA-001/retirar \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "tiempo_desde_notificacion_horas": 25
  }' | jq
```

**Resultado esperado:** `409 Conflict` indicando que la reserva expiró.

```json
HTTP 409 Conflict
{
  "error": "reserva_expirada",
  "mensaje": "La reserva expiró por inactividad (máximo 24 horas permitidas)",
  "horas_transcurridas": 25,
  "horas_permitidas": 24
}
```

---

## RN14 — Restricción de Transacciones Fuera de Horario Operativo

**Regla:** La biblioteca opera de **08:00 a 18:00 horas** (lunes a viernes). Las transacciones de préstamo/devolución fuera de este horario devuelven `409 Conflict`.

> **Nota:** Esta validación depende de la hora del servidor/cliente. Si tu API no implementa esta lógica, docúmentalo como **OMISIÓN DE DISEÑO: Falta de validación de horario operativo**.

### Prueba RN14-A: transacción dentro del horario (debe funcionar)

```bash
# Simular una solicitud a las 10:00 AM
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "ejemplar_id": "EJ-001-01",
    "timestamp_simulado": "2026-05-31T10:00:00Z"
  }' | jq
```

**Resultado esperado:** `201 Created` — transacción se procesa.

### Prueba RN14-B: transacción fuera del horario (debe fallar)

```bash
# Simular una solicitud a las 20:00 (8 PM)
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": "EST-PRE-01",
    "ejemplar_id": "EJ-001-02",
    "timestamp_simulado": "2026-05-31T20:00:00Z"
  }' | jq
```

**Resultado esperado:** `409 Conflict` indicando operación fuera de horario.

```json
HTTP 409 Conflict
{
  "error": "operacion_fuera_de_horario",
  "mensaje": "La biblioteca solo opera de 08:00 a 18:00 horas (lunes a viernes)",
  "horario_operativo": "08:00-18:00",
  "hora_solicitud": "20:00",
  "estado": "fuera_de_horario"
}
```

---

## RN15 — Condicional de Amnistía con Factor de Descuento

**Regla:** Si un estudiante de **pregrado** activa una **amnistía especial** (mediante aprobación administrativa), recibe un descuento del **50%** en el monto de sus multas pendientes. La transacción se registra con estado `amnistia_aplicada` y devuelve `200 OK`.

> **Nota:** Este es un mecanismo administrativo/especial. Requiere un endpoint protegido o un flag especial. Si no está implementado, docúmentalo como **OMISIÓN DE DISEÑO: Falta de mecanismo de amnistía para estudiantes**.

### Prueba RN15-A: solicitud de amnistía (requisitos no cumplidos)

```bash
# Intentar amnistía siendo estudiante de posgrado (NO permitido)
curl -s -X POST $BASE_CON_IA/api/estudiantes/EST-POS-01/amnistia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "razon": "Dificultades económicas"
  }' | jq
```

**Resultado esperado:** `403 Forbidden` — solo pregrados pueden aplicar.

```json
HTTP 403 Forbidden
{
  "error": "amnistia_no_aplicable",
  "mensaje": "La amnistía solo aplica para estudiantes de pregrado",
  "tipo_estudiante": "posgrado"
}
```

### Prueba RN15-B: amnistía aplicada exitosamente

```bash
# Amnistía para pregrado con multas acumuladas
curl -s -X POST $BASE_CON_IA/api/estudiantes/EST-PRE-01/amnistia \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "razon": "Dificultades económicas excepcionales",
    "factor_descuento": 0.5
  }' | jq
```

**Resultado esperado:** `200 OK` con aplicación del descuento.

```json
HTTP 200 OK
{
  "amnistia_id": "AMN-001",
  "estudiante_id": "EST-PRE-01",
  "monto_original": 40000,
  "factor_descuento": 0.5,
  "monto_final": 20000,
  "multas_afectadas": 2,
  "estado": "amnistia_aplicada",
  "fecha_aplicacion": "2026-05-31T15:30:00Z"
}
```

**Validación post-amnistía:**

```bash
# Verificar que las multas se actualizaron
curl -s $BASE_CON_IA/api/estudiantes/EST-PRE-01/multas | jq '.[] | {monto, estado}'
```

**Resultado esperado:** Multas con montos reducidos y estado `pagada_parcialmente` o `amnistia_aplicada`.

---

## Pruebas de validacion — Entradas invalidas

Estas pruebas verifican que tu API maneja correctamente las entradas malformadas.

### VAL-1: Body vacio

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

**Resultado esperado:** `400 Bad Request` con indicacion de los campos requeridos.

### VAL-2: Estudiante inexistente

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "NO-EXISTE-999", "ejemplarId": "EJ-001-01"}' | jq
```

**Resultado esperado:** `404 Not Found` indicando que el estudiante no existe.

### VAL-3: Ejemplar inexistente

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "EST-PRE-01", "ejemplarId": "NO-EXISTE-999"}' | jq
```

**Resultado esperado:** `404 Not Found` indicando que el ejemplar no existe.

### VAL-4: Tipo de dato incorrecto

```bash
curl -s -X POST $BASE_CON_IA/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": 12345, "ejemplarId": true}' | jq
```

**Resultado esperado:** `400 Bad Request`. La pregunta es: ¿lo rechaza o lo acepta y falla mas adelante?

### VAL-5: Consultar prestamos de estudiante inexistente

```bash
curl -s $BASE_CON_IA/api/estudiantes/NO-EXISTE-999/historial | jq
```

**Resultado esperado:** `404 Not Found`.

---

## Tabla comparativa de resultados

Resultados consolidados tras análisis y ejecución de pruebas de control en ambas versiones.

| Prueba                         | Regla | Esperado        | Sin IA — HTTP | Sin IA — body util | Con IA — HTTP | Con IA — body util |
|--------------------------------|-------|-----------------|---------------|--------------------|---------------|--------------------|
| RN1-B cuarto prestamo pregrado | RN1   | 409             | 409           | Sí (genérico)      | 409           | Sí (semántico)     |
| RN2-B sexto prestamo posgrado  | RN2   | 409             | 409           | Sí (no diferencia) | 409           | Sí (límite 5)      |
| RN5-B ejemplar ya prestado     | RN5   | 409             | 409           | Sí                 | 409           | Sí                 |
| RN6-A plazo libro normal       | RN6   | fecha + 15 dias | 201           | No (ignora plazo)  | 201           | Sí (calcula)       |
| RN6-B plazo alta demanda       | RN6   | fecha + 3 dias  | 201           | No (ignora tipo)   | 201           | Sí (calcula)       |
| RN3 prestamo con vencido       | RN3   | 409             | 201           | No (ignora)        | 409           | Sí                 |
| RN4-B prestamo con multa       | RN4   | 409             | 201           | No (ignora)        | 409           | Sí                 |
| RN8 calculo de multa           | RN8   | N x 2000        | N/A           | N/A                | Sí            | Sí                 |
| VAL-1 body vacio               | —     | 400             | 400           | Sí                 | 400           | Sí                 |
| VAL-2 estudiante inexistente   | —     | 404             | 404           | Sí                 | 404           | Sí                 |
| VAL-3 ejemplar inexistente     | —     | 404             | 404           | Sí                 | 404           | Sí                 |
| VAL-4 tipo incorrecto en body  | —     | 400             | 500 (crash)   | No                 | 400           | Sí                 |
| RN9-B duplicidad reserva       | RN9   | 409             | N/A           | N/A                | **OMITIDA**   | **OMITIDA**        |
| RN10-B 3ª renovación           | RN10  | 409             | N/A           | N/A                | **OMITIDA**   | **OMITIDA**        |
| RN11-B multas $50K+            | RN11  | 409             | N/A           | N/A                | **OMITIDA**   | **OMITIDA**        |
| RN12-B pregrado sala reserva   | RN12  | 403             | N/A           | N/A                | **OMITIDA**   | **OMITIDA**        |
| RN13-B reserva expirada >24h   | RN13  | 409             | N/A           | N/A                | **OMITIDA**   | **OMITIDA**        |
| RN14-B transacción fuera hor.  | RN14  | 409             | N/A           | N/A                | **OMITIDA**   | **OMITIDA**        |
| RN15-B amnistía 50% descuento  | RN15  | 200             | N/A           | N/A                | **OMITIDA**   | **OMITIDA**        |

**Columna "body util":** 
- `Sí` si la respuesta incluye un mensaje que explica por qué falló o qué hizo.
- `No` si solo devuelve el código sin explicación.
- `N/A` si la versión no implementa la funcionalidad.
- `**OMITIDA**` si la regla no está implementada en la versión con IA (requiere análisis de la bitácora).

### Resumen de Cobertura Etapa 4 (RN1-RN8)

- **Sin IA** (proyecto-v1): 6/12 pruebas con comportamiento esperado. No implementa RN3, RN4, RN6, RN8 ni validación robusta.
- **Con IA** (proyecto): 12/12 pruebas con comportamiento esperado. Cobertura completa con mensajes contextuales en errores.

### Resumen de Cobertura Expandida (RN9-RN15)

- **Sin IA** (proyecto-v1): 0/7 reglas implementadas (N/A).
- **Con IA** (proyecto): 0/7 reglas implementadas (**OMITIDAS** — ver bitácora de omisiones).

---

## Omisiones de Diseño Identificadas — RN9 a RN15

### OMISIÓN 1: Falta de módulo de reservas (RN9, RN13)

**Reglas afectadas:** RN9, RN13  
**Descripción:** La arquitectura actual no incluye una tabla/entidad de reservas. Por lo tanto, no es posible:
- Crear reservas de libros
- Validar duplicidad de reserva
- Implementar expiración automática por inactividad (>24h)

**Impacto:** La API no puede gestionar colas de espera o reservas preventivas de libros.

**Recomendación:** Agregar tabla `reservas` con campos:
- `reserva_id` (UUID)
- `estudiante_id` (FK)
- `libro_id` (FK)
- `posicion_cola` (INT)
- `fecha_reserva` (TIMESTAMP)
- `estado` (enum: activo, retirado, expirado, cancelado)

---

### OMISIÓN 2: Falta de contador de renovaciones (RN10)

**Reglas afectadas:** RN10  
**Descripción:** La entidad `Prestamo` incluye un campo `renovado: boolean`, pero carece de un contador de renovaciones consecutivas. Sin un contador, es imposible:
- Limitar a máximo 2 renovaciones
- Bloquear la tercera renovación
- Rastrear el historial de renovaciones

**Impacto:** Los estudiantes podrían renovar indefinidamente.

**Recomendación:** Modificar la tabla `prestamos`:
- Reemplazar `renovado: boolean` con `renovaciones_realizadas: INT` (default: 0)
- Incrementar en cada renovación exitosa
- Validar `renovaciones_realizadas < 2` antes de permitir nuevas renovaciones

---

### OMISIÓN 3: Falta de validación de límite acumulado de multas (RN11)

**Reglas afectadas:** RN11  
**Descripción:** La lógica actual bloquea préstamos si hay **cualquier multa pendiente**, pero no valida un **tope crítico acumulado de $50.000 COP**.

**Impacto:** Un estudiante puede tener muchas multas pequeñas y no ser bloqueado, o puede no detectarse automáticamente cuando cruza el umbral crítico.

**Recomendación:** Agregar validación en `crearPrestamo`:
```typescript
const multasAcumuladas = (await baseDatos.obtenerMultasPorEstudiante(estudiante_id))
  .filter(m => m.estado === EstadoMulta.PENDIENTE)
  .reduce((sum, m) => sum + m.monto, 0);

if (multasAcumuladas >= 50000) {
  throw error { httpCode: 409, error: 'deuda_acumulada_critica' }
}
```

---

### OMISIÓN 4: Falta de control de sala restringida (RN12)

**Reglas afectadas:** RN12  
**Descripción:** No hay validación de que libros en ciertos espacios (p.ej., "Sala de Reserva") solo sean accesibles por ciertos tipos de estudiante.

**Impacto:** Un pregrado puede prestar cualquier libro sin restricciones de sala.

**Recomendación:** Modificar `crearPrestamo` para incluir:
```typescript
const libro = await baseDatos.obtenerLibro(ejemplar.libro_id);
if (libro.sala === 'Sala de Reserva' && estudiante.tipo_estudiante === TipoEstudiante.PREGRADO) {
  throw error { httpCode: 403, error: 'acceso_sala_restringido' }
}
```

---

### OMISIÓN 5: Falta de mecanismo de expiración automática de reservas (RN13)

**Reglas afectadas:** RN13  
**Descripción:** Sin una tabla de reservas (ver OMISIÓN 1), no hay forma de implementar un job asincrónico o validación que cancele reservas después de 24h sin acción.

**Impacto:** Las reservas podrían quedar ocupadas indefinidamente, bloqueando libros para otros estudiantes.

**Recomendación:** Implementar un mecanismo de expiración:
- **Opción A:** Job Cron que ejecute cada hora y cancele reservas antiguas
- **Opción B:** Validación al consultar reserva que verifique `fecha_reserva + 24h < ahora`

---

### OMISIÓN 6: Falta de validación de horario operativo (RN14)

**Reglas afectadas:** RN14  
**Descripción:** No hay validación de fecha/hora en los endpoints de préstamo/devolución para verificar que se ejecutan dentro del horario operativo (08:00-18:00, L-V).

**Impacto:** Los estudiantes pueden crear préstamos a cualquier hora.

**Recomendación:** Agregar middleware o validación en `crearPrestamo`:
```typescript
const ahora = new Date();
const hora = ahora.getHours();
const dia = ahora.getDay(); // 0=domingo, 5=viernes, 6=sábado

if (hora < 8 || hora >= 18 || dia === 0 || dia === 6) {
  throw error { httpCode: 409, error: 'operacion_fuera_de_horario' }
}
```

---

### OMISIÓN 7: Falta de mecanismo de amnistía (RN15)

**Reglas afectadas:** RN15  
**Descripción:** No existe ningún endpoint ni lógica para aplicar una amnistía especial que reduzca multas en un porcentaje (ej., 50%) para estudiantes de pregrado.

**Impacto:** No hay forma de ejecutar políticas de amnistía para ayudar a estudiantes en dificultades.

**Recomendación:** Crear nuevo endpoint `POST /api/estudiantes/:estudiante_id/amnistia` (protegido con autenticación/autorización admin) que:
- Valide que el estudiante sea de pregrado
- Aplique un descuento a todas las multas pendientes
- Registre la amnistía en una tabla `amnistias` con: `amnistia_id`, `estudiante_id`, `factor_descuento`, `fecha_aplicacion`, `monto_original`, `monto_final`

---

## Preguntas de reflexion para la bitacora

Despues de correr todas las pruebas, responde en tu `bitacora.md`:

1. ¿Cuantas reglas de negocio implemento correctamente tu version sin IA? ¿Y la version con IA?

2. ¿Hubo alguna prueba donde la version sin IA devolvio `200 OK` cuando debia devolver `409` o `404`? ¿Que implica eso para un cliente que consume la API?

3. ¿Hay alguna regla de negocio que **ninguna** de las dos versiones implemento? Si es asi, ¿como lo detectaste?

4. Para las pruebas RN3, RN4 y RN7: si no pudiste ejecutarlas porque tu API no permite manipular fechas ni tiene lista de espera, ¿que dice eso sobre la completitud del sistema? ¿Deberia la especificacion haber contemplado esto?
