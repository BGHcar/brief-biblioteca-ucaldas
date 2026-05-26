# Taller — Chatbot de Pruebas con Ollama

**Propósito:** instalar un modelo de lenguaje local con Ollama y construir un chatbot que te ayude a generar y ejecutar pruebas contra tu API de la Biblioteca UCaldas.

**Duración estimada:** 60 – 80 minutos  
**Requisito previo:** tu API debe estar corriendo en `localhost:3001` (Etapa 2 completada)

---

## ¿Por qué Ollama para pruebas?

Cuando le pides a una IA que te genere tests anclándola a tus reglas de negocio, el resultado depende del contexto que le das. Con Ollama puedes:

- Correr el modelo localmente, sin enviar tu código a servidores externos.
- Construir un chatbot especializado que ya conoce las reglas RN1–RN8 antes de que le preguntes.
- Iterar rápido: cambia el system prompt y vuelve a correr sin gastar créditos de API.

---

## Parte 1 — Instalar Ollama

### macOS

```bash
brew install ollama
```

O descarga el instalador desde [ollama.com/download](https://ollama.com/download) y ejecuta el `.dmg`.

Verifica que quedó instalado:

```bash
ollama --version
```

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows

Descarga el instalador `.exe` desde [ollama.com/download](https://ollama.com/download) y sigue el asistente.

---

## Parte 2 — Elegir y descargar un modelo

Ollama sirve modelos localmente. Elige uno según la RAM disponible en tu máquina:

| Modelo              | RAM mínima | Perfil                                             |
|---------------------|------------|----------------------------------------------------|
| `llama3.2:1b`       | 2 GB       | Muy liviano, respuestas cortas                     |
| `llama3.2:3b`       | 4 GB       | Buen balance velocidad / calidad                   |
| `qwen2.5-coder:7b`  | 8 GB       | Especializado en código, mejor para generar tests  |
| `mistral:7b`        | 8 GB       | General, bueno para razonamiento                   |

**Recomendado si tienes 8 GB o más:**

```bash
ollama pull qwen2.5-coder:7b
```

**Recomendado si tu máquina es limitada:**

```bash
ollama pull llama3.2:3b
```

Espera a que el modelo termine de descargar (puede tardar varios minutos según tu conexión). El progreso se muestra en la terminal.

Verifica que quedó disponible:

```bash
ollama list
```

---

## Parte 3 — Probar el modelo desde la terminal

Antes de construir el chatbot, confirma que el modelo responde:

```bash
ollama run qwen2.5-coder:7b
```

Escribe algo simple y presiona Enter:

```
>>> Hola, ¿puedes generar un comando curl para hacer GET a localhost:3001/api/libros?
```

Si responde correctamente, el modelo funciona. Sal con `/bye` o Ctrl+D.

---

## Parte 4 — Construir el chatbot de pruebas

El chatbot es un script Node.js que:

1. Precarga las reglas de negocio como system prompt.
2. Acepta tu pregunta en lenguaje natural.
3. Le pregunta al modelo y muestra la respuesta.
4. Opcionalmente ejecuta el `curl` generado y te muestra el resultado real.

### 4.1 Crear la carpeta del chatbot

Dentro de tu carpeta de entrega:

```bash
mkdir chatbot-pruebas
cd chatbot-pruebas
npm init -y
npm install node-fetch readline
```

> Si tu Node.js es v18 o superior, `fetch` ya viene incluido y puedes omitir `node-fetch`.

### 4.2 Crear el archivo principal

Crea el archivo `chatbot-pruebas/chatbot.js` con este contenido. Ajusta `MODELO` si usaste uno diferente:

```js
const readline = require("readline");
const { execSync } = require("child_process");

const BASE_URL = "http://localhost:3001";
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODELO = "qwen2.5-coder:7b"; // cambia si usaste otro

const SYSTEM_PROMPT = `
Eres un asistente de QA especializado en probar una API REST de biblioteca universitaria.

BASE URL del servidor: ${BASE_URL}

REGLAS DE NEGOCIO QUE DEBES CONOCER:
RN1. Un estudiante de pregrado no puede tener más de 3 préstamos activos. Si lo intenta: 409 Conflict.
RN2. Un estudiante de posgrado no puede tener más de 5 préstamos activos. Si lo intenta: 409 Conflict.
RN3. Si un estudiante tiene un préstamo vencido sin devolver, no puede solicitar nuevos préstamos: 409 Conflict.
RN4. Si un estudiante tiene multas pendientes sin pagar, no puede solicitar préstamos: 409 Conflict.
RN5. Un ejemplar que ya está prestado no puede prestarse de nuevo hasta que sea devuelto: 409 Conflict.
RN6. El plazo de préstamo depende del tipo de libro: 15 días para libros normales, 3 días para libros de alta demanda.
RN7. La renovación de un préstamo se deniega si otro estudiante está esperando el mismo libro: 409 Conflict.
RN8. La multa por devolución tardía es de 2000 pesos por día de retraso por cada libro.

ENDPOINTS CONOCIDOS:
- GET  /api/libros                              Catálogo de libros
- POST /api/libros                              Crear libro
- POST /api/libros/:id/ejemplares               Crear ejemplar
- GET  /api/estudiantes                         Listar estudiantes
- POST /api/estudiantes                         Crear estudiante
- GET  /api/estudiantes/:id/historial           Historial de préstamos
- POST /api/prestamos                           Crear préstamo
- GET  /api/prestamos                           Listar préstamos activos
- PUT  /api/prestamos/:id/devolucion            Registrar devolución
- PUT  /api/prestamos/:id/renovar               Renovar préstamo

INSTRUCCIONES DE COMPORTAMIENTO:
- Cuando el usuario pida probar una regla, genera el comando curl exacto para hacerlo.
- Primero genera los datos de prueba necesarios (crear estudiante, crear libro, etc.).
- Explica brevemente qué debe pasar y por qué código HTTP esperas.
- Si el usuario te pregunta por un error, analiza el código HTTP y el body de la respuesta.
- Si el usuario te pide ejecutar el curl, responde con el comando y di "EJECUTAR:" antes del comando para que el sistema lo detecte.
- Sé conciso. No repitas información que el usuario ya sabe.
`.trim();

const historial = [{ role: "system", content: SYSTEM_PROMPT }];

async function preguntarAlModelo(mensajeUsuario) {
  historial.push({ role: "user", content: mensajeUsuario });

  const respuesta = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELO,
      messages: historial,
      stream: false,
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Ollama respondió ${respuesta.status}. ¿Está corriendo? Ejecuta: ollama serve`);
  }

  const datos = await respuesta.json();
  const contenido = datos.message.content;
  historial.push({ role: "assistant", content: contenido });
  return contenido;
}

function ejecutarCurl(respuestaModelo) {
  const lineas = respuestaModelo.split("\n");
  for (const linea of lineas) {
    if (linea.trim().startsWith("EJECUTAR:")) {
      const comando = linea.replace("EJECUTAR:", "").trim();
      console.log(`\n[EJECUTANDO]: ${comando}\n`);
      try {
        const resultado = execSync(comando, { encoding: "utf-8", timeout: 10000 });
        console.log("[RESULTADO]:\n" + resultado);
      } catch (err) {
        console.log("[RESULTADO]:\n" + (err.stdout || err.message));
      }
      return true;
    }
  }
  return false;
}

async function iniciar() {
  console.log("=== Chatbot de Pruebas — Biblioteca UCaldas ===");
  console.log(`Modelo: ${MODELO}`);
  console.log(`Servidor: ${BASE_URL}`);
  console.log('Escribe tu pregunta. Ejemplos:');
  console.log('  "prueba que un pregrado no pueda tener 4 préstamos"');
  console.log('  "ejecuta la prueba RN6 para el plazo de alta demanda"');
  console.log('  "crea datos de prueba para RN1"');
  console.log('Escribe "salir" para terminar.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const preguntar = () => {
    rl.question("Tú: ", async (entrada) => {
      if (entrada.toLowerCase() === "salir") {
        console.log("Hasta luego.");
        rl.close();
        return;
      }

      if (!entrada.trim()) {
        preguntar();
        return;
      }

      try {
        const respuesta = await preguntarAlModelo(entrada);
        console.log(`\nChatbot: ${respuesta}\n`);
        ejecutarCurl(respuesta);
      } catch (err) {
        console.error(`Error: ${err.message}`);
      }

      preguntar();
    });
  };

  preguntar();
}

iniciar();
```

### 4.3 Iniciar Ollama en segundo plano

Abre una terminal separada y ejecuta:

```bash
ollama serve
```

Deja esa terminal abierta. Ollama expone la API en `http://localhost:11434`.

### 4.4 Correr el chatbot

En otra terminal (con tu API también corriendo en `localhost:3001`):

```bash
node chatbot.js
```

---

## Parte 5 — Pruebas guiadas con el chatbot

Haz estas preguntas al chatbot en orden. Registra las respuestas en tu `bitacora.md`.

### Sesión 1 — Datos de prueba

```
Tú: crea los datos de prueba base para todas las reglas: un estudiante pregrado EST-PRE-01, uno posgrado EST-POS-01, un libro normal LIB-001 con 6 ejemplares y un libro de alta demanda LIB-002 con 1 ejemplar
```

Ejecuta los comandos que genere el chatbot uno por uno.

### Sesión 2 — RN1 y RN2

```
Tú: genera la prueba RN1 completa: crear los 3 préstamos válidos para pregrado y luego intentar el cuarto

Tú: ahora haz lo mismo para RN2 con el estudiante de posgrado, recuerda que su límite es 5
```

### Sesión 3 — RN5 y RN6

```
Tú: prueba que un ejemplar ya prestado no se puede prestar de nuevo (RN5)

Tú: muéstrame cómo verificar que el plazo del préstamo es correcto para un libro normal versus uno de alta demanda (RN6)
```

### Sesión 4 — Validaciones

```
Tú: genera pruebas de entradas inválidas: body vacío, estudiante inexistente y ejemplar inexistente

Tú: el resultado del body vacío fue { "error": "..." } con código 400. ¿Eso es correcto según la especificación?
```

### Sesión 5 — Análisis de un fallo

Si alguna prueba devuelve un resultado inesperado, dile al chatbot:

```
Tú: el endpoint POST /api/prestamos devolvió 200 OK en lugar de 409 cuando el estudiante ya tiene 3 préstamos. El body fue: { "id": "P-004", ... }. ¿Qué regla está violando y en qué archivo debería buscar el problema?
```

---

## Parte 6 — Ajustar el system prompt

El system prompt es el conocimiento que el chatbot tiene desde el inicio. Es importante que refleje tu implementación real.

**Tarea:** abre `chatbot.js` y modifica la sección `ENDPOINTS CONOCIDOS` para que coincida exactamente con las rutas que generó tu API (quizás son `/prestamos` sin el prefijo `/api`, o usan otro verbo HTTP).

También puedes agregar:

```js
DECISIONES DE IMPLEMENTACIÓN:
- D1: Los días de multa se cuentan como días calendario.
- D2: El estado de un préstamo puede ser: activo, devuelto, vencido.
- D3: ...
```

Guarda el prompt modificado como `prompts/07-system-prompt-chatbot.md` para tu entrega.

---

## Parte 7 — Registro en la bitácora

Al final de esta sesión, agrega una sección a tu `bitacora.md`:

```markdown
## Chatbot Ollama — Registro

### Modelo usado
- Nombre: qwen2.5-coder:7b (o el que usaste)
- RAM consumida aproximada: X GB

### Preguntas útiles que generó el chatbot
| Pregunta que hice | Qué generó el chatbot | ¿Fue útil? |
|-------------------|-----------------------|------------|
| ...               | ...                   | Sí / No    |

### Limitaciones observadas
- ¿El chatbot inventó endpoints que no existen?
- ¿Confundió reglas entre sí?
- ¿Tuvo que corregirle algo?

### Comparación: chatbot local vs ChatGPT/Claude en la nube
- ¿Qué diferencias notaste en la calidad de las respuestas?
- ¿Qué ventajas tiene correrlo localmente?
```

---

## Solución de problemas comunes

### "fetch is not defined"

Tu versión de Node.js es menor a 18. Instala el paquete:

```bash
npm install node-fetch
```

Y agrega al inicio de `chatbot.js`:

```js
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
```

### "Error: Ollama respondió 404"

El modelo que escribiste en `MODELO` no está instalado. Verifica con:

```bash
ollama list
```

Y ajusta el valor de `MODELO` en `chatbot.js`.

### "Error: connect ECONNREFUSED 127.0.0.1:11434"

Ollama no está corriendo. Ejecútalo:

```bash
ollama serve
```

### El chatbot no genera comandos curl

El modelo más pequeño (1b o 3b) a veces responde en lenguaje natural sin generar comandos. Reformula la pregunta siendo más explícito:

```
Tú: dame el comando curl exacto para probar RN1, incluyendo los headers y el body JSON
```

### La respuesta es muy lenta

Es normal con modelos de 7b en máquinas sin GPU. Mientras esperas, lee el código que generó tu API en la Etapa 2. Si la lentitud es inaceptable, cambia a `llama3.2:3b`:

```bash
ollama pull llama3.2:3b
```

Y actualiza `MODELO` en `chatbot.js`.

---

## Entregables de este taller

Agrega a tu carpeta de entrega:

```
mi-entrega/
├── chatbot-pruebas/
│   ├── chatbot.js              El script del chatbot
│   └── package.json
├── prompts/
│   └── 07-system-prompt-chatbot.md   El system prompt que usaste (con tus ajustes)
└── bitacora.md                 Con la sección "Chatbot Ollama — Registro" completada
```
