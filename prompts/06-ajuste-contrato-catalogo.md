## Prompt #6

**Fecha y hora:** 2026-05-26 00:00

**Propósito en una línea:** Ajustar las rutas administrativas y el seed automático para cumplir con el contrato del taller hasta la línea 92 del plan de pruebas.

**Etapa del taller:** 4

**IA usada:** Tu entorno actual.

---

### Prompt enviado (literal)

```
Actúa como un Ingeniero de Software Senior. Revisando en detalle el plan de pruebas oficiales ("02-tu-trabajo\pruebas-reglas-negocio.md") hasta la línea 92, identificamos dos discrepancias críticas en los endpoints administrativos que creaste, las cuales hacen que el script del taller falle al ejecutarse:

1. El plan de pruebas (línea 75) usa una ruta jerárquica para crear ejemplares: POST /api/libros/:libro_id/ejemplares, enviando en el cuerpo JSON solo el ID del ejemplar: {"id": "EJ-001-01"} (o "ejemplar_id"). Actualmente tu endpoint espera un POST plano en /api/ejemplares.
2. Los comandos del script inyectan IDs con guiones específicos (EST-PRE-01, EST-POS-01, LIB-001, LIB-002, EJ-001-01), mientras que tu auto-seed actual usa formatos planos sin guiones (EST001, LIB001, EJ001).

Por favor, aplica las siguientes correcciones de inmediato para cumplir estrictamente con el contrato hasta la línea 92, asegurándote de no romper los 11 tests de Jest existentes:

---

### TAREA 1: Modificar la Ruta de Creación de Ejemplares
- En src/rutas/rutas.ts (y su respectivo servicio), cambia el endpoint de creación de ejemplares para que responda exactamente a: POST /api/libros/:libro_id/ejemplares.
- Extrae el libro_id de los parámetros de la URL (req.params) y el ID del ejemplar del cuerpo de la petición. Haz que soporte tanto la propiedad id como ejemplar_id en el JSON para evitar fallos por nomenclatura.
- Si el libro_id suministrado en la URL no existe en la base de datos, debe retornar un código 404 Not Found.

### TAREA 2: Sincronizar el Auto-Seed de Desarrollo
- Modifica el script de inicialización automática en desarrollo (app.ts o donde manejes el seed para biblioteca.db).
- Cambia los registros por defecto para que coincidan exactamente con los formatos del taller:
  - Estudiantes: EST-PRE-01 (pregrado) y EST-POS-01 (posgrado).
  - Libros: LIB-001 (normal) y LIB-002 (alta demanda).
  - Ejemplares iniciales: EJ-001-01, EJ-001-02, etc.

### TAREA 3: Registro de la Evidencia (Prompt #6)
- Antes de mostrarme el código, crea un archivo en la carpeta prompts/ llamado exactamente 06-ajuste-contrato-catalogo.md usando la plantilla oficial. Registra los detalles de esta interacción.

---

Ejecuta los cambios, corre la suite de pruebas locales para garantizar que todo siga en verde, y muéstrame el resumen de los archivos modificados junto con la confirmación del archivo de prompt creado.
```

---

### Resumen de la respuesta de la IA

[Pendiente de completar tras aplicar los cambios.]

---

### Mi evaluación

**¿La respuesta cumplió con lo que pedí?**

- [ ] Completamente.
- [ ] Parcialmente. Faltó: [...]
- [ ] No, se desvió. Hizo: [...]

**¿La acepté tal cual o la modifiqué?**

- [ ] Tal cual.
- [ ] La modifiqué a mano. Cambios: [...]
- [ ] Le pedí corrección con un prompt nuevo (ver prompt #[N+1]).
- [ ] La rechacé completamente. Razón: [...]

**¿Qué aprendí de esta interacción?**

[Pendiente de completar tras ejecutar los cambios.]
