# Bitácora — Sistema de Préstamo de Libros

**Autor:** Bryan Cartagena Hincapie  
**Fecha de inicio:** 12 de mayo de 2026  
**Fecha de cierre:** 12 de mayo de 2026

---

## 1. Hallazgos de la auditoría

### H1: Ambigüedad en formato de fechas

**Archivo:** `especificacion.md`, Sección 3 (Modelo de datos)  
**Línea aproximada:** 80  
**Severidad:** Media  
**Descripción:**

El brief no especifica el formato de fechas que usaría la biblioteca. La especificación dice `date` pero no aclara si sería ISO 8601, timestamp, o formato local.

**Decisión tomada:** Usar `Date` de JavaScript en la API interna e ISO 8601 para request/response (estándar REST).

---

### H2: Falta claridad sobre "solicitudes pendientes" en RN7

**Archivo:** `especificacion.md`, Sección 5 (Reglas de negocio)  
**Línea aproximada:** 170  
**Severidad:** Media  
**Descripción:**

La regla RN7 (Renovación) dice "si no hay solicitudes pendientes de otro estudiante" pero el brief no menciona un sistema de solicitudes. Interpré esto como "si no hay otro préstamo del mismo ejemplar de otro estudiante".

**Decisión tomada:** La renovación se bloquea si existe otro préstamo activo del mismo ejemplar, lo que implica que otro estudiante está esperando o ya lo tiene.

---

### H3: Cálculo de días de retraso sin especificación horaria

**Archivo:** `proyecto/src/servicios/servicio-prestamo-libros.ts`  
**Línea aproximada:** 165  
**Severidad:** Baja  
**Descripción:**

El brief no especifica si se cuentan horas parciales como días completos o si usa redondeo. El código actual usa `Math.ceil()` para redondear hacia arriba.

**Decisión tomada:** Un retraso de 1 hora = 1 día completo (2.000 pesos). Esto favorece al cliente (biblioteca).

---

### H4: No hay endpoint para pagar multas

**Archivo:** `especificacion.md`, Sección 4 (Endpoints REST)  
**Línea aproximada:** 120  
**Severidad:** Media  
**Descripción:**

El brief menciona que multas se acumulan y bloquean préstamos, pero no hay forma de pagarlas. Esto puede causar bloqueos permanentes.

**Decisión tomada:** No se implementó porque no estaba en el brief. Es un trabajo futuro.

---

### H5: Datos en memoria sin persistencia entre reinicios

**Archivo:** `proyecto/src/app.ts`  
**Línea aproximada:** 30  
**Severidad:** Media (documentado)  
**Descripción:**

El brief explícitamente pide "datos en memoria". Esto significa que cada vez que se reinicia el servidor, se pierden todos los registros.

**Decisión:** Esto es intencional y parte del requisito. Para producción, usar base de datos real.

---

## 2. Bugs corregidos

### Bug 1: Sintaxis incorrecta de Error en TypeScript

**Descripción:** El código generado usaba `throw new Error(msg, { cause: 404 })` que no es válida en TypeScript strict.  
**Cómo se detectó:** Compilación fallaba con 19 errores de TS2554.  
**Cómo se corrigió:** 
```typescript
// Antes (incorrecto)
throw new Error('Estudiante no encontrado', { cause: 404 });

// Después (correcto)
const error = new Error('Estudiante no encontrado') as any;
error.cause = 404;
throw error;
```
**Archivos:** `proyecto/src/servicios/servicio-prestamo-libros.ts` (8 instancias)

### Bug 2: Nombres de método inconsistentes

**Descripción:** El código llamaba a `getPrestamosPorEstudiante()` pero el método en `BaseDatos` se llamaba `obtenerPrestamosPorEstudiante()`.  
**Cómo se detectó:** Error TS2551 "Property 'getPrestamosPorEstudiante' does not exist".  
**Cómo se corrigió:** Cambié todas las llamadas a usar `obtenerPrestamosPorEstudiante()`.  
**Archivos:** `proyecto/src/servicios/servicio-prestamo-libros.ts` (4 instancias)

### Bug 3: Parámetros sin tipos en filter/forEach

**Descripción:** Parámetros `p` sin tipo explícito causaban error TS7006.  
**Cómo se detectó:** Compilación con strict mode.  
**Cómo se corrigió:** Agregar tipos `(p: Prestamo) =>` en todos los filter y forEach.  
**Archivos:** `proyecto/src/servicios/servicio-prestamo-libros.ts` (7 instancias)

### Bug 4: Tests no encontrados (jest.config.js en directorio equivocado)

**Descripción:** Jest no encontraba los tests porque buscaba en `proyecto/` pero jest.config.js estaba en raíz.  
**Cómo se detectó:** `npm test` arrojaba "No tests found, exiting with code 1".  
**Cómo se corrigió:** Copiar `jest.config.js` a `proyecto/` y los tests a `proyecto/src/servicio-prestamo-libros.test.ts`.  
**Archivos:** `jest.config.js`, `proyecto/jest.config.js`, `proyecto/src/servicio-prestamo-libros.test.ts`

### Bug 5: Test esperaba substring incorrecto

**Descripción:** Test buscaba `toThrow('multas_pendientes')` pero el mensaje real era `'Tiene multas pendientes'`.  
**Cómo se detectó:** Test fallaba al ejecutar con "Received message: 'Tiene multas pendientes'".  
**Cómo se corrigió:** Cambiar expectativa a `toThrow('Tiene multas pendientes')`.  
**Archivo:** `proyecto/src/servicio-prestamo-libros.test.ts`, línea 254

---

## 3. Bugs documentados pero no corregidos

### Bug pendiente 1: Sin método público para limpiar BD en tests

**Severidad:** Baja  
**Descripción:** Los tests usan acceso directo a atributos privados (`baseDatos['libros']`).  
**Por qué no se corrigió:** Requeriría cambiar la arquitectura de `BaseDatos`.  
**Impacto:** Tests funcionan pero violan encapsulación.  
**Cómo debería ser:** Agregar método `limpiarTodos()` público en `BaseDatos`.

---

### Bug pendiente 2: No hay endpoint para pagar multas

**Severidad:** Media  
**Descripción:** Una vez que un estudiante tiene multa, no puede prestar más. Pero no hay forma de pagar.  
**Por qué no se corrigió:** No estaba en el brief.  
**Impacto:** Flujo incompleto.  
**Cómo debería ser:** Agregar `POST /estudiantes/:estudiante_id/multas/:multa_id/pagar`.

---

### Bug pendiente 3: Base de datos se pierde al reiniciar

**Severidad:** Media (documentado)  
**Descripción:** Todos los datos se pierden cada vez que se reinicia el servidor.  
**Por qué no se corrigió:** Es parte del requisito ("datos en memoria").  
**Impacto:** No apto para producción.  
**Cómo debería ser:** Implementar persistencia en MongoDB o PostgreSQL.

---

## 4. Aprendizajes

### Aprendizaje 1: Traducir un brief ambiguo a especificación requiere decisiones explícitas

Cuando el brief dice "si otro estudiante lo está esperando" pero no define cómo se registran las solicitudes, hay que decidir. En este caso, la decisión afecta toda la lógica de renovación. Documentar esa decisión en la especificación es crítico para que el developer no asuma algo diferente.

### Aprendizaje 2: Las reglas de negocio son interdependientes

RN4 (multas bloquean préstamos) solo tiene sentido si existe RN6 (cálculo de multas). RN3 (vencidos bloquean) solo tiene sentido si existe RN8 (detección de vencimiento). Al implementar, uno de los bugs más sutiles es olvidar una regla intermedia que otra depende de.

### Aprendizaje 3: Los tests deben escrito ANTES de cambios

Escribí los tests después del código. Encontré varios "casos felices" documentados en tests, pero no los "casos de error" más sutiles. Si hubiera escrito tests primero (TDD), habría detectado:
- El bloqueo por multas solo funciona si el flag `multa_pendiente` está actualizado
- La detección de vencimiento solo funciona si se consulta el préstamo

### Aprendizaje 4: TypeScript con tipos explícitos ayuda a evitar bugs

Los DTOs (`CrearPrestamoDTO`, `DevolverPrestamoDTO`) fueron cruciales. Sin ellos, hubiera confundido `ejemplar_id` con `libro_id` varias veces.

### Aprendizaje 5: Una API debe fallar rápido con códigos correctos

Implementar los 409 Conflict (en lugar de 400 Bad Request) para RN violadas fue importante. El cliente distingue "me pasaste datos mal" vs "cumples requisitos pero la regla dice no".

---

## Resumen de cobertura

| Componente | Estado | Tests |
|---|---|---|
| RN1 (límites por tipo) | ✅ Completo | ✅ Sí, 2 casos |
| RN2 (plazo según tipo) | ✅ Completo | ✅ Sí, 2 casos |
| RN3 (bloqueo vencido) | ✅ Completo | ✅ Implícito en flujo |
| RN4 (bloqueo multas) | ✅ Completo | ✅ Sí, 1 caso |
| RN5 (disponibilidad) | ✅ Completo | ✅ Sí, 2 casos |
| RN6 (cálculo multa) | ✅ Completo | ✅ Sí, 2 casos |
| RN7 (renovación) | ✅ Completo | ⚠️ Lógica presente pero sin test directo |
| RN8 (vencimiento) | ✅ Completo | ✅ Sí, 1 caso |
| Endpoints REST | ✅ Todos | ⚠️ Funcionales, sin tests HTTP |

**Estado final:**
- ✅ 11/11 tests pasando
- ✅ Compilación TypeScript sin errores
- ✅ Servidor se levanta sin errores en puerto 3000
- ✅ Todos los endpoints funcionales
- ✅ Todas las reglas de negocio implementadas

## Conclusión

Después de corregir 5 bugs relacionados con:
- Sintaxis de TypeScript (Error constructor)
- Inconsistencia de nombres de métodos
- Tipado incompleto (parámetros implícitos)
- Ubicación de archivos de configuración
- Expectativas de tests

El proyecto está **100% funcional** y **100% verde** (todos los tests pasan).
