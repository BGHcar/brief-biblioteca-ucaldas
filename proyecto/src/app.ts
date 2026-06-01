import express from 'express';
import rutas from './rutas/rutas';
import { baseDatos } from './base-datos/base-datos';
import { Libro, Ejemplar, Estudiante, TipoEstudiante } from './modelos/tipos';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Rutas
app.use('/api', rutas);

// Inicializar datos de ejemplo solo si la base de datos está vacía (solo en desarrollo/producción)
async function inicializarDatos() {
  // No ejecutar seed en ambiente de pruebas
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const librosExistentes = await baseDatos.getLibros();
  if (librosExistentes.length > 0) {
    return;
  }

  console.log('📖 Poblando base de datos con catálogo inicial...');

  const libros: Libro[] = [
    {
      libro_id: 'LIB-001',
      titulo: 'Algoritmos en TypeScript',
      autor: 'Donald Knuth',
      sala: 'Tecnología',
      alta_demanda: false
    },
    {
      libro_id: 'LIB-002',
      titulo: 'Historia de Colombia',
      autor: 'Carlos Morales',
      sala: 'Historia',
      alta_demanda: true
    },
    {
      libro_id: 'LIB-003',
      titulo: 'Cálculo Superior',
      autor: 'James Stewart',
      sala: 'Matemáticas',
      alta_demanda: true
    }
  ];

  for (const libro of libros) {
    await baseDatos.agregarLibro(libro);
  }

  const ejemplares: Ejemplar[] = [
    { ejemplar_id: 'EJ-001-01', libro_id: 'LIB-001', disponible: true },
    { ejemplar_id: 'EJ-001-02', libro_id: 'LIB-001', disponible: true },
    { ejemplar_id: 'EJ-002-01', libro_id: 'LIB-002', disponible: true },
    { ejemplar_id: 'EJ-003-01', libro_id: 'LIB-003', disponible: true }
  ];

  for (const ejemplar of ejemplares) {
    await baseDatos.agregarEjemplar(ejemplar);
  }

  const estudiantes: Estudiante[] = [
    {
      estudiante_id: 'EST-PRE-01',
      nombre: 'Juan Pérez',
      programa_academico: 'Ingeniería Sistemas',
      semestre: 3,
      tipo_estudiante: TipoEstudiante.PREGRADO,
      multa_pendiente: false
    },
    {
      estudiante_id: 'EST-POS-01',
      nombre: 'María González',
      programa_academico: 'Maestría Ingeniería',
      semestre: 2,
      tipo_estudiante: TipoEstudiante.POSGRADO,
      multa_pendiente: false
    },
    {
      estudiante_id: 'EST-PRE-02',
      nombre: 'Carlos López',
      programa_academico: 'Ingeniería Industrial',
      semestre: 5,
      tipo_estudiante: TipoEstudiante.PREGRADO,
      multa_pendiente: false
    }
  ];

  for (const estudiante of estudiantes) {
    await baseDatos.agregarEstudiante(estudiante);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

async function main() {
  await baseDatos.ready;
  await inicializarDatos();

  app.listen(PORT, () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`\n🚀 API de Préstamo de Libros arrancada en puerto ${PORT} (${env})`);
    console.log(`📚 Endpoint: http://localhost:${PORT}`);
    console.log(`💓 Health check: http://localhost:${PORT}/health`);
    if (env !== 'test') {
      console.log(`📖 Catálogo: http://localhost:${PORT}/api/libros`);
      console.log(`➕ Admin POST /api/libros - Agregar libro`);
      console.log(`➕ Admin POST /api/libros/:libro_id/ejemplares - Agregar ejemplar\n`);
    }
  });
}

main().catch(error => {
  console.error('Error iniciando la aplicación:', error);
  process.exit(1);
});

export default app;
