import { Router, Request, Response } from 'express';
import { servicioPrestamoLibros } from '../servicios/servicio-prestamo-libros';
import { CrearPrestamoDTO, DevolverPrestamoDTO } from '../modelos/tipos';

const router = Router();

// ========== LIBROS ==========

/**
 * GET /libros
 * Listar catálogo completo
 * Query: disponibles=true (opcional)
 */
router.get('/libros', (req: Request, res: Response) => {
  try {
    const disponibles = req.query.disponibles === 'true';
    const libros = servicioPrestamoLibros.obtenerLibros(disponibles || undefined);
    res.status(200).json(libros);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /libros/:libro_id
 * Detalle de un libro
 */
router.get('/libros/:libro_id', (req: Request, res: Response) => {
  try {
    const libro = servicioPrestamoLibros.obtenerLibro(req.params.libro_id);
    res.status(200).json(libro);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

// ========== PRESTAMOS ==========

/**
 * POST /prestamos
 * Crear nuevo préstamo
 * Body: { estudiante_id, ejemplar_id }
 */
router.post('/prestamos', (req: Request, res: Response) => {
  try {
    const datos: CrearPrestamoDTO = req.body;
    
    if (!datos.estudiante_id || !datos.ejemplar_id) {
      return res.status(400).json({ 
        error: 'estudiante_id y ejemplar_id son requeridos' 
      });
    }

    const prestamo = servicioPrestamoLibros.crearPrestamo(datos);
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
router.get('/prestamos/:prestamo_id', (req: Request, res: Response) => {
  try {
    const prestamo = servicioPrestamoLibros.obtenerPrestamo(req.params.prestamo_id);
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
router.post('/prestamos/:prestamo_id/devolver', (req: Request, res: Response) => {
  try {
    const datos: DevolverPrestamoDTO = req.body;

    if (!datos.fecha_devolucion_real) {
      return res.status(400).json({ 
        error: 'fecha_devolucion_real es requerida' 
      });
    }

    const prestamo = servicioPrestamoLibros.devolverPrestamo(req.params.prestamo_id, datos);
    res.status(200).json(prestamo);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * POST /prestamos/:prestamo_id/renovar
 * Renovar un préstamo
 */
router.post('/prestamos/:prestamo_id/renovar', (req: Request, res: Response) => {
  try {
    const prestamo = servicioPrestamoLibros.renovarPrestamo(req.params.prestamo_id);
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
 * GET /estudiantes/:estudiante_id
 * Información del estudiante
 */
router.get('/estudiantes/:estudiante_id', (req: Request, res: Response) => {
  try {
    const estudiante = servicioPrestamoLibros.obtenerEstudiante(req.params.estudiante_id);
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
router.get('/estudiantes/:estudiante_id/prestamos', (req: Request, res: Response) => {
  try {
    const prestamos = servicioPrestamoLibros.obtenerPrestamosPorEstudiante(req.params.estudiante_id);
    res.status(200).json(prestamos);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * GET /estudiantes/:estudiante_id/historial
 * Historial completo de préstamos
 */
router.get('/estudiantes/:estudiante_id/historial', (req: Request, res: Response) => {
  try {
    const historial = servicioPrestamoLibros.obtenerHistorialPorEstudiante(req.params.estudiante_id);
    res.status(200).json(historial);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

/**
 * GET /estudiantes/:estudiante_id/multas
 * Listar multas de un estudiante
 */
router.get('/estudiantes/:estudiante_id/multas', (req: Request, res: Response) => {
  try {
    const multas = servicioPrestamoLibros.obtenerMultasPorEstudiante(req.params.estudiante_id);
    res.status(200).json(multas);
  } catch (error: any) {
    res.status(error.cause || 500).json({ error: error.message });
  }
});

export default router;
