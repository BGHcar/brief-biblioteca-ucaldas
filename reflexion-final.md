# Reflexión Final — Sistema de Préstamo de Libros

**Autor:** Bryan Cartagena Hincapie  
**Fecha:** 12 de mayo de 2026

---

## 1. La decisión más difícil: ¿Qué es una "solicitud pendiente"?

**La decisión:**

Cuando la cliente Diana dijo "la renovación solo se puede hacer si nadie más ha solicitado ese libro", no aclaró si existía un sistema formal de solicitudes. El correo no menciona carrito de solicitudes, lista de espera, ni tabla de solicitudes en la base de datos.

Decidí que **"solicitud pendiente" = existencia de otro préstamo activo del mismo ejemplar de otro estudiante**.

**Por qué fue difícil:**

Hay al menos 3 interpretaciones plausibles:
1. **Mi decisión:** Si otro estudiante tiene el ejemplar, no puedo renovar (interpretación estricta).
2. **Alternativa A:** Crear tabla de `solicitudes` con estado "pendiente" que registre cuándo otro estudiante espera.
3. **Alternativa B:** No renovar si el mismo estudiante lo pidió antes (historial).

Si hubiera elegido Alternativa A, el modelo de datos sería completamente diferente:
```
Prestamo 1 --- N Solicitud
Estudiante 1 --- N Solicitud
```

Y la lógica de renovación sería:
```typescript
const solicitudesPendientes = baseDatos.obtenerSolicitudes()
  .filter(s => s.ejemplar_id === ejemplar.ejemplar_id && s.estado === 'pendiente');
```

**Por qué elegí mi decisión:**

- El brief no menciona solicitudes como entidad separada.
- El cliente dijo "máximo 3 libros simultáneamente", lo que implica control del presente, no del futuro.
- La interpretación más simple es: "si otro estudiante lo tiene, tú no lo renuevas".
- Si después el cliente dice "necesitamos solicitudes", es fácil agregar esa tabla. Pero si implementé solicitudes innecesarias, desperdicial tiempo.

**Implicación en el código:**

```typescript
// RN7 implementado: validar otros préstamos del mismo ejemplar
const otrosPrestamos = baseDatos.getPrestamosPorEstudiante(prestamo.estudiante_id)
  .filter(p => p.ejemplar_id === prestamo.ejemplar_id && p.prestamo_id !== prestamo_id);

if (otrosPrestamos.length > 0) {
  throw error('renovacion_no_permitida');
}
```

Esta es una decisión que habría discutido con la cliente si tuviera tiempo. Por ahora, documenta en [especificacion.md](02-tu-trabajo/plantilla-especificacion.md) bajo "D5 — Concepto de 'solicitud pendiente'".

---

## 2. Un momento donde la IA generó algo plausible pero incorrecto

**La situación:**

Cuando generé el código del servicio, escribí esta línea en `RN7 — Renovación`:

```typescript
const otrosPrestamos = baseDatos.getPrestamosPorEstudiante(prestamo.estudiante_id)
  .filter(p => p.ejemplar_id === prestamo.ejemplar_id && p.prestamo_id !== prestamo_id);
```

**¿Por qué parecía correcto?**

Sintácticamente, el código compila. Los tipos son válidos. Logicamente, filtra "otros préstamos del mismo estudiante para el mismo ejemplar". Si lo lees rápido, suena como "validar si otro estudiante lo tiene".

**¿Dónde estaba el error?**

El filtro estaba buscando en los **préstamos del mismo estudiante** (`getPrestamosPorEstudiante(estudiante_id)`). Pero la regla debería validar si **otro estudiante** tiene el ejemplar.

El código correcto debería ser:

```typescript
const todosLosPrestamos = baseDatos.getPrestamos();
const otrosEstudiantesConEjemplar = todosLosPrestamos.filter(
  p => p.ejemplar_id === prestamo.ejemplar_id 
    && p.estudiante_id !== prestamo.estudiante_id
    && p.estado === EstadoPrestamo.ACTIVO
);

if (otrosEstudiantesConEjemplar.length > 0) {
  throw error('Otro estudiante tiene este ejemplar');
}
```

**¿Cómo me di cuenta?**

Escribía el test:

```typescript
test('No se puede renovar si otro estudiante tiene el ejemplar', () => {
  // Estudiante 1 crea préstamo
  const prestamo1 = servicioPrestamoLibros.crearPrestamo({
    estudiante_id: 'EST001',
    ejemplar_id: 'EJ001'
  });

  // Estudiante 2 intenta prestar el mismo ejemplar
  // (esto debería fallar en crearPrestamo por disponibilidad)
  
  // Estudiante 1 intenta renovar
  expect(() => {
    servicioPrestamoLibros.renovarPrestamo(prestamo1.prestamo_id);
  }).not.toThrow(); // ← ESTO FALLABA
});
```

Me di cuenta porque **el test pasaba cuando debería fallar**. La lógica filtrada estaba devolviendo un array vacío (porque no hay otro préstamo del mismo estudiante), así que la renovación se permitía.

**¿Qué hice?**

Cambié la lógica en servicio-prestamo-libros.ts para filtrar todos los préstamos, no solo los del mismo estudiante. El test entonces falló (como debería), y la renovación se bloqueó correctamente.

**Lección:**

La IA puede generar código que compila y "se ve bien" pero tiene lógica incorrecta. Los tests ayudan, pero requieren **pensar en los casos de error**, no solo en los casos felices. Este bug habría pasado desapercibido en producción hasta que un estudiante intentara renovar mientras otro tenía el libro.

---

## 3. Si mañana me dicen "no necesitamos QA, la IA genera tests"

**Mi respuesta:**

"Con respeto, eso es falso basándome en la experiencia de hoy. Un ejemplo concreto:

La IA generó código para renovar préstamos que **se veía correcto**. Compilaba, los tipos eran válidos, e incluso había lógica de validación. Pero filtraba préstamos del **mismo estudiante** cuando debería filtrar del **otro estudiante**.

Esto pasó porque:

1. **La IA genera casos felices, no casos de error.** Mis primeros tests fueron "¿puedo renovar?" (sí). No fueron "¿qué pasa si alguien más tiene el libro?" Tuve que escribir esos tests manualmente.

2. **La IA no entiende el negocio.** La regla dice 'si otro estudiante lo espera, no renuevas'. Pero ¿quién es el "otro estudiante"? ¿Cómo se define "espera"? La IA no hace esas preguntas; solo implementa lo que le dice. Yo, como QA, tengo que validar que lo que implementó tiene sentido para el cliente.

3. **El bug era lógico, no de sintaxis.** `getPrestamosPorEstudiante()` es una función legítima. Es correcta para otras reglas (RN1, RN4). Pero para RN7, es incorrecta. Un IDE no la detecta como error. Un test bien escrito sí.

Lo que sí puede hacer la IA:

- ✅ Generar casos de prueba de estructura (¿existe el id? ¿tiene campos requeridos?)
- ✅ Generar tests unitarios de funciones pequeñas
- ✅ Generar scaffolding (HTTP 201 cuando crea, 404 cuando no existe)

Lo que **no puede** hacer sin ayuda:

- ❌ Validar que la lógica de negocio es correcta
- ❌ Pensar en casos adversos (¿qué pasa si X y Y son simultáneos?)
- ❌ Diferenciar entre validaciones que parecen similares (otro estudiante ≠ mismo estudiante)

En conclusión: QA no es un lujo. Es la malla de seguridad que atrapa lo que la IA (y yo) pasamos por alto. Sin QA, código 'correctamente compilado' mata el negocio."

---

## Resumen

Hacer esta especificación y este código me enseñó que:

1. **Traducir requisitos es un arte.** Lo que el cliente dice raramente es lo que significan. Una decisión sobre "solicitud pendiente" cambia todo el modelo.

2. **Los tests son acusadores honestos.** No mienten. La IA sí puede mentir (código que compila pero es lógicamente incorrecto).

3. **QA es el guardián del sentido común.** Un test te obliga a pensar en "¿qué pasa si...?" La IA no lo hace naturalmente.
