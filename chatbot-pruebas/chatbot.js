const readline = require("readline");
const { execSync } = require("child_process");

const BASE_URL = "http://localhost:3001";
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODELO = "qwen3.5:9b"; // cambia si usaste otro

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
=== LIBROS ===
- GET  /api/libros                              Listar catálogo (con query ?disponibles=true opcional)
- POST /api/libros                              Crear libro
- GET  /api/libros/:libro_id                    Obtener libro específico
- POST /api/libros/:libro_id/ejemplares         Crear ejemplar

=== ESTUDIANTES ===
- GET  /api/estudiantes                         Listar todos los estudiantes
- POST /api/estudiantes                         Crear estudiante
- GET  /api/estudiantes/:estudiante_id          Información del estudiante
- GET  /api/estudiantes/:estudiante_id/prestamos    Préstamos vigentes
- GET  /api/estudiantes/:estudiante_id/historial    Historial completo
- GET  /api/estudiantes/:estudiante_id/multas       Listar multas
- POST /api/estudiantes/:estudiante_id/multas/:multa_id/pagar    Pagar multa

=== PRÉSTAMOS ===
- GET  /api/prestamos                           Listar todos los préstamos
- POST /api/prestamos                           Crear préstamo
- GET  /api/prestamos/:prestamo_id              Obtener préstamo específico
- POST /api/prestamos/:prestamo_id/devolver     Registrar devolución
- POST /api/prestamos/:prestamo_id/renovar      Renovar préstamo

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