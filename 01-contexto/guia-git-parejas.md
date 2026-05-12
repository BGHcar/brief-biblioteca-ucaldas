# Guia Git para trabajo en pareja

## Configuracion inicial (una sola vez por pareja)

### Paso 1: Una persona crea el fork

Solo una persona del equipo hace fork de mi repositorio en GitHub.

### Paso 2: Agregar al compañero como colaborador

En el fork creado: **Settings > Collaborators > Add people**

Agregar el usuario de GitHub del compañero.

### Paso 3: Ambos clonan el fork compartido

```bash
git clone https://github.com/..
```

### Paso 4: Ambos configuran el upstream

El upstream conecta su fork con mi repositorio original. Esto les permite recibir actualizaciones que yo haga durante el taller.

```bash
git remote add upstream https://github.com/YanethM/brief-biblioteca-ucaldas.git
```

Verificar que quedo bien:

```bash
git remote -v
# origin    https://github.com/su-fork/repo.git
# upstream  https://github.com/YanethM/brief-biblioteca-ucaldas.git
```

---

## Flujo de trabajo 

### Antes de empezar a trabajar

Siempre partir del estado mas reciente:

```bash
git pull origin main
```

### Trabajar en su rama

Cada tarea o sesion de trabajo va en una rama propia:

```bash
# Crear y moverse a una rama nueva
git checkout -b nombre-tarea

# Ejemplos de nombres
git checkout -b especificacion
git checkout -b prompts-sesion1
git checkout -b tests-prestamos
```

### Guardar avances

```bash
git add .
git commit -m "descripcion corta de lo que hicieron"
```

### Subir la rama al fork compartido

```bash
git push origin nombre-tarea
```

### Fusionar al main cuando la tarea esta lista

En GitHub, abrir un **Pull Request** desde su rama hacia `main` del mismo fork. El compañero revisa y aprueba. Luego hacen merge.

---

## Cuando yo actualice el repositorio original

Si les aviso que hice cambios en mi repositorio, ejecuten esto para recibirlos:

```bash
# Traer mis cambios
git fetch upstream

# Fusionarlos en su main local
git merge upstream/main

# Subir al fork para que el compañero tambien los tenga
git push origin main
```

---

## Entregas por etapa

Cada etapa del taller tiene su propia rama. Cuando terminen la etapa, suben la rama y abren un Pull Request hacia `main` del fork.

### Etapa 1 — Especificacion

```bash
git pull origin main
git checkout -b especificacion 
# Completar mi-entrega/especificacion.md a partir de la plantilla
git add mi-entrega/especificacion.md
git commit -m "etapa1: especificacion del sistema de biblioteca"
git push origin especificacion
```

Abrir PR en GitHub: rama `especificacion` → `main` del fork.

---

### Etapa 2 — Generacion con IA

```bash
git pull origin main
git checkout -b generacion-ia
# Agregar mi-entrega/prompts/01-generacion-inicial.md y la carpeta proyecto/
git add mi-entrega/prompts/ mi-entrega/proyecto/
git commit -m "etapa2: codigo generado y prompts iniciales"
git push origin generacion-ia
```

Abrir PR: rama `generacion-ia` → `main`.

---

### Etapa 3 — Auditoria

```bash
git pull origin main
git checkout -b auditoria
# Actualizar mi-entrega/bitacora.md con los hallazgos
git add mi-entrega/bitacora.md mi-entrega/prompts/
git commit -m "etapa3: hallazgos de auditoria en bitacora"
git push origin auditoria
```

Abrir PR: rama `auditoria` → `main`.

---

### Etapa 4 — Tests

```bash
git pull origin main
git checkout -b tests
# Agregar la carpeta mi-entrega/tests/ y el prompt de tests
git add mi-entrega/tests/ mi-entrega/prompts/
git commit -m "etapa4: suite de tests generada y ejecutada"
git push origin tests
```

Abrir PR: rama `tests` → `main`.

---

### Etapa 5 — Correcciones

```bash
git pull origin main
git checkout -b correcciones
# Actualizar codigo corregido, prompts de fix y diff-de-correcciones.md
git add mi-entrega/proyecto/ mi-entrega/prompts/ mi-entrega/diff-de-correcciones.md
git commit -m "etapa5: bugs corregidos y suite verde"
git push origin correcciones
```

Abrir PR: rama `correcciones` → `main`.

---

### Entrega final

Cuando todos los PR anteriores esten fusionados en `main`, agregan los archivos finales que falten y confirman que la estructura de entrega este completa:

```bash
git checkout main
git pull origin main
# Verificar que mi-entrega/ tenga todos los archivos requeridos
git add mi-entrega/reflexion-final.md
git commit -m "entrega final: reflexion y revision de estructura"
git push origin main
```

---

## Reglas de oro

- **Siempre** hacer `git pull origin main` antes de empezar.
- **Nunca** trabajar directamente en `main`; usar ramas.
- **Coordinar** con el compañero cuando van a fusionar cambios.
- **Sincronizar** el upstream cuando yo les avise que actualice el repo.
