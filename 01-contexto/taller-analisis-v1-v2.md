**Requisitos previos:** Haber explorado los proyectos `proyecto-v1` y `proyecto-v2` del repositorio

---

## Contexto

Durante este taller trabajarás con dos versiones de la misma API REST para gestión de préstamos de una biblioteca universitaria.

- **`proyecto-v1`** — Implementación simple en JavaScript con Express o . Sin validaciones formales, sin arquitectura en capas, sin tests.
- **`proyecto-v2`** — Implementación en TypeScript con Clean Architecture, validaciones con Zod, manejo de errores tipado y suite completa de tests unitarios e integración.

El objetivo no es determinar cuál versión es "mejor", sino comprender qué impacto tiene la estructura del código sobre la capacidad de probarlo.

---

## Antes de empezar

Levanta ambos servidores en terminales separadas:

```bash
# Terminal 1
cd proyecto-v1
node src/index.js
```

```bash
# Terminal 2
cd proyecto-v2
npm run dev
```

Verifica que ambos respondan:

```bash
curl http://localhost:3000/
curl http://localhost:3001/
```

---

## Bloque 1 — Lectura y comparación estructural

### Ejercicio 1.1 — Inventario de diferencias

Recorre ambos proyectos y completa la siguiente tabla en tu bitácora:

| Dimensión | v1 | v2 |
|---|---|---|
| Lenguaje | | |
| Validación de entradas al servidor | | |
| Manejo de errores HTTP | | |
| Arquitectura (número de capas) | | |
| Tests incluidos | | |
| Tipado de datos | | |
| Forma de iniciar la aplicación | | |

### Ejercicio 1.2 — Rastreo de una regla de negocio

Localiza la **RN1: límite de préstamos simultáneos por tipo de estudiante** en ambas versiones y responde:

1. ¿En qué archivo está en v1? ¿En cuántas líneas se implementa?
2. ¿En qué archivo(s) está en v2? ¿Qué capas atraviesa?
3. Si el cliente pide cambiar el límite de pregrado de 3 a 4, ¿cuántos archivos hay que modificar en cada versión?
4. ¿Cómo sabrías que el cambio no rompió nada en cada versión?

---

## Bloque 2 — Análisis de calidad y comportamiento ante errores

**Modalidad:** Parejas  
**Tiempo:** 30 minutos

### Ejercicio 2.1 — El request que no debería funcionar

Ejecuta el siguiente comando contra **v1**:

```bash
curl -s -X POST http://localhost:3000/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{"estudianteId": "NO-EXISTE", "ejemplarId": "abc"}' | jq
```

Luego ejecuta el mismo request contra **v2** (ajusta el puerto si es necesario).

Responde en tu bitácora:

1. ¿Qué código HTTP devuelve cada versión?
2. ¿Qué información contiene el cuerpo de la respuesta en cada caso?
3. ¿Cuál respuesta es más útil para un cliente que consume la API?
4. ¿Qué pasa en v1 si `ejemplarId` llega como string en lugar de número? ¿Y en v2?

### Ejercicio 2.2 — Comparar errores de dominio

Provoca el mismo error de negocio en ambas versiones: intenta prestar un ejemplar que ya está prestado.

Pasos sugeridos:
1. Crea un préstamo con el ejemplar 1
2. Intenta crear otro préstamo con el mismo ejemplar 1

Registra y compara:

| Aspecto | v1 | v2 |
|---|---|---|
| Código HTTP | | |
| Campo `error` en la respuesta | | |
| Mensaje legible | | |
| Información adicional (detalles) | | |
| ¿Expone información interna del servidor? | | |

---

## Bloque 3 — Análisis de los tests de v2

### Ejercicio 3.1 — Lectura de un test unitario

Abre el archivo `proyecto-v2/tests/unit/CrearPrestamo.test.ts` y responde:

1. ¿Qué técnica de aislamiento se usa? (mocks, stubs, fakes, spies)
2. ¿Se levanta algún servidor HTTP para ejecutar este test? ¿Por qué importa esto?
4. Identifica en qué línea(s) del archivo se prueba la **RN4** (multa pendiente) y la **RN3** (préstamos vencidos pendientes).
5. ¿Cuánto tiempo tarda en ejecutarse este test? Corre `npm 

---

## Bloque 4 — Escritura de tests


### Ejercicio 4.1 — Un test que v1 no puede tener con la misma velocidad

En `proyecto-v2`, escribe un test unitario para `CrearPrestamo` que verifique que un estudiante de **posgrado** puede tener hasta 5 préstamos simultáneos pero falla al intentar el sexto.

Plantilla de inicio:

```typescript
it('RN1 — posgrado falla al intentar el sexto préstamo', async () => {
  const vigentes: Prestamo[] = Array.from({ length: 5 }, (_, i) => ({
    // completa los campos necesarios
  }));
  // construye el caso de uso con los repos mockeados
  // verifica que lanza LimitePrestamosAlcanzado
});
```

Una vez terminado, reflexiona: ¿por qué sería más lento o difícil escribir este test en v1?

