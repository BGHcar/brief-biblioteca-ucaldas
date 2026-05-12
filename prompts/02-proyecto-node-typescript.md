# Prompt 02: Generar Proyecto Node.js + TypeScript Completo

**Fecha y hora:** 12 de mayo de 2026, 10:00 AM  
**Propósito:** Crear estructura completa de API REST con todos los endpoints y reglas de negocio  
**Estado:** ✅ Completado

---

## Prompt enviado

```
Basándote en la especificación formal del Sistema de Préstamo de Libros,
genera un proyecto Node.js 20 + Express + TypeScript completamente funcional que implemente:

1. Todos los 10 endpoints REST definidos
2. Todas las 8 reglas de negocio (RN1-RN8)
3. Las 5 entidades (Libro, Ejemplar, Estudiante, Préstamo, Multa)
4. Base de datos en memoria (Map)
5. Validaciones con códigos HTTP correctos (200, 201, 400, 404, 409)
6. Datos iniciales de ejemplo para testing
7. Proyecto debe ser ejecutable con 'npm start' después de instalar dependencias

No agregues funcionalidades extras. Solo lo de la especificación.
```

Contexto: Especificación completada en `02-tu-trabajo/plantilla-especificacion.md`.

---

## Resumen de la respuesta

La IA generó **8 archivos principales**:

1. **package.json** — Dependencias (Express, UUID, TypeScript)
2. **tsconfig.json** — Configuración de compilación
3. **src/modelos/tipos.ts** — Interfaces y enums de todas las entidades
4. **src/base-datos/base-datos.ts** — Clase singleton con Maps para almacenamiento
5. **src/servicios/servicio-prestamo-libros.ts** — Lógica completa de todas las RN
6. **src/rutas/rutas.ts** — Los 10 endpoints REST con manejo de errores
7. **src/app.ts** — Servidor Express con inicialización de datos
8. **.gitignore** — Configuración estándar

---

## Evaluación

**¿Fue útil?** ✅ Sí, con una corrección  
**¿La aceptaste tal cual?** ⚠️ Casi. Tuve que corregir un error.

**Error encontrado:**

En `src/app.ts` línea 18, estaba:
```typescript
app.use(api, rutas);  // ← INCORRECTO
```

Debería ser:
```typescript
app.use('/api', rutas);  // ← CORRECTO
```

**Por qué pasó:** La IA confundió la sintaxis de Express. `app.use()` espera `(path, middleware)`, no `(variable, middleware)`.

**Cómo lo detecté:** Intenté compilar con `tsc` y arrojó error.

---

## Observaciones

### Fortalezas

- ✅ Estructura clara y escalable (servicios, rutas, modelos separados)
- ✅ Tipos TypeScript bien definidos para todas las entidades
- ✅ Las 8 reglas de negocio todas implementadas
- ✅ Manejo de errores con códigos HTTP correctos (409 para conflictos de RN)
- ✅ DTOs (`CrearPrestamoDTO`, `DevolverPrestamoDTO`) bien definidos

### Debilidades

- ❌ Error de sintaxis en rutas (documentado arriba)
- ⚠️ Acceso a métodos privados en tests (`baseDatos['libros']`) para limpiar datos
- ⚠️ Sin método público para resetear base de datos entre tests
- ⚠️ Sin validación HTTP de schemas (debería usarse `express-validator` o similar)

---

## Próximos pasos

El proyecto está funcional y listo para:
- Ejecutar servidor: `npm install && npm run dev`
- Compilar: `npm run build`
- Ejecutar tests: `npm test`
