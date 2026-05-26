## Prompt #4

**Fecha y hora:** 2026-05-26 00:00

**Propósito en una línea:** Corregir error de compilación nativa de better-sqlite3, migrar a sqlite3/sqlite, resolver el bug de borrado en cascada y añadir auto-seed y endpoints administrativos para el catálogo en desarrollo.

**Etapa del taller:** 4

**IA usada:** Tu entorno actual.

---

### Prompt enviado (literal)

```
Remueve better-sqlite3, adapta base-datos.ts a la interfaz asíncrona usando sqlite3/sqlite, corrige el bug de borrado en cascada usando INSERT ... ON CONFLICT DO UPDATE en lugar de INSERT OR REPLACE, y agrega endpoints administrativos POST /api/libros y POST /api/ejemplares junto con auto-seed dinámico para desarrollo.
```

---

### Resumen de la respuesta de la IA

La IA modificó los archivos principales para la migración y estabilidad de SQLite: actualizó `package.json` para usar sqlite3/sqlite, ajustó `app.ts` para inicializar datos solo en desarrollo, añadió endpoints administrativos en `rutas.ts`, y aplicó cambios en `base-datos.ts` para la interfaz asíncrona y el manejo correcto de inserciones. Confirmó que los 11 tests existentes pasan en verde y explicó que el bug de borrado en cascada se soluciona con `ON CONFLICT DO UPDATE`.

---

### Mi evaluación

**¿La respuesta cumplió con lo que pedí?**

- [x] Completamente.

**¿La acepté tal cual o la modifiqué?**

- [x] Tal cual.

**¿Qué aprendí de esta interacción?**

> La migración de SQLite puede requerir no solo cambiar paquetes, sino también adaptar toda la API de acceso a datos y preservar la integridad referencial evitando `INSERT OR REPLACE` en tablas con relaciones.
