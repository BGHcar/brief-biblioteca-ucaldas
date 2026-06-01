import { servicioPrestamoLibros } from '../src/servicios/servicio-prestamo-libros';
import { baseDatos } from '../src/base-datos/base-datos';
import { Libro, Ejemplar, Estudiante, TipoEstudiante, EstadoPrestamo } from '../src/modelos/tipos';
import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Servicio de Préstamo de Libros', () => {

  beforeEach(async () => {
    await baseDatos.limpiarTodos();

    const libro: Libro = {
      libro_id: 'LIB001',
      titulo: 'Test Libro',
      autor: 'Test Autor',
      sala: 'Test Sala',
      alta_demanda: false
    };
    await baseDatos.agregarLibro(libro);

    const ejemplar: Ejemplar = {
      ejemplar_id: 'EJ001',
      libro_id: 'LIB001',
      disponible: true
    };
    await baseDatos.agregarEjemplar(ejemplar);

    const estudiante: Estudiante = {
      estudiante_id: 'EST001',
      nombre: 'Test Estudiante',
      programa_academico: 'Test Programa',
      semestre: 1,
      tipo_estudiante: TipoEstudiante.PREGRADO,
      multa_pendiente: false
    };
    await baseDatos.agregarEstudiante(estudiante);
  });

  describe('RN1 - Límite de préstamos por tipo de estudiante', () => {
    test('Pregrado puede prestar máximo 3 libros', async () => {
      for (let i = 1; i <= 3; i++) {
        const ej: Ejemplar = {
          ejemplar_id: `EJ00${i}`,
          libro_id: 'LIB001',
          disponible: true
        };
        await baseDatos.agregarEjemplar(ej);
      }

      await servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ001' });
      await servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ002' });
      await servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ003' });

      const ej4: Ejemplar = {
        ejemplar_id: 'EJ004',
        libro_id: 'LIB001',
        disponible: true
      };
      await baseDatos.agregarEjemplar(ej4);

      await assert.rejects(
        () => servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ004' }),
        /Límite de préstamos alcanzado/
      );
    });

    test('Posgrado puede prestar máximo 5 libros', async () => {
      const estudiante = await baseDatos.obtenerEstudiante('EST001');
      if (!estudiante) {
        throw new Error('Estudiante de prueba no encontrado');
      }
      estudiante.tipo_estudiante = TipoEstudiante.POSGRADO;
      await baseDatos.actualizarEstudiante('EST001', estudiante);

      for (let i = 1; i <= 5; i++) {
        const ej: Ejemplar = {
          ejemplar_id: `EJ00${i}`,
          libro_id: 'LIB001',
          disponible: true
        };
        await baseDatos.agregarEjemplar(ej);
      }

      for (let i = 1; i <= 5; i++) {
        await servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: `EJ00${i}` });
      }

      const ej6: Ejemplar = {
        ejemplar_id: 'EJ006',
        libro_id: 'LIB001',
        disponible: true
      };
      await baseDatos.agregarEjemplar(ej6);

      await assert.rejects(
        () => servicioPrestamoLibros.crearPrestamo({ estudiante_id: 'EST001', ejemplar_id: 'EJ006' }),
        /Límite de préstamos alcanzado/
      );
    });
  });

  describe('RN2 - Cálculo de plazo según tipo de libro', () => {
    test('Libro normal: plazo 15 días', async () => {
      const prestamo = await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const diasEsperados = 15;
      const diasCalculados = Math.floor(
        (prestamo.fecha_devolucion_esperada.getTime() - prestamo.fecha_prestamo.getTime())
        / (1000 * 60 * 60 * 24)
      );

      assert.equal(diasCalculados, diasEsperados);
    });

    test('Libro de alta demanda: plazo 3 días', async () => {
      const libro = await baseDatos.obtenerLibro('LIB001');
      if (!libro) {
        throw new Error('Libro de prueba no encontrado');
      }
      libro.alta_demanda = true;
      await baseDatos.agregarLibro(libro);

      const prestamo = await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const diasEsperados = 3;
      const diasCalculados = Math.floor(
        (prestamo.fecha_devolucion_esperada.getTime() - prestamo.fecha_prestamo.getTime())
        / (1000 * 60 * 60 * 24)
      );

      assert.equal(diasCalculados, diasEsperados);
    });
  });

  describe('RN5 - Control de disponibilidad del ejemplar', () => {
    test('No se puede prestar ejemplar no disponible', async () => {
      const ejemplar = await baseDatos.obtenerEjemplar('EJ001');
      if (!ejemplar) {
        throw new Error('Ejemplar de prueba no encontrado');
      }
      ejemplar.disponible = false;
      await baseDatos.actualizarEjemplar('EJ001', ejemplar);

      await assert.rejects(
        () => servicioPrestamoLibros.crearPrestamo({
          estudiante_id: 'EST001',
          ejemplar_id: 'EJ001'
        }),
        /Ejemplar no disponible/
      );
    });

    test('Ejemplar se marca como no disponible después del préstamo', async () => {
      await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const ejemplar = await baseDatos.obtenerEjemplar('EJ001');
      if (!ejemplar) {
        throw new Error('Ejemplar de prueba no encontrado');
      }
      assert.equal(ejemplar.disponible, false);
    });
  });

  describe('RN6 - Cálculo de multa en devolución tardía', () => {
    test('Se calcula multa si devuelve tarde', async () => {
      const prestamo = await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const fechaDevolucion = new Date(prestamo.fecha_devolucion_esperada);
      fechaDevolucion.setDate(fechaDevolucion.getDate() + 5);

      await servicioPrestamoLibros.devolverPrestamo(prestamo.prestamo_id, {
        fecha_devolucion_real: fechaDevolucion.toISOString()
      });

      const multas = await baseDatos.obtenerMultasPorEstudiante('EST001');
      assert.equal(multas.length, 1);
      assert.equal(multas[0].monto, 5 * 2000);
      assert.equal(multas[0].dias_retraso, 5);
    });

    test('No se calcula multa si devuelve a tiempo', async () => {
      const prestamo = await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const fechaDevolucion = new Date(prestamo.fecha_devolucion_esperada);
      fechaDevolucion.setDate(fechaDevolucion.getDate() - 1);

      await servicioPrestamoLibros.devolverPrestamo(prestamo.prestamo_id, {
        fecha_devolucion_real: fechaDevolucion.toISOString()
      });

      const multas = await baseDatos.obtenerMultasPorEstudiante('EST001');
      assert.equal(multas.length, 0);
    });
  });

  describe('RN4 - Bloqueo por multas pendientes', () => {
    test('No se puede prestar si tiene multas pendientes', async () => {
      const prestamo = await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      const fechaDevolucion = new Date(prestamo.fecha_devolucion_esperada);
      fechaDevolucion.setDate(fechaDevolucion.getDate() + 5);

      await servicioPrestamoLibros.devolverPrestamo(prestamo.prestamo_id, {
        fecha_devolucion_real: fechaDevolucion.toISOString()
      });

      const ej2: Ejemplar = {
        ejemplar_id: 'EJ002',
        libro_id: 'LIB001',
        disponible: true
      };
      await baseDatos.agregarEjemplar(ej2);

      await assert.rejects(
        () => servicioPrestamoLibros.crearPrestamo({
          estudiante_id: 'EST001',
          ejemplar_id: 'EJ002'
        }),
        /Tiene multas pendientes/
      );
    });
  });

  describe('RN8 - Detección de vencimiento', () => {
    test('Préstamo se marca como vencido cuando es consultado y fecha pasó', async () => {
      const prestamo = await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      prestamo.fecha_devolucion_esperada = new Date();
      prestamo.fecha_devolucion_esperada.setDate(prestamo.fecha_devolucion_esperada.getDate() - 1);
      await baseDatos.actualizarPrestamo(prestamo.prestamo_id, prestamo);

      const prestamoObtenido = await servicioPrestamoLibros.obtenerPrestamo(prestamo.prestamo_id);
      assert.equal(prestamoObtenido.estado, EstadoPrestamo.VENCIDO);
    });
  });

  describe('Flujo completo', () => {
    test('Flujo completo: crear → obtener → devolver', async () => {
      const prestamo = await servicioPrestamoLibros.crearPrestamo({
        estudiante_id: 'EST001',
        ejemplar_id: 'EJ001'
      });

      assert.equal(prestamo.estado, EstadoPrestamo.ACTIVO);

      const prestamoObtenido = await servicioPrestamoLibros.obtenerPrestamo(prestamo.prestamo_id);
      assert.equal(prestamoObtenido.prestamo_id, prestamo.prestamo_id);

      const prestamoDevuelto = await servicioPrestamoLibros.devolverPrestamo(
        prestamo.prestamo_id,
        { fecha_devolucion_real: new Date().toISOString() }
      );

      assert.equal(prestamoDevuelto.estado, EstadoPrestamo.DEVUELTO);

      const ejemplar = await baseDatos.obtenerEjemplar('EJ001');
      if (!ejemplar) {
        throw new Error('Ejemplar de prueba no encontrado');
      }
      assert.equal(ejemplar.disponible, true);
    });
  });

});
