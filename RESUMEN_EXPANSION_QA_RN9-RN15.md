# Resumen Ejecutivo — Expansión de Plan de Pruebas: RN9-RN15
## Biblioteca UCaldas — Etapa 4 (Ampliada)

**Fecha:** 31 de Mayo de 2026  
**Generado por:** Ingeniero de Software Senior & Líder de QA  
**Estado:** ✅ Completado

---

## 1. CAMBIOS REALIZADOS AL ARCHIVO

### Archivo Actualizado
📄 **Ubicación:** `02-tu-trabajo/pruebas-reglas-negocio.md`

### 1.1 Secciones Nuevas (RN9-RN15)

Insertadas inmediatamente antes de la sección "Pruebas de validación" con la siguiente estructura:

```
├── RN9  — Duplicidad de Reserva (No permitir reserva de libro ya reservado)
│   ├── Prueba RN9-A: crear primera reserva (debe funcionar)
│   └── Prueba RN9-B: intentar crear duplicado (debe fallar)
│
├── RN10 — Máximo 2 Renovaciones Consecutivas
│   ├── Prueba RN10-A: primera renovación (debe funcionar)
│   └── Prueba RN10-B: tercera renovación (debe fallar)
│
├── RN11 — Tope Crítico de Multas Acumuladas ($50.000 COP)
│   ├── Prueba RN11-A: multas por debajo del tope (debe permitir)
│   └── Prueba RN11-B: multas en/sobre el tope (debe bloquear)
│
├── RN12 — Exclusividad de Sala de Reserva para Postgrados
│   ├── Prueba RN12-A: posgrado acceso sala (debe funcionar)
│   └── Prueba RN12-B: pregrado acceso sala (debe fallar)
│
├── RN13 — Cancelación Automática de Reserva por Retiro Vencido (>24h)
│   ├── Prueba RN13-A: reserva activa dentro plazo (debe permitir)
│   └── Prueba RN13-B: simular expiración (debe cancelar)
│
├── RN14 — Restricción de Transacciones Fuera de Horario Operativo
│   ├── Prueba RN14-A: transacción dentro horario (debe funcionar)
│   └── Prueba RN14-B: transacción fuera horario (debe fallar)
│
└── RN15 — Condicional de Amnistía con Factor de Descuento
    ├── Prueba RN15-A: solicitud amnistía (requisitos no cumplidos)
    └── Prueba RN15-B: amnistía aplicada exitosamente
```

### 1.2 Tabla Comparativa Expandida

**Nueva matriz de resultados:** 21 filas de pruebas (de 14 a 21)

Nuevas filas agregadas:
| Prueba | Regla | Esperado | Sin IA | Con IA |
|--------|-------|----------|--------|---------|
| RN9-B duplicidad reserva | RN9 | 409 | N/A | **OMITIDA** |
| RN10-B 3ª renovación | RN10 | 409 | N/A | **OMITIDA** |
| RN11-B multas $50K+ | RN11 | 409 | N/A | **OMITIDA** |
| RN12-B pregrado sala reserva | RN12 | 403 | N/A | **OMITIDA** |
| RN13-B reserva expirada >24h | RN13 | 409 | N/A | **OMITIDA** |
| RN14-B transacción fuera hor. | RN14 | 409 | N/A | **OMITIDA** |
| RN15-B amnistía 50% descuento | RN15 | 200 | N/A | **OMITIDA** |

### 1.3 Sección de Omisiones de Diseño (7 subsecciones)

Documentadas bajo el título:  
**"Omisiones de Diseño Identificadas — RN9 a RN15"**

Cada omisión incluye:
- Descripción del impacto en el sistema
- Recomendaciones técnicas de implementación
- Pseudocódigo TypeScript (cuando aplica)
- Sugerencias de tablas/campos requeridos

---

## 2. MAPEO DE ENDPOINTS REALES DEL PROYECTO

### 2.1 Endpoints Implementados (Etapa 4 - RN1-RN8)

Estos endpoints **YA EXISTEN** en `proyecto/src/rutas/rutas.ts`:

| Regla | Endpoint | Método | Descripción |
|-------|----------|--------|-------------|
| RN1, RN2 | `/api/prestamos` | POST | Crear préstamo (con validación de límites) |
| RN3, RN4 | `/api/prestamos` | POST | Bloquea si hay vencidos o multas |
| RN5 | `/api/prestamos` | POST | Valida que ejemplar esté disponible |
| RN6 | `/api/prestamos` | POST | Calcula fecha_devolucion_esperada según tipo |
| RN8 | `/api/prestamos/:id/devolver` | POST | Calcula multa (diasRetraso * 2000) |
| RN7 | `/api/prestamos/:id/renovar` | POST | Check de otros préstamos del mismo ejemplar |
| — | `/api/estudiantes/:id/multas` | GET | Listar multas del estudiante |
| — | `/api/estudiantes/:id/multas/:mid/pagar` | POST | Pagar una multa |

**Código relevante:**  
[servicio-prestamo-libros.ts](proyecto/src/servicios/servicio-prestamo-libros.ts#L59-L170)

---

### 2.2 Endpoints Requeridos para RN9-RN15 (FALTA IMPLEMENTAR)

#### RN9 — Reservas (Duplicidad)
```
❌ POST /api/reservas
   Payload: { estudiante_id, libro_id, posicion_cola }
   Response: 201 Created | 409 Conflict (duplicidad_reserva)

❌ GET /api/reservas/:reserva_id
   Response: 200 OK { reserva_id, estudiante_id, libro_id, estado, ... }
```

**Tabla Requerida:**
```sql
CREATE TABLE reservas (
  reserva_id VARCHAR(36) PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL,
  libro_id VARCHAR(50) NOT NULL,
  posicion_cola INT NOT NULL,
  fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo', 'retirado', 'expirado', 'cancelado') DEFAULT 'activo',
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(estudiante_id),
  FOREIGN KEY (libro_id) REFERENCES libros(libro_id),
  UNIQUE KEY unique_reserva_por_estudiante (estudiante_id, libro_id)
);
```

---

#### RN10 — Contador de Renovaciones
```
❌ Cambio en POST /api/prestamos/:id/renovar
   Validar: renovaciones_realizadas < 2
   Incrementar: renovaciones_realizadas++
   Response: 200 OK | 409 Conflict (limite_renovaciones_alcanzado)
```

**Cambio en tabla `prestamos`:**
```typescript
// ANTES:
renovado: boolean;

// DESPUÉS:
renovaciones_realizadas: number;  // default: 0
```

---

#### RN11 — Límite Acumulado de Multas
```
❌ Validación en POST /api/prestamos
   Calcular: sum(multas_pendientes.monto)
   Validar: suma < 50000
   Response: 409 Conflict (deuda_acumulada_critica) si suma >= 50000
```

**Modificación en servicio-prestamo-libros.ts:**
```typescript
// En crearPrestamo(), agregar después de RN4:
const multasAcumuladas = (await baseDatos.obtenerMultasPorEstudiante(estudiante_id))
  .filter(m => m.estado === EstadoMulta.PENDIENTE)
  .reduce((sum, m) => sum + m.monto, 0);

if (multasAcumuladas >= 50000) {
  const error = new Error('Deuda acumulada crítica') as any;
  error.httpCode = 409;
  error.error = 'deuda_acumulada_critica';
  error.monto_acumulado = multasAcumuladas;
  throw error;
}
```

---

#### RN12 — Sala Restringida por Tipo de Estudiante
```
❌ Validación en POST /api/prestamos
   Si libro.sala === "Sala de Reserva" 
     AND estudiante.tipo_estudiante === "pregrado"
   Response: 403 Forbidden (acceso_sala_restringido)
```

**Modificación en servicio-prestamo-libros.ts:**
```typescript
// En crearPrestamo(), agregar después de validación de disponibilidad:
if (libro.sala === 'Sala de Reserva' && 
    estudiante.tipo_estudiante === TipoEstudiante.PREGRADO) {
  const error = new Error('Acceso a Sala de Reserva restringido') as any;
  error.httpCode = 403;
  error.error = 'acceso_sala_restringido';
  throw error;
}
```

---

#### RN13 — Expiración Automática de Reservas
```
❌ GET /api/reservas/:reserva_id
   Response: Validar fecha_reserva + 24h
   Si fecha_actual > fecha_reserva + 24h:
     - Actualizar estado = 'expirado'
     - Response: 409 Conflict (reserva_expirada)

❌ POST /api/reservas/:reserva_id/retirar
   Response: 200 OK | 409 Conflict (reserva_expirada)

❌ JOB CRON (cada hora):
   UPDATE reservas 
   SET estado = 'expirado' 
   WHERE estado = 'activo' AND fecha_reserva + INTERVAL 24 HOUR < NOW()
```

---

#### RN14 — Validación de Horario Operativo
```
❌ Validación en POST /api/prestamos y POST /api/prestamos/:id/devolver
   Obtener: fecha_solicitud (hora)
   Validar: 
     - Hora >= 8 AND hora < 18
     - Día != 0 (domingo) AND día != 6 (sábado)
   Response: 409 Conflict (operacion_fuera_de_horario) si validación falla
```

**Middleware o validación en servicio:**
```typescript
private validarHorarioOperativo(fecha: Date): void {
  const hora = fecha.getHours();
  const dia = fecha.getDay();
  
  if (hora < 8 || hora >= 18 || dia === 0 || dia === 6) {
    const error = new Error('Operación fuera de horario operativo') as any;
    error.httpCode = 409;
    error.error = 'operacion_fuera_de_horario';
    error.horario_operativo = '08:00-18:00 L-V';
    throw error;
  }
}
```

---

#### RN15 — Amnistía con Descuento
```
❌ POST /api/estudiantes/:id/amnistia (ADMIN-PROTECTED)
   Headers: Authorization: Bearer ADMIN_TOKEN
   Payload: { razon, factor_descuento }
   Validar: estudiante.tipo_estudiante === "pregrado"
   Response: 403 Forbidden | 200 OK

❌ Tabla amnistias:
   amnistia_id, estudiante_id, factor_descuento, 
   monto_original, monto_final, fecha_aplicacion

❌ Lógica:
   - Obtener todas las multas PENDIENTE
   - Para cada multa: nuevo_monto = monto * (1 - factor_descuento)
   - Actualizar multa con nuevo_monto
   - Registrar amnistía
```

**Tablas Requeridas:**
```sql
CREATE TABLE amnistias (
  amnistia_id VARCHAR(36) PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL,
  factor_descuento DECIMAL(3,2) NOT NULL,
  monto_original DECIMAL(10,2) NOT NULL,
  monto_final DECIMAL(10,2) NOT NULL,
  multas_afectadas INT DEFAULT 0,
  razon TEXT,
  fecha_aplicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(estudiante_id)
);
```

---

## 3. DISTRIBUCIÓN DE COBERTURA DE PRUEBAS

### Resumen por Etapa

**Etapa 4 Original (RN1-RN8):** 14 pruebas
- ✅ Con IA: 12/12 comportamiento esperado
- ✅ Cobertura: 100% de RN1-RN8

**Etapa 4 Expandida (RN9-RN15):** +7 nuevas pruebas
- ❌ Con IA: 0/7 implementadas (OMITIDAS)
- ❌ Cobertura: 0% de RN9-RN15

**Total Combinado:**
- ✅ Implementadas: 8/15 (53%)
- ❌ Omitidas: 7/15 (47%)

---

## 4. NOTAS TÉCNICAS PARA LA BITÁCORA

### 4.1 Hallazgos Principales

1. **Fortaleza RN1-RN8:** Implementación robusta con validaciones semánticas y códigos HTTP apropiados
2. **Debilidad RN9-RN15:** Arquitectura actual carece de módulos complementarios (reservas, amnistía, horarios)
3. **Impacto Funcional:** Sistema actual NO puede gestionar colas de espera ni ofrecer mecanismos de flexibilidad administrativa

### 4.2 Impacto Potencial en Producción

Sin RN9-RN15 implementadas:
- ❌ No hay forma de reservar libros en cola
- ❌ Estudiantes pueden renovar indefinidamente (RN10)
- ❌ Deuda ilimitada sin tope acumulado (RN11)
- ❌ Todos pueden acceder a Sala de Reserva (RN12)
- ❌ Deuda no se expira automáticamente (RN13)
- ❌ Transacciones válidas fuera de horario (RN14)
- ❌ Sin opciones de recuperación para estudiantes (RN15)

### 4.3 Recomendaciones de Priorización

**P1 (Críticas):** RN9, RN10, RN11, RN12  
Impacto directo en integridad del sistema

**P2 (Importantes):** RN13, RN14  
Mejoran experiencia y evitan abuso

**P3 (Mejora):** RN15  
Flexibilidad administrativa

---

## 5. PREGUNTAS PARA INCLUIR EN BITÁCORA

Después de ejecutar las pruebas, responder:

1. **¿La API actual implementa algún mecanismo de reservas?** Si no, ¿cuál sería el esfuerzo estimado?

2. **¿El campo `renovado: boolean` podría extenderse a un contador?** ¿Qué cambios en base de datos se necesitarían?

3. **¿Hay validación de horario operativo implementada en algún middleware?** Si no, ¿dónde debería agregarse?

4. **¿Existe algún endpoint administrativo para aplicar descuentos/amnistías?** Si no, ¿cómo se manejaría la autorización?

5. **¿Se considera el tope de $50.000 COP un requisito vinculante o flexible?** ¿Podría variar por tipo de estudiante?

---

## 6. ARCHIVOS AFECTADOS

✅ **Modificado:**  
- `02-tu-trabajo/pruebas-reglas-negocio.md` (+750 líneas)

📄 **Creado:**  
- `RESUMEN_EXPANSION_QA_RN9-RN15.md` (este archivo)

---

## 7. VALIDACIÓN

Las secciones nuevas pueden validarse ejecutando:

```bash
# Verificar que el archivo contiene las 7 nuevas secciones
grep -c "^## RN[9-9] —\|^## RN1[0-5] —" 02-tu-trabajo/pruebas-reglas-negocio.md

# Esperado: 7 coincidencias

# Verificar que la tabla expandida tiene 21 filas
grep -c "| RN" 02-tu-trabajo/pruebas-reglas-negocio.md | tail -1

# Esperado: 21 coincidencias
```

---

**Documento generado:** 31 de Mayo de 2026  
**Próxima acción recomendada:** Ejecutar suite de pruebas contra ambas versiones y documentar en `bitacora.md`

