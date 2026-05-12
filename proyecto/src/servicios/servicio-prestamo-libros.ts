import { v4 as uuidv4 } from 'uuid';
import { baseDatos } from '../base-datos/base-datos';
import {
  Libro, Ejemplar, Estudiante, Prestamo, Multa,
  CrearPrestamoDTO, DevolverPrestamoDTO, TipoEstudiante,
  EstadoPrestamo, EstadoMulta
} from '../modelos/tipos';

class ServicioPrestamoLibros {

  // ========== LIBROS ==========

  obtenerLibros(filtroDisponibles?: boolean) {
    const libros = baseDatos.getLibros();
    if (!filtroDisponibles) return libros;
    
    return libros.filter(libro => {
      const ejemplaresDelLibro = baseDatos.getEjemplares()
        .filter(e => e.libro_id === libro.libro_id);
      return ejemplaresDelLibro.some(e => e.disponible);
    });
  }

  obtenerLibro(libro_id: string) {
    const libro = baseDatos.obtenerLibro(libro_id);
    if (!libro) throw new Error(`Libro ${libro_id} no encontrado`);
    return libro;
  }

  // ========== EJEMPLARES ==========

  obtenerEjemplar(ejemplar_id: string) {
    const ejemplar = baseDatos.obtenerEjemplar(ejemplar_id);
    if (!ejemplar) throw new Error(`Ejemplar ${ejemplar_id} no encontrado`);
    return ejemplar;
  }

  // ========== ESTUDIANTES ==========

  obtenerEstudiante(estudiante_id: string) {
    const estudiante = baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) throw new Error(`Estudiante ${estudiante_id} no encontrado`);
    return estudiante;
  }

  // ========== PRESTAMOS ==========

  crearPrestamo(datos: CrearPrestamoDTO): Prestamo {
    const { estudiante_id, ejemplar_id } = datos;

    // Validar existencia de estudiante y ejemplar
    const estudiante = baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const ejemplar = baseDatos.obtenerEjemplar(ejemplar_id);
    if (!ejemplar) {
      const error = new Error('Ejemplar no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const libro = baseDatos.obtenerLibro(ejemplar.libro_id);
    if (!libro) {
      const error = new Error('Libro no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    // RN1: Validar límite de préstamos por tipo de estudiante
    const prestamosActivos = baseDatos.obtenerPrestamosPorEstudiante(estudiante_id)
      .filter((p: Prestamo) => p.estado === EstadoPrestamo.ACTIVO);
    
    const limiteSegunTipo = estudiante.tipo_estudiante === TipoEstudiante.PREGRADO ? 3 : 5;
    if (prestamosActivos.length >= limiteSegunTipo) {
      const error = new Error('Límite de préstamos alcanzado') as any;
      error.httpCode = 409;
      error.error = 'limite_prestamos_alcanzado';
      error.limite = limiteSegunTipo;
      error.actuales = prestamosActivos.length;
      throw error;
    }

    // RN3: Validar que no haya préstamo vencido sin devolver
    const prestamosVencidos = prestamosActivos.filter((p: Prestamo) => p.estado === EstadoPrestamo.VENCIDO);
    if (prestamosVencidos.length > 0) {
      const error = new Error('Tiene préstamo vencido sin devolver') as any;
      error.httpCode = 409;
      error.error = 'prestamo_vencido_sin_devolver';
      error.prestamo_id = prestamosVencidos[0].prestamo_id;
      throw error;
    }

    // RN4: Validar que no tenga multas pendientes
    const multasPendientes = baseDatos.obtenerMultasPorEstudiante(estudiante_id)
      .filter(m => m.estado === EstadoMulta.PENDIENTE);
    if (multasPendientes.length > 0) {
      const error = new Error('Tiene multas pendientes') as any;
      error.httpCode = 409;
      error.error = 'multas_pendientes';
      error.multas = multasPendientes;
      throw error;
    }

    // RN5: Validar disponibilidad del ejemplar
    if (!ejemplar.disponible) {
      const error = new Error('Ejemplar no disponible') as any;
      error.httpCode = 409;
      error.error = 'ejemplar_no_disponible';
      throw error;
    }

    // RN2: Calcular plazo según tipo de libro
    const fechaPrestamo = new Date();
    const diasPlazo = libro.alta_demanda ? 3 : 15;
    const fechaDevolucionEsperada = new Date(fechaPrestamo);
    fechaDevolucionEsperada.setDate(fechaDevolucionEsperada.getDate() + diasPlazo);

    // Crear préstamo
    const prestamo: Prestamo = {
      prestamo_id: uuidv4(),
      estudiante_id,
      ejemplar_id,
      fecha_prestamo: fechaPrestamo,
      fecha_devolucion_esperada: fechaDevolucionEsperada,
      fecha_devolucion_real: null,
      estado: EstadoPrestamo.ACTIVO,
      renovado: false
    };

    // Marcar ejemplar como no disponible
    ejemplar.disponible = false;
    baseDatos.actualizarEjemplar(ejemplar_id, ejemplar);

    // Guardar préstamo
    baseDatos.agregarPrestamo(prestamo);

    return prestamo;
  }

  obtenerPrestamo(prestamo_id: string): Prestamo {
    const prestamo = baseDatos.obtenerPrestamo(prestamo_id);
    if (!prestamo) {
      const error = new Error('Préstamo no encontrado') as any;
      error.cause = 404;
      throw error;
    }
    
    // RN8: Detectar automáticamente vencimiento
    this.actualizarEstadoVencimiento(prestamo);
    return prestamo;
  }

  obtenerPrestamosPorEstudiante(estudiante_id: string): Prestamo[] {
    const estudiante = baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const prestamos = baseDatos.obtenerPrestamosPorEstudiante(estudiante_id);
    
    // RN8: Actualizar estado de vencimiento para todos
    prestamos.forEach((p: Prestamo) => this.actualizarEstadoVencimiento(p));
    
    return prestamos.filter((p: Prestamo) => p.estado === EstadoPrestamo.ACTIVO);
  }

  obtenerHistorialPorEstudiante(estudiante_id: string): Prestamo[] {
    const estudiante = baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const prestamos = baseDatos.obtenerPrestamosPorEstudiante(estudiante_id);
    prestamos.forEach((p: Prestamo) => this.actualizarEstadoVencimiento(p));
    return prestamos;
  }

  devolverPrestamo(prestamo_id: string, datos: DevolverPrestamoDTO): Prestamo {
    const prestamo = baseDatos.obtenerPrestamo(prestamo_id);
    if (!prestamo) {
      const error = new Error('Préstamo no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const fechaDevolucion = new Date(datos.fecha_devolucion_real);

    // RN6: Calcular multa si hay retraso
    if (fechaDevolucion > prestamo.fecha_devolucion_esperada) {
      const diasRetraso = Math.ceil(
        (fechaDevolucion.getTime() - prestamo.fecha_devolucion_esperada.getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      const monto = diasRetraso * 2000;

      const multa: Multa = {
        multa_id: uuidv4(),
        estudiante_id: prestamo.estudiante_id,
        prestamo_id,
        monto,
        dias_retraso: diasRetraso,
        estado: EstadoMulta.PENDIENTE,
        fecha_calculo: new Date()
      };

      baseDatos.agregarMulta(multa);

      const estudiante = baseDatos.obtenerEstudiante(prestamo.estudiante_id)!;
      estudiante.multa_pendiente = true;
      baseDatos.actualizarEstudiante(prestamo.estudiante_id, estudiante);
    }

    // Actualizar préstamo
    prestamo.fecha_devolucion_real = fechaDevolucion;
    prestamo.estado = EstadoPrestamo.DEVUELTO;
    baseDatos.actualizarPrestamo(prestamo_id, prestamo);

    // Liberar ejemplar
    const ejemplar = baseDatos.obtenerEjemplar(prestamo.ejemplar_id)!;
    ejemplar.disponible = true;
    baseDatos.actualizarEjemplar(prestamo.ejemplar_id, ejemplar);

    return prestamo;
  }

  renovarPrestamo(prestamo_id: string): Prestamo {
    const prestamo = baseDatos.obtenerPrestamo(prestamo_id);
    if (!prestamo) {
      const error = new Error('Préstamo no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    // RN7: Validar que no hay solicitudes pendientes
    const otrosPrestamos = baseDatos.obtenerPrestamosPorEstudiante(prestamo.estudiante_id)
      .filter((p: Prestamo) => p.ejemplar_id === prestamo.ejemplar_id && p.prestamo_id !== prestamo_id);
    
    if (otrosPrestamos.length > 0) {
      const error = new Error('Renovación no permitida') as any;
      error.httpCode = 409;
      error.error = 'renovacion_no_permitida';
      error.razon = 'otro_estudiante_espera_libro';
      throw error;
    }

    const libro = baseDatos.obtenerLibro(baseDatos.obtenerEjemplar(prestamo.ejemplar_id)!.libro_id)!;
    const diasPlazo = libro.alta_demanda ? 3 : 15;
    
    prestamo.fecha_devolucion_esperada = new Date(prestamo.fecha_devolucion_esperada);
    prestamo.fecha_devolucion_esperada.setDate(
      prestamo.fecha_devolucion_esperada.getDate() + diasPlazo
    );
    prestamo.renovado = true;

    baseDatos.actualizarPrestamo(prestamo_id, prestamo);
    return prestamo;
  }

  // ========== MULTAS ==========

  obtenerMultasPorEstudiante(estudiante_id: string): Multa[] {
    const estudiante = baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }
    return baseDatos.obtenerMultasPorEstudiante(estudiante_id);
  }

  // ========== HELPERS ==========

  private actualizarEstadoVencimiento(prestamo: Prestamo) {
    if (prestamo.estado === EstadoPrestamo.ACTIVO && prestamo.fecha_devolucion_real === null) {
      const hoy = new Date();
      if (prestamo.fecha_devolucion_esperada < hoy) {
        prestamo.estado = EstadoPrestamo.VENCIDO;
        baseDatos.actualizarPrestamo(prestamo.prestamo_id, prestamo);
      }
    }
  }
}

export const servicioPrestamoLibros = new ServicioPrestamoLibros();
