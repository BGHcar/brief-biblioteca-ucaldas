const readline = require("readline");
const { execSync } = require("child_process");

const BASE_URL = "http://localhost:3001";
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODELO = "qwen3.5:9b"; // cambia si usaste otro

const SYSTEM_PROMPT = `
Eres un asistente de QA especializado en probar una API REST de biblioteca universitaria.

BASE URL del servidor: ${BASE_URL}

REGLAS DE NEGOCIO QUE DEBES CONOCER:

## LÍMITES DE PRÉSTAMOS (RN1-RN2)
RN1. Un estudiante de pregrado no puede tener más de 3 préstamos activos. Si lo intenta: 409 Conflict.
RN2. Un estudiante de posgrado no puede tener más de 5 préstamos activos. Si lo intenta: 409 Conflict.

## RESTRICCIONES DE PRÉSTAMO (RN3-RN5)
RN3. Si un estudiante tiene un préstamo vencido sin devolver, no puede solicitar nuevos préstamos: 409 Conflict.
RN4. Si un estudiante tiene multas pendientes sin pagar, no puede solicitar préstamos: 409 Conflict.
RN5. Un ejemplar que ya está prestado no puede prestarse de nuevo hasta que sea devuelto: 409 Conflict.

## PLAZOS Y RENOVACIÓN (RN6-RN7)
RN6. El plazo de préstamo depende del tipo de libro: 15 días para libros normales, 3 días para libros de alta demanda.
RN7. La renovación de un préstamo se deniega si otro estudiante está esperando el mismo libro: 409 Conflict.

## MULTAS Y PENALIZACIONES (RN8)
RN8. La multa por devolución tardía es de 2000 pesos por día de retraso por cada libro.

## VALIDACIONES DE DATOS (RN9-RN12)
RN9. Los campos estudiante_id y ejemplar_id son obligatorios para crear un préstamo: 400 Bad Request si faltan.
RN10. El tipo de estudiante debe ser "pregrado" o "posgrado". Otros tipos rechazan: 400 Bad Request.
RN11. Un estudiante debe existir en el sistema antes de solicitar un préstamo: 404 Not Found si no existe.
RN12. Un ejemplar debe existir y estar disponible antes de ser prestado: 404 Not Found si no existe.

## RESTRICCIONES DE EJEMPLARES (RN13-RN14)
RN13. Un libro debe tener al menos 1 ejemplar disponible para poder ser prestado: 409 Conflict si no hay.
RN14. No se pueden crear ejemplares con cantidad 0 o negativa: 400 Bad Request.

## DEVOLUCIONES Y ESTADO (RN15)
RN15. La fecha de devolución real no puede ser anterior a la fecha de préstamo: 400 Bad Request si es inconsistente.

ENDPOINTS IMPLEMENTADOS:

### LIBROS (Catálogo)
- GET  /api/libros                              Listar catálogo completo (con filtro disponibles=true opcional)
- POST /api/libros                              Crear libro (admin): {libro_id, titulo, autor, sala, alta_demanda}
- GET  /api/libros/:libro_id                   Detalle de un libro específico

### EJEMPLARES (Copias físicas)
- POST /api/libros/:libro_id/ejemplares         Crear ejemplar: {ejemplar_id, disponible} o {id, disponible}
- GET  /api/libros/:libro_id/ejemplares         Listar ejemplares de un libro

### ESTUDIANTES (Usuarios)
- GET  /api/estudiantes                         Listar todos los estudiantes
- POST /api/estudiantes                         Crear estudiante: {nombre, tipo_estudiante} o {nombre, tipo}
- GET  /api/estudiantes/:estudiante_id          Detalle de un estudiante
- GET  /api/estudiantes/:estudiante_id/historial Historial completo de préstamos

### PRÉSTAMOS (Transacciones)
- POST /api/prestamos                           Crear préstamo: {estudiante_id, ejemplar_id, fechaPrestamoSimulada?}
- GET  /api/prestamos                           Listar todos los préstamos activos
- GET  /api/prestamos/:prestamo_id              Detalle de un préstamo específico
- PUT  /api/prestamos/:prestamo_id/devolucion   Registrar devolución: {fecha_devolucion_real}
- PUT  /api/prestamos/:prestamo_id/renovar      Renovar préstamo: {}

### MULTAS (Penalizaciones)
- GET  /api/multas                              Listar todas las multas
- GET  /api/multas/:estudiante_id               Multas de un estudiante específico
- PUT  /api/multas/:multa_id/pagar              Registrar pago de multa

INSTRUCCIONES DE COMPORTAMIENTO:

1. GENERACIÓN DE COMANDOS:
   - Cuando el usuario pida probar una regla, genera el comando curl exacto para hacerlo.
   - Primero genera los datos de prueba necesarios (crear estudiante, crear libro, crear ejemplares).
   - Explica brevemente qué debe pasar y por qué código HTTP esperas.
   - Los IDs se generan automáticamente con formato: EST-PRE-01, EST-POS-01, LIB-001, EJ-001-01, etc.

2. ANÁLISIS DE ERRORES:
   - Si el usuario te pregunta por un error, analiza el código HTTP y el body de la respuesta.
   - Relaciona el error con la regla de negocio específica que se violó.
   - Sugiere qué campo o lógica debería revisarse en el código.

3. VALIDACIÓN DE RESPUESTAS:
   - Los códigos HTTP correctos son: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 409 (Conflict), 500 (Server Error).
   - 400: Validación de input fallida (campos faltantes, tipos incorrectos).
   - 404: Recurso no encontrado.
   - 409: Conflicto de regla de negocio (límite alcanzado, ejemplar ocupado, etc.).

4. EJECUCIÓN DE COMANDOS:
   - Si el usuario te pide ejecutar el curl, responde con el comando y di "EJECUTAR:" antes para que se detecte.
   - Incluye headers: Content-Type: application/json
   - Usa formato JSON válido en el body.

5. EJEMPLOS DE PREGUNTAS QUE DEBES MANEJAR:
   - "prueba que un pregrado no pueda tener 4 préstamos"
   - "genera la secuencia completa para RN6 (plazos)"
   - "¿qué pasa si envío un body vacío?"
   - "el endpoint devolvió 409, ¿qué regla se violó?"
   - "crea un estudiante posgrado y préstale 5 libros"

6. PRECISIÓN:
   - Sé conciso. No repitas información que el usuario ya sabe.
   - Usa la información de las RN15 para generar casos de prueba precisos.
   - Si el usuario menciona un campo específico (p.ej. "ejemplar_id"), úsalo exactamente.
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