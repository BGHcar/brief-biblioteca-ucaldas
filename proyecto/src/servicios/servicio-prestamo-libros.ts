import { v4 as uuidv4 } from 'uuid';
import { baseDatos } from '../base-datos/base-datos';
import {
  Libro, Ejemplar, Estudiante, Prestamo, Multa,
  CrearPrestamoDTO, DevolverPrestamoDTO, TipoEstudiante,
  EstadoPrestamo, EstadoMulta
} from '../modelos/tipos';

class ServicioPrestamoLibros {
  // ========== LIBROS ==========

  async obtenerLibros(filtroDisponibles?: boolean): Promise<Libro[]> {
    const libros = await baseDatos.getLibros();
    if (!filtroDisponibles) return libros;

    return Promise.all(libros.map(async libro => {
      const ejemplaresDelLibro = (await baseDatos.getEjemplares())
        .filter(e => e.libro_id === libro.libro_id);
      return ejemplaresDelLibro.some(e => e.disponible) ? libro : null;
    })).then(result => result.filter((libro): libro is Libro => libro !== null));
  }

  async obtenerLibro(libro_id: string): Promise<Libro> {
    const libro = await baseDatos.obtenerLibro(libro_id);
    if (!libro) {
      const error = new Error(`Libro ${libro_id} no encontrado`) as any;
      error.cause = 404;
      throw error;
    }
    return libro;
  }

  // ========== EJEMPLARES ==========

  async obtenerEjemplar(ejemplar_id: string): Promise<Ejemplar> {
    const ejemplar = await baseDatos.obtenerEjemplar(ejemplar_id);
    if (!ejemplar) {
      const error = new Error(`Ejemplar ${ejemplar_id} no encontrado`) as any;
      error.cause = 404;
      throw error;
    }
    return ejemplar;
  }

  // ========== ESTUDIANTES ==========

  async obtenerEstudiante(estudiante_id: string): Promise<Estudiante> {
    const estudiante = await baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error(`Estudiante ${estudiante_id} no encontrado`) as any;
      error.cause = 404;
      throw error;
    }
    return estudiante;
  }

  // ========== PRESTAMOS ==========

  async crearPrestamo(datos: CrearPrestamoDTO): Promise<Prestamo> {
    const { estudiante_id, ejemplar_id } = datos;

    const estudiante = await baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const ejemplar = await baseDatos.obtenerEjemplar(ejemplar_id);
    if (!ejemplar) {
      const error = new Error('Ejemplar no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const libro = await baseDatos.obtenerLibro(ejemplar.libro_id);
    if (!libro) {
      const error = new Error('Libro no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    // Obtener la fecha de referencia (simulada o actual)
    let fechaReferencia = new Date();
    if (datos.fechaPrestamoSimulada) {
      const d = new Date(datos.fechaPrestamoSimulada);
      if (!isNaN(d.getTime())) {
        fechaReferencia = d;
      }
    }

    const todosLosPrestamos = await baseDatos.obtenerPrestamosPorEstudiante(estudiante_id);
    
    // RN1/RN2: Contar préstamos activos (sin devolver)
    const prestamosActivos = todosLosPrestamos.filter((p: Prestamo) => p.fecha_devolucion_real === null);

    const limiteSegunTipo = estudiante.tipo_estudiante === TipoEstudiante.PREGRADO ? 3 : 5;
    if (prestamosActivos.length >= limiteSegunTipo) {
      const error = new Error('Límite de préstamos alcanzado') as any;
      error.httpCode = 409;
      error.error = 'limite_prestamos_alcanzado';
      error.limite = limiteSegunTipo;
      error.actuales = prestamosActivos.length;
      throw error;
    }

    // RN3: Verificar si hay préstamos vencidos (activos con fecha_devolucion_esperada < fechaReferencia)
    const prestamosVencidos = prestamosActivos.filter((p: Prestamo) => p.fecha_devolucion_esperada < fechaReferencia);
    if (prestamosVencidos.length > 0) {
      const error = new Error('Tiene préstamo vencido sin devolver') as any;
      error.httpCode = 409;
      error.error = 'prestamo_vencido_sin_devolver';
      error.prestamo_id = prestamosVencidos[0].prestamo_id;
      throw error;
    }

    const multasPendientes = (await baseDatos.obtenerMultasPorEstudiante(estudiante_id))
      .filter(m => m.estado === EstadoMulta.PENDIENTE);
    if (multasPendientes.length > 0) {
      const error = new Error('Tiene multas pendientes') as any;
      error.httpCode = 409;
      error.error = 'multas_pendientes';
      error.multas = multasPendientes;
      throw error;
    }

    if (!ejemplar.disponible) {
      const error = new Error('Ejemplar no disponible') as any;
      error.httpCode = 409;
      error.error = 'ejemplar_no_disponible';
      throw error;
    }

    let fechaPrestamo = new Date();
    if (datos.fechaPrestamoSimulada) {
      const d = new Date(datos.fechaPrestamoSimulada);
      if (isNaN(d.getTime())) {
        const error = new Error('fechaPrestamoSimulada inválida') as any;
        error.httpCode = 400;
        throw error;
      }
      fechaPrestamo = d;
    } else {
      // Si no hay fecha simulada, usar la misma que se usó para fechaReferencia (debe ser la actual)
      fechaPrestamo = fechaReferencia;
    }

    const diasPlazo = libro.alta_demanda ? 3 : 15;
    const fechaDevolucionEsperada = new Date(fechaPrestamo);
    fechaDevolucionEsperada.setDate(fechaDevolucionEsperada.getDate() + diasPlazo);

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

    ejemplar.disponible = false;
    await baseDatos.actualizarEjemplar(ejemplar_id, ejemplar);
    await baseDatos.agregarPrestamo(prestamo);

    return prestamo;
  }

  async obtenerPrestamo(prestamo_id: string): Promise<Prestamo> {
    const prestamo = await baseDatos.obtenerPrestamo(prestamo_id);
    if (!prestamo) {
      const error = new Error('Préstamo no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    await this.actualizarEstadoVencimiento(prestamo);
    return prestamo;
  }

  async obtenerPrestamosPorEstudiante(estudiante_id: string): Promise<Prestamo[]> {
    const estudiante = await baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const prestamos = await baseDatos.obtenerPrestamosPorEstudiante(estudiante_id);
    for (const p of prestamos) {
      await this.actualizarEstadoVencimiento(p);
    }
    return prestamos.filter((p: Prestamo) => p.estado === EstadoPrestamo.ACTIVO);
  }

  async obtenerHistorialPorEstudiante(estudiante_id: string): Promise<Prestamo[]> {
    const estudiante = await baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const prestamos = await baseDatos.obtenerPrestamosPorEstudiante(estudiante_id);
    for (const p of prestamos) {
      await this.actualizarEstadoVencimiento(p);
    }
    return prestamos;
  }

  async devolverPrestamo(prestamo_id: string, datos: DevolverPrestamoDTO): Promise<Prestamo> {
    const prestamo = await baseDatos.obtenerPrestamo(prestamo_id);
    if (!prestamo) {
      const error = new Error('Préstamo no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const fechaDevolucion = new Date(datos.fecha_devolucion_real);
    if (isNaN(fechaDevolucion.getTime())) {
      const error = new Error('fecha_devolucion_real inválida') as any;
      error.httpCode = 400;
      throw error;
    }

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

      await baseDatos.agregarMulta(multa);
      const estudiante = await baseDatos.obtenerEstudiante(prestamo.estudiante_id);
      if (!estudiante) {
        const error = new Error('Estudiante no encontrado') as any;
        error.cause = 404;
        throw error;
      }
      estudiante.multa_pendiente = true;
      await baseDatos.actualizarEstudiante(prestamo.estudiante_id, estudiante);
    }

    prestamo.fecha_devolucion_real = fechaDevolucion;
    prestamo.estado = EstadoPrestamo.DEVUELTO;
    await baseDatos.actualizarPrestamo(prestamo_id, prestamo);

    const ejemplar = await baseDatos.obtenerEjemplar(prestamo.ejemplar_id);
    if (!ejemplar) {
      const error = new Error('Ejemplar no encontrado') as any;
      error.cause = 404;
      throw error;
    }
    ejemplar.disponible = true;
    await baseDatos.actualizarEjemplar(prestamo.ejemplar_id, ejemplar);

    return prestamo;
  }

  async renovarPrestamo(prestamo_id: string): Promise<Prestamo> {
    const prestamo = await baseDatos.obtenerPrestamo(prestamo_id);
    if (!prestamo) {
      const error = new Error('Préstamo no encontrado') as any;
      error.cause = 404;
      throw error;
    }

    const otrosPrestamos = (await baseDatos.obtenerPrestamosPorEstudiante(prestamo.estudiante_id))
      .filter((p: Prestamo) => p.ejemplar_id === prestamo.ejemplar_id && p.prestamo_id !== prestamo_id);

    if (otrosPrestamos.length > 0) {
      const error = new Error('Renovación no permitida') as any;
      error.httpCode = 409;
      error.error = 'renovacion_no_permitida';
      error.razon = 'otro_estudiante_espera_libro';
      throw error;
    }

    const ejemplar = await baseDatos.obtenerEjemplar(prestamo.ejemplar_id);
    const libro = await baseDatos.obtenerLibro(ejemplar!.libro_id);
    const diasPlazo = libro!.alta_demanda ? 3 : 15;

    prestamo.fecha_devolucion_esperada = new Date(prestamo.fecha_devolucion_esperada);
    prestamo.fecha_devolucion_esperada.setDate(
      prestamo.fecha_devolucion_esperada.getDate() + diasPlazo
    );
    prestamo.renovado = true;

    await baseDatos.actualizarPrestamo(prestamo_id, prestamo);
    return prestamo;
  }

  // ========== MULTAS ==========

  async obtenerMultasPorEstudiante(estudiante_id: string): Promise<Multa[]> {
    const estudiante = await baseDatos.obtenerEstudiante(estudiante_id);
    if (!estudiante) {
      const error = new Error('Estudiante no encontrado') as any;
      error.cause = 404;
      throw error;
    }
    return await baseDatos.obtenerMultasPorEstudiante(estudiante_id);
  }

  async pagarMulta(estudiante_id: string, multa_id: string): Promise<Multa> {
    const multa = await baseDatos.obtenerMulta(multa_id);
    if (!multa) {
      const error = new Error('Multa no encontrada') as any;
      error.cause = 404;
      throw error;
    }

    if (multa.estudiante_id !== estudiante_id) {
      const error = new Error('La multa no pertenece al estudiante') as any;
      error.httpCode = 400;
      throw error;
    }

    multa.estado = EstadoMulta.PAGADA;
    await baseDatos.actualizarMulta(multa_id, multa);

    const multas = await baseDatos.obtenerMultasPorEstudiante(estudiante_id);
    const pendientes = multas.filter(m => m.estado === EstadoMulta.PENDIENTE);

    if (pendientes.length === 0) {
      const estudiante = await baseDatos.obtenerEstudiante(estudiante_id);
      if (estudiante) {
        estudiante.multa_pendiente = false;
        await baseDatos.actualizarEstudiante(estudiante_id, estudiante);
      }
    }

    return multa;
  }

  // ========== HELPERS ==========

  private async actualizarEstadoVencimiento(prestamo: Prestamo) {
    if (prestamo.estado === EstadoPrestamo.ACTIVO && prestamo.fecha_devolucion_real === null) {
      const hoy = new Date();
      if (prestamo.fecha_devolucion_esperada < hoy) {
        prestamo.estado = EstadoPrestamo.VENCIDO;
        await baseDatos.actualizarPrestamo(prestamo.prestamo_id, prestamo);
      }
    }
  }
}

export const servicioPrestamoLibros = new ServicioPrestamoLibros();
