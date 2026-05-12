# Prompt 03: Generar Tests para Sistema de Préstamo

**Fecha y hora:** 12 de mayo de 2026, 10:30 AM  
**Propósito:** Crear suite de tests para todas las reglas de negocio  
**Estado:** ✅ Completado

---

## Prompt enviado

```
Basándote en el código generado del proyecto, crea una suite de tests Jest/TypeScript que cubra:

1. RN1 - Límite de préstamos (pregrado máx 3, posgrado máx 5)
2. RN2 - Cálculo de plazo (15 días normal, 3 días alta demanda)
3. RN3 - Bloqueo por préstamo vencido sin devolver
4. RN4 - Bloqueo por multas pendientes
5. RN5 - Validación de disponibilidad del ejemplar
6. RN6 - Cálculo automático de multa en devolución tardía
7. RN7 - Validación de renovación
8. RN8 - Detección de vencimiento

Los tests deben:
- Ser independientes (beforeEach limpiar datos)
- Usar datos de ejemplo creados en cada test
- Verificar tanto casos exitosos como casos de error
- Usar expect() con mensajes claros
```

Contexto: Código completado en `proyecto/src/`.

---

## Resumen de la respuesta

La IA generó **1 archivo** (`tests/servicio-prestamo-libros.test.ts`) con:

- **9 describe blocks** (uno por regla de negocio)
- **14 test cases** cubriendo:
  - Límites por tipo de estudiante (2 tests)
  - Cálculo de plazo (2 tests)
  - Control de disponibilidad (2 tests)
  - Cálculo de multa (2 tests)
  - Bloqueo por multas (1 test)
  - Detección de vencimiento (1 test)
  - Flujo completo (1 test)
  - Casos de error e implícitos (2 tests)

---

## Evaluación

**¿Fue útil?** ⚠️ Parcialmente  
**¿La aceptaste tal cual?** ❌ No, requirió modificaciones importantes

**Problemas encontrados:**

### Problema 1: Tests usando acceso a privados

El código generado hacía:
```typescript
baseDatos['libros'].delete(l.libro_id);  // ← Acceso a atributo privado
```

**Por qué es un problema:** Viola encapsulación. Los atributos `libros`, `ejemplares`, etc. son privados (no hay método público para limpiar).

**Cómo lo detecté:** Compiló pero con TypeScript warnings sobre acceso a `['libros']`.

**Cómo lo corregí:** Lo dejé así por ahora, pero noté que debería haber método `limpiar()` público en `BaseDatos`.

### Problema 2: Test incompleto para RN3

El test para "bloqueo por préstamo vencido" estaba implícito pero no había test directo que verificara:
```typescript
const prestamo = crearPrestamo();
prestamo.estado = 'vencido';
baseDatos.actualizarPrestamo(...);
expect(() => crearPrestamo()).toThrow('vencido');
```

**Por qué no lo generó:** Probablemente porque el flujo es "create → marcar vencido → intentar crear otro" y es poco obvio.

### Problema 3: Tests de HTTP no incluidos

Los tests cubren la **lógica de negocio** (servicio) pero no los **endpoints REST** (rutas HTTP). 

**Ejemplo:** No hay test que valide que POST /prestamos retorna 409 cuando hay multas.

**Por qué lo acepté así:** Está en el scope implícito - los tests generados son del servicio, no de la API HTTP.

---

## Fortalezas de los tests

- ✅ Cada describe block aislado
- ✅ beforeEach crea datos frescos para cada test
- ✅ Cubren casos exitosos y de error
- ✅ Usan expect() con assertions claras
- ✅ RN1, RN2, RN5, RN6 están bien testeadas
- ✅ Detectan bugs (como el de RN7 que documenté en la bitácora)

---

## Debilidades

- ❌ Sin tests para RN3 (bloqueo vencido) explícito
- ❌ Sin tests para RN7 (renovación) directo
- ⚠️ Sin tests HTTP de la API REST
- ⚠️ Sin tests de integración (múltiples estudiantes simultáneamente)
- ⚠️ Acceso a privados en beforeEach

---

## Próximos pasos

Los tests se pueden ejecutar con:
```bash
npm install
npm test
```

Todos deberían pasar (verdes) una vez se corrija el bug de RN7 en el servicio.
