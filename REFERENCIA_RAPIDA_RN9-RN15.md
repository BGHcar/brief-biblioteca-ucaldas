# REFERENCIA RÁPIDA: Endpoints & Reglas RN9-RN15
## Biblioteca UCaldas — Etapa 4 Expandida

---

## 📋 Matriz de Endpoints Requeridos

| RN | Regla | Endpoint | Método | Status | HTTP Esperado |
|----|-------|----------|--------|--------|----------------|
| **RN9** | Duplicidad Reserva | `POST /api/reservas` | POST | ❌ OMITIDA | 201 \| 409 |
| **RN9** | Consultar Reserva | `GET /api/reservas/:id` | GET | ❌ OMITIDA | 200 \| 404 |
| **RN10** | 2ª Renovación | `POST /api/prestamos/:id/renovar` | POST | ❌ OMITIDA* | 200 \| 409 |
| **RN11** | Límite Multas $50K | `POST /api/prestamos` | POST | ❌ OMITIDA** | 201 \| 409 |
| **RN12** | Sala Restricta | `POST /api/prestamos` | POST | ❌ OMITIDA** | 201 \| 403 |
| **RN13** | Expiración Reserva | `POST /api/reservas/:id/retirar` | POST | ❌ OMITIDA | 200 \| 409 |
| **RN13** | Job Cron | (background) | CRON | ❌ OMITIDA | N/A |
| **RN14** | Horario Operativo | `POST /api/prestamos` | POST | ❌ OMITIDA** | 201 \| 409 |
| **RN15** | Amnistía | `POST /api/estudiantes/:id/amnistia` | POST | ❌ OMITIDA | 200 \| 403 |

**Notas:**
- `*` RN10: Endpoint existe pero falta contador de renovaciones
- `**` RN11, RN12, RN14: Requieren validación adicional en endpoint existente

---

## 🔧 Cambios Código Requeridos

### RN9 + RN13: Nueva Tabla `reservas`
```sql
CREATE TABLE reservas (
  reserva_id VARCHAR(36) PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL,
  libro_id VARCHAR(50) NOT NULL,
  posicion_cola INT NOT NULL,
  fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo', 'retirado', 'expirado', 'cancelado'),
  UNIQUE KEY (estudiante_id, libro_id),
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(estudiante_id),
  FOREIGN KEY (libro_id) REFERENCES libros(libro_id)
);
```

### RN10: Modify `prestamos` Table
```sql
-- ANTES: renovado BOOLEAN DEFAULT FALSE
-- DESPUÉS:
ALTER TABLE prestamos 
  DROP COLUMN renovado,
  ADD COLUMN renovaciones_realizadas INT DEFAULT 0;
```

### RN11: Validación en `crearPrestamo()`
```typescript
const multasAcumuladas = (await baseDatos.obtenerMultasPorEstudiante(estudiante_id))
  .filter(m => m.estado === EstadoMulta.PENDIENTE)
  .reduce((sum, m) => sum + m.monto, 0);

if (multasAcumuladas >= 50000) {
  throw { httpCode: 409, error: 'deuda_acumulada_critica', monto_acumulado: multasAcumuladas }
}
```

### RN12: Validación en `crearPrestamo()`
```typescript
if (libro.sala === 'Sala de Reserva' && 
    estudiante.tipo_estudiante === TipoEstudiante.PREGRADO) {
  throw { httpCode: 403, error: 'acceso_sala_restringido' }
}
```

### RN14: Validación en `crearPrestamo()` o Middleware
```typescript
const ahora = new Date();
const hora = ahora.getHours();
const dia = ahora.getDay(); // 0=dom, 6=sab

if (hora < 8 || hora >= 18 || dia === 0 || dia === 6) {
  throw { httpCode: 409, error: 'operacion_fuera_de_horario' }
}
```

### RN15: Nueva Tabla `amnistias`
```sql
CREATE TABLE amnistias (
  amnistia_id VARCHAR(36) PRIMARY KEY,
  estudiante_id VARCHAR(50) NOT NULL,
  factor_descuento DECIMAL(3,2) NOT NULL,
  monto_original DECIMAL(10,2),
  monto_final DECIMAL(10,2),
  multas_afectadas INT,
  razon TEXT,
  fecha_aplicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(estudiante_id)
);
```

### RN15: Nuevo Endpoint (Admin-Protected)
```typescript
router.post('/estudiantes/:estudiante_id/amnistia', 
  verifyAdmin, // middleware de autenticación
  async (req: Request, res: Response) => {
    // Validar que sea pregrado
    // Aplicar descuento a multas pendientes
    // Registrar en tabla amnistias
  }
);
```

---

## 📊 Cobertura de Pruebas Antes/Después

### ANTES (RN1-RN8)
```
✅ Implementadas: 8/8 (100%)
├── RN1: Límite pregrado (3)         ✅
├── RN2: Límite posgrado (5)         ✅
├── RN3: Vencido bloquea             ✅
├── RN4: Multa bloquea               ✅
├── RN5: Ejemplar no disponible      ✅
├── RN6: Plazo por tipo              ✅
├── RN7: Renovación con check        ✅
└── RN8: Cálculo multa               ✅
```

### DESPUÉS (RN9-RN15)
```
❌ Omitidas: 7/7 (100%)
├── RN9: Duplicidad reserva          ❌ (falta tabla + endpoint)
├── RN10: 2ª renovación              ❌ (falta contador)
├── RN11: $50K tope                  ❌ (falta validación)
├── RN12: Sala restricta             ❌ (falta validación)
├── RN13: Expiración >24h            ❌ (falta job cron)
├── RN14: Horario operativo          ❌ (falta validación)
└── RN15: Amnistía 50%               ❌ (falta endpoint + tabla)
```

### TOTAL
```
15 Reglas de Negocio Documentadas
├── ✅ Implementadas: 8 (53%)
└── ❌ Pendientes: 7 (47%)
```

---

## 🎯 Checklist de Validación

Ejecutar en terminal:

```bash
# 1. Verificar que las nuevas secciones existen
grep -c "## RN\(9\|10\|11\|12\|13\|14\|15\)" \
  02-tu-trabajo/pruebas-reglas-negocio.md
# Esperado: 7

# 2. Verificar tabla expandida
grep "| RN[9-9]\|RN1[0-5]" 02-tu-trabajo/pruebas-reglas-negocio.md | wc -l
# Esperado: 7 filas

# 3. Verificar sección de omisiones
grep -c "OMISIÓN" 02-tu-trabajo/pruebas-reglas-negocio.md
# Esperado: 7+

# 4. Búsqueda en archivo de resumen
ls -la RESUMEN_EXPANSION_QA_RN9-RN15.md
# Debe existir
```

---

## 📞 Contacto & Próximos Pasos

**Documento Generado:** 31/05/2026  
**Versión:** 1.0  
**Responsable:** QA Team - Etapa 4

### Próximas Acciones
1. ✅ Revisar documento de pruebas expandido
2. ⏳ Implementar RN9-RN15 en `proyecto/src/`
3. ⏳ Ejecutar pruebas completas (RN1-RN15)
4. ⏳ Documentar resultados en `bitacora.md`
5. ⏳ Generar reporte comparativo (Sin IA vs Con IA)

---

