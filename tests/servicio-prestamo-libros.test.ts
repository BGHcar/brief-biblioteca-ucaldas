import { servicioPrestamoLibros } from '../src/servicios/servicio-prestamo-libros';
import { baseDatos } from '../src/base-datos/base-datos';
import { Libro, Ejemplar, Estudiante, TipoEstudiante, EstadoPrestamo } from '../src/modelos/tipos';

describe('Servicio de Préstamo de Libros', () => {

  beforeEach(() => {
    // Limpiar base de datos antes de cada test
    baseDatos.getLibros().forEach(l => {
      baseDatos['libros'].delete(l.libro_id);
    });
    baseDatos.getEjemplares().forEach(e => {
      baseDatos['ejemplares'].delete(e.ejemplar_id);
    });
    baseDatos.getEstudiantes().forEach(e => {
      baseDatos['estudiantes'].delete(e.estudiante_id);
    });
    baseDatos.getPrestamos().forEach(p => {
      baseDatos['prestamos'].delete(p.prestamo_id);
    });
    baseDatos.getMultas().forEach(m => {
      baseDatos['multas'].delete(m.multa_id);
    });

    // Crear datos de prueba
    const libro: Libro = {
      libro_id: 'LIB001',
      titulo: 'Test Libro',
      autor: 'Test Autor',
      sala: 'Test Sala',
      alta_demanda: false
    };
    baseDatos['libros'].set(libro.libro_id, libro);

    const ejemplar: Ejemplar = {
      ejemplar_id: 'EJ001',
      libro_id: 'LIB001',
      disponible: true
    };
    baseDatos['ejemplares'].set(ejemplar.ejemplar_id, ejemplar);

    const estudiante: Estudiante = {
      estudiante_id: 'EST001',
      nombre: 'Test Estudiante',
      programa_academico: 'Test Programa',
      semestre: 1,
      tipo_estudiante: TipoEstudiante.PREGRADO,
      multa_pendiente: false
    };
    baseDatos['estudiantes'].set(estudiante.estudiante_id, estudiante);
  });

  describe('RN1 - Límite de préstamos por tipo de estudiante', () => {
    test('Pregrado puede prestar máximo 3 libros', () => {
      // Crear 3 ejemplares disponibles
      for (let i = 1; i <= 3; i++) {
        const ej: Ejemplar = {
          ejemplar_id: `EJ00${i}`,
          libro_id: 'LIB001',
          disponible: true
        };
        baseDatos['ejemplares'].set(ej.ejemplar_id, ej);
      }

      // Hacer 3 préstamos exitosos
      expect(() => {
        servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ001' });
        servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ002' });
        servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ003' });
      }).not.toThrow();

      // El 4to préstamo debe fallar
      const ej4: Ejemplar = {
        ejemplar_id: 'EJ004',
        libro_id: 'LIB001',
        disponible: true
      };
      baseDatos['ejemplares'].set(ej4.ejemplar_id, ej4);

      expect(() => {
        servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ004' });
      }).toThrow('Límite de préstamos alcanzado');
    });

    test('Posgrado puede prestar máximo 5 libros', () => {
      // Cambiar estudiante a posgrado
      const estudiante = baseDatos.obtenerEstudiante('EST001')!;
      estudiante.tipo_estudiante = TipoEstudiante.POSGRADO;
      baseDatos.actualizarEstudiante('EST001', estudiante);

      // Crear 5 ejemplares
      for (let i = 1; i <= 5; i++) {
        const ej: Ejemplar = {
          ejemplar_id: `EJ00${i}`,
          libro_id: 'LIB001',
          disponible: true
        };
        baseDatos['ejemplares'].set(ej.ejemplar_id, ej);
      }

      // Hacer 5 préstamos exitosos
      expect(() => {
        for (let i = 1; i <= 5; i++) {
          servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: `EJ00${i}` });
        }
      }).not.toThrow();

      // El 6to debe fallar
      const ej6: Ejemplar = {
        ejemplar_id: 'EJ006',
        libro_id: 'LIB001',
        disponible: true
      };
      baseDatos['ejemplares'].set(ej6.ejemplar_id, ej6);

      expect(() => {
        servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ006' });
      }).toThrow('Límite de préstamos alcanzado');
    });
  });

  describe('RN2 - Cálculo de plazo según tipo de libro', () => {
    test('Libro normal: plazo 15 días', () => {
      const prestamo = servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const diasEsperados = 15;
      const diasCalculados = Math.floor(
        (prestamo.fecha_devolucion_esperada.getTime() - prestamo.fecha_prestamo.getTime()) 
        / (1000 * 60 * 60 * 24)
      );

      expect(diasCalculados).toBe(diasEsperados);
    });

    test('Libro de alta demanda: plazo 3 días', () => {
      // Cambiar libro a alta demanda
      const libro = baseDatos.obtenerLibro('LIB001')!;
      libro.alta_demanda = true;
      baseDatos['libros'].set(libro.libro_id, libro);

      const prestamo = servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const diasEsperados = 3;
      const diasCalculados = Math.floor(
        (prestamo.fecha_devolucion_esperada.getTime() - prestamo.fecha_prestamo.getTime()) 
        / (1000 * 60 * 60 * 24)
      );

      expect(diasCalculados).toBe(diasEsperados);
    });
  });

  describe('RN5 - Control de disponibilidad del ejemplar', () => {
    test('No se puede prestar ejemplar no disponible', () => {
      // Marcar ejemplar como no disponible
      const ejemplar = baseDatos.obtenerEjemplar('EJ001')!;
      ejemplar.disponible = false;
      baseDatos.actualizarEjemplar('EJ001', ejemplar);

      expect(() => {
        servicioPrestamoLibros.crearPrestamo({
          estudiante_id: 'EST001',
          ejemplar_id: 'EJ001'
        });
      }).toThrow('Ejemplar no disponible');
    });

    test('Ejemplar se marca como no disponible después del préstamo', () => {
      servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const ejemplar = baseDatos.obtenerEjemplar('EJ001')!;
      expect(ejemplar.disponible).toBe(false);
    });
  });

  describe('RN6 - Cálculo de multa en devolución tardía', () => {
    test('Se calcula multa si devuelve tarde', () => {
      const prestamo = servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      // Devolver con 5 días de retraso
      const fechaDevolucion = new Date(prestamo.fecha_devolucion_esperada);
      fechaDevolucion.setDate(fechaDevolucion.getDate() + 5);

      servicioPrestamoLibros.devolverPrestamo(prestamo.prestamo_id, {
        fecha_devolucion_real: fechaDevolucion.toISOString()
      });

      const multas = baseDatos.obtenerMultasPorEstudiante('EST001');
      expect(multas.length).toBe(1);
      expect(multas[0].monto).toBe(5 * 2000); // 5 días * 2000 pesos
      expect(multas[0].dias_retraso).toBe(5);
    });

    test('No se calcula multa si devuelve a tiempo', () => {
      const prestamo = servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      // Devolver antes de la fecha
      const fechaDevolucion = new Date(prestamo.fecha_devolucion_esperada);
      fechaDevolucion.setDate(fechaDevolucion.getDate() - 1);

      servicioPrestamoLibros.devolverPrestamo(prestamo.prestamo_id, {
        fecha_devolucion_real: fechaDevolucion.toISOString()
      });

      const multas = baseDatos.obtenerMultasPorEstudiante('EST001');
      expect(multas.length).toBe(0);
    });
  });

  describe('RN4 - Bloqueo por multas pendientes', () => {
    test('No se puede prestar si tiene multas pendientes', () => {
      // Crear un préstamo y devolver tarde
      const prestamo = servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const fechaDevolucion = new Date(prestamo.fecha_devolucion_esperada);
      fechaDevolucion.setDate(fechaDevolucion.getDate() + 5);

      servicioPrestamoLibros.devolverPrestamo(prestamo.prestamo_id, {
        fecha_devolucion_real: fechaDevolucion.toISOString()
      });

      // Crear otro ejemplar disponible
      const ej2: Ejemplar = {
        ejemplar_id: 'EJ002',
        libro_id: 'LIB001',
        disponible: true
      };
      baseDatos['ejemplares'].set(ej2.ejemplar_id, ej2);

      // Intentar hacer otro préstamo debe fallar
      expect(() => {
        servicioPrestamoLibros.crearPrestamo({
          estudiante_id: 'EST001',
          ejemplar_id: 'EJ002'
        });
      }).toThrow('multas_pendientes');
    });
  });

  describe('RN8 - Detección de vencimiento', () => {
    test('Préstamo se marca como vencido cuando es consultado y fecha pasó', () => {
      const prestamo = servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      // Modificar fecha de devolución esperada para que sea en el pasado
      prestamo.fecha_devolucion_esperada = new Date();
      prestamo.fecha_devolucion_esperada.setDate(prestamo.fecha_devolucion_esperada.getDate() - 1);
      baseDatos.actualizarPrestamo(prestamo.prestamo_id, prestamo);

      // Consultar el préstamo
      const prestamoObtenido = servicioPrestamoLibros.obtenerPrestamo(prestamo.prestamo_id);
      expect(prestamoObtenido.estado).toBe(EstadoPrestamo.VENCIDO);
    });
  });

  describe('Flujo completo', () => {
    test('Flujo completo: crear → obtener → devolver', () => {
      // Crear préstamo
      const prestamo = servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      expect(prestamo.estado).toBe(EstadoPrestamo.ACTIVO);

      // Obtener préstamo
      const prestamoObtenido = servicioPrestamoLibros.obtenerPrestamo(prestamo.prestamo_id);
      expect(prestamoObtenido.prestamo_id).toBe(prestamo.prestamo_id);

      // Devolver
      const prestamoDevuelto = servicioPrestamoLibros.devolverPrestamo(
        prestamo.prestamo_id,
        { fecha_devolucion_real: new Date().toISOString() }
      );

      expect(prestamoDevuelto.estado).toBe(EstadoPrestamo.DEVUELTO);

      // Verificar que ejemplar vuelve a estar disponible
      const ejemplar = baseDatos.obtenerEjemplar('EJ001')!;
      expect(ejemplar.disponible).toBe(true);
    });
  });

});
