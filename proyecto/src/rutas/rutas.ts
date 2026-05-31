import { Router, Request, Response } from 'express';
import { servicioPrestamoLibros } from '../servicios/servicio-prestamo-libros';
import { baseDatos } from '../base-datos/base-datos';
import { CrearPrestamoDTO, DevolverPrestamoDTO } from '../modelos/tipos';

const router = Router();

// ========== LIBROS ==========

/**
 * GET /libros
 * Listar catálogo completo
 * Query: disponibles=true (opcional)
 */
router.get('/libros', async (req: Request, res: Response) => {
  try {
    const disponibles = req.query.disponibles === 'true';
    const libros = await servicioPrestamoLibros.obtenerLibros(disponibles || undefined);
    res.status(200).json(libros);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /libros
 * (Admin) Agregar un nuevo libro al catálogo
 * Body: { libro_id, titulo, autor, sala, alta_demanda }
 */
router.post('/libros', async (req: Request, res: Response) => {
  try {
    const { libro_id, titulo, autor, sala, alta_demanda } = req.body;

    if (!libro_id || !titulo || !autor || !sala) {
      return res.status(400).json({
        error: 'libro_id, titulo, autor y sala son requeridos'
      });
    }

    const libro = {
      libro_id,
      titulo,
      autor,
      sala,
      alta_demanda: alta_demanda === true
    };

    await baseDatos.agregarLibro(libro);
    res.status(201).json({ mensaje: 'Libro agregado exitosamente', libro });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /libros/:libro_id
 * Detalle de un libro
 */
router.get('/libros/:libro_id', async (req: Request, res: Response) => {
  try {
    const libro = await servicioPrestamoLibros.obtenerLibro(req.params.libro_id);
    res.status(200).json(libro);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

// ========== EJEMPLARES ==========

/**
 * POST /libros/:libro_id/ejemplares
 * (Admin) Agregar un nuevo ejemplar al libro especificado
 * Body: { id, ejemplar_id, disponible }
 */
router.post('/libros/:libro_id/ejemplares', async (req: Request, res: Response) => {
  try {
    const libro_id = req.params.libro_id;
    const ejemplar_id = req.body.ejemplar_id || req.body.id;
    const disponible = req.body.disponible;

    if (!ejemplar_id) {
      return res.status(400).json({
        error: 'id o ejemplar_id son requeridos'
      });
    }

    // Verificar que el libro existe
    try {
      await servicioPrestamoLibros.obtenerLibro(libro_id);
    } catch (error: any) {
      return res.status(404).json({ error: `Libro ${libro_id} no encontrado` });
    }

    const ejemplar = {
      ejemplar_id,
      libro_id,
      disponible: disponible !== false
    };

    await baseDatos.agregarEjemplar(ejemplar);
    res.status(201).json({ mensaje: 'Ejemplar agregado exitosamente', ejemplar });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PRESTAMOS ==========

/**
 * GET /prestamos
 * Listar todos los préstamos
 */
router.get('/prestamos', async (req: Request, res: Response) => {
  try {
    const prestamos = await baseDatos.getPrestamos();
    res.status(200).json(prestamos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /prestamos
 * Crear nuevo préstamo
 * Body: { estudiante_id, ejemplar_id }
 */
router.post('/prestamos', async (req: Request, res: Response) => {
  try {
    const datos: CrearPrestamoDTO = req.body;

    if (!datos.estudiante_id || !datos.ejemplar_id) {
      return res.status(400).json({
        error: 'estudiante_id y ejemplar_id son requeridos'
      });
    }

    if (datos.fechaPrestamoSimulada && isNaN(new Date(datos.fechaPrestamoSimulada).getTime())) {
      return res.status(400).json({ error: 'fechaPrestamoSimulada inválida' });
    }

    const prestamo = await servicioPrestamoLibros.crearPrestamo(datos);
    res.status(201).json(prestamo);
  } catch (error: any) {
    const httpCode = error.httpCode || error.cause || 500;
    res.status(httpCode).json({
      error: error.error || error.message,
      ...(error.limite && { limite: error.limite }),
      ...(error.actuales && { actuales: error.actuales }),
      ...(error.prestamo_id && { prestamo_id: error.prestamo_id }),
      ...(error.multas && { multas: error.multas }),
      ...(error.razon && { razon: error.razon })
    });
  }
});

/**
 * GET /prestamos/:prestamo_id
 * Obtener detalles de un préstamo
 */
router.get('/prestamos/:prestamo_id', async (req: Request, res: Response) => {
  try {
    const prestamo = await servicioPrestamoLibros.obtenerPrestamo(req.params.prestamo_id);
    res.status(200).json(prestamo);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * POST /prestamos/:prestamo_id/devolver
 * Registrar devolución de un libro
 * Body: { fecha_devolucion_real }
 */
router.post('/prestamos/:prestamo_id/devolver', async (req: Request, res: Response) => {
  try {
    const datos: DevolverPrestamoDTO = req.body;

    if (!datos.fecha_devolucion_real) {
      return res.status(400).json({
        error: 'fecha_devolucion_real es requerida'
      });
    }

    const prestamo = await servicioPrestamoLibros.devolverPrestamo(req.params.prestamo_id, datos);
    res.status(200).json(prestamo);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * POST /prestamos/:prestamo_id/renovar
 * Renovar un préstamo
 */
router.post('/prestamos/:prestamo_id/renovar', async (req: Request, res: Response) => {
  try {
    const prestamo = await servicioPrestamoLibros.renovarPrestamo(req.params.prestamo_id);
    res.status(200).json(prestamo);
  } catch (error: any) {
    const httpCode = error.httpCode || error.cause || 500;
    res.status(httpCode).json({
      error: error.error || error.message,
      ...(error.razon && { razon: error.razon })
    });
  }
});

// ========== ESTUDIANTES ==========

/**
 * GET /estudiantes
 * Listar todos los estudiantes
 */
router.get('/estudiantes', async (req: Request, res: Response) => {
  try {
    const estudiantes = await baseDatos.getEstudiantes();
    res.status(200).json(estudiantes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /estudiantes
 * (Admin) Crear nuevo estudiante
 * Body: { estudiante_id, nombre, programa_academico, semestre, tipo_estudiante }
 */
router.post('/estudiantes', async (req: Request, res: Response) => {
  try {
    const { estudiante_id, nombre, programa_academico, semestre, tipo_estudiante } = req.body;

    if (!estudiante_id || !nombre || !tipo_estudiante) {
      return res.status(400).json({
        error: 'estudiante_id, nombre y tipo_estudiante son requeridos'
      });
    }

    const estudiante = {
      estudiante_id,
      nombre,
      programa_academico: programa_academico || '',
      semestre: semestre || 1,
      tipo_estudiante,
      multa_pendiente: false
    };

    await baseDatos.agregarEstudiante(estudiante);
    res.status(201).json({ mensaje: 'Estudiante creado exitosamente', estudiante });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /estudiantes/:estudiante_id
 * Información del estudiante
 */
router.get('/estudiantes/:estudiante_id', async (req: Request, res: Response) => {
  try {
    const estudiante = await servicioPrestamoLibros.obtenerEstudiante(req.params.estudiante_id);
    res.status(200).json(estudiante);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * GET /estudiantes/:estudiante_id/prestamos
 * Listar préstamos vigentes de un estudiante
 * Query: estado=activo (opcional)
 */
router.get('/estudiantes/:estudiante_id/prestamos', async (req: Request, res: Response) => {
  try {
    const prestamos = await servicioPrestamoLibros.obtenerPrestamosPorEstudiante(req.params.estudiante_id);
    res.status(200).json(prestamos);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * GET /estudiantes/:estudiante_id/historial
 * Historial completo de préstamos
 */
router.get('/estudiantes/:estudiante_id/historial', async (req: Request, res: Response) => {
  try {
    const historial = await servicioPrestamoLibros.obtenerHistorialPorEstudiante(req.params.estudiante_id);
    res.status(200).json(historial);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * GET /estudiantes/:estudiante_id/multas
 * Listar multas de un estudiante
 */
router.get('/estudiantes/:estudiante_id/multas', async (req: Request, res: Response) => {
  try {
    const multas = await servicioPrestamoLibros.obtenerMultasPorEstudiante(req.params.estudiante_id);
    res.status(200).json(multas);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * POST /estudiantes/:estudiante_id/multas/:multa_id/pagar
 * Marcar una multa como pagada
 */
router.post('/estudiantes/:estudiante_id/multas/:multa_id/pagar', async (req: Request, res: Response) => {
  try {
    const { estudiante_id, multa_id } = req.params;
    const multa = await servicioPrestamoLibros.pagarMulta(estudiante_id, multa_id);
    res.status(200).json(multa);
  } catch (error: any) {
    const httpCode = error.httpCode || error.cause || 500;
    res.status(httpCode).json({ error: error.error || error.message });
  }
});

export default router;
