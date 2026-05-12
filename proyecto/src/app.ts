import express from 'express';
import rutas from './rutas/rutas';
import { baseDatos } from './base-datos/base-datos';
import { Libro, Ejemplar, Estudiante, TipoEstudiante } from './modelos/tipos';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Rutas
app.use('/api', rutas);

// Inicializar datos de ejemplo
function inicializarDatos() {
  // Libros
  const libros: Libro[] = [
    {
      libro_id: 'LIB001',
      titulo: 'Algoritmos en TypeScript',
      autor: 'Donald Knuth',
      sala: 'Tecnología',
      alta_demanda: true
    },
    {
      libro_id: 'LIB002',
      titulo: 'Historia de Colombia',
      autor: 'Carlos Morales',
      sala: 'Historia',
      alta_demanda: false
    },
    {
      libro_id: 'LIB003',
      titulo: 'Cálculo Superior',
      autor: 'James Stewart',
      sala: 'Matemáticas',
      alta_demanda: true
    }
  ];

  libros.forEach(libro => baseDatos.agregarLibro(libro));

  // Ejemplares
  const ejemplares: Ejemplar[] = [
    { ejemplar_id: 'EJ001', libro_id: 'LIB001', disponible: true },
    { ejemplar_id: 'EJ002', libro_id: 'LIB001', disponible: true },
    { ejemplar_id: 'EJ003', libro_id: 'LIB002', disponible: true },
    { ejemplar_id: 'EJ004', libro_id: 'LIB003', disponible: true }
  ];

  ejemplares.forEach(ejemplar => baseDatos.agregarEjemplar(ejemplar));

  // Estudiantes
  const estudiantes: Estudiante[] = [
    {
      estudiante_id: 'EST001',
      nombre: 'Juan Pérez',
      programa_academico: 'Ingeniería Sistemas',
      semestre: 3,
      tipo_estudiante: TipoEstudiante.PREGRADO,
      multa_pendiente: false
    },
    {
      estudiante_id: 'EST002',
      nombre: 'María González',
      programa_academico: 'Maestría Ingeniería',
      semestre: 2,
      tipo_estudiante: TipoEstudiante.POSGRADO,
      multa_pendiente: false
    },
    {
      estudiante_id: 'EST003',
      nombre: 'Carlos López',
      programa_academico: 'Ingeniería Industrial',
      semestre: 5,
      tipo_estudiante: TipoEstudiante.PREGRADO,
      multa_pendiente: false
    }
  ];

  estudiantes.forEach(est => baseDatos.agregarEstudiante(est));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Inicializar y arrancar servidor
inicializarDatos();

const server = app.listen(PORT, () => {
  console.log(`\n🚀 API de Préstamo de Libros arrancada en puerto ${PORT}`);
  console.log(`📚 Endpoint: http://localhost:${PORT}`);
  console.log(`💓 Health check: http://localhost:${PORT}/health\n`);
});

export default app;
