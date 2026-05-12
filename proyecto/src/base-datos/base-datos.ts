import { Libro, Ejemplar, Estudiante, Prestamo, Multa } from '../modelos/tipos';

class BaseDatos {
  private libros: Map<string, Libro> = new Map();
  private ejemplares: Map<string, Ejemplar> = new Map();
  private estudiantes: Map<string, Estudiante> = new Map();
  private prestamos: Map<string, Prestamo> = new Map();
  private multas: Map<string, Multa> = new Map();

  // Getters
  getLibros = () => Array.from(this.libros.values());
  getEjemplares = () => Array.from(this.ejemplares.values());
  getEstudiantes = () => Array.from(this.estudiantes.values());
  getPrestamos = () => Array.from(this.prestamos.values());
  getMultas = () => Array.from(this.multas.values());

  // Libro
  agregarLibro(libro: Libro) {
    this.libros.set(libro.libro_id, libro);
  }
  obtenerLibro(libro_id: string) {
    return this.libros.get(libro_id);
  }

  // Ejemplar
  agregarEjemplar(ejemplar: Ejemplar) {
    this.ejemplares.set(ejemplar.ejemplar_id, ejemplar);
  }
  obtenerEjemplar(ejemplar_id: string) {
    return this.ejemplares.get(ejemplar_id);
  }
  actualizarEjemplar(ejemplar_id: string, ejemplar: Ejemplar) {
    this.ejemplares.set(ejemplar_id, ejemplar);
  }

  // Estudiante
  agregarEstudiante(estudiante: Estudiante) {
    this.estudiantes.set(estudiante.estudiante_id, estudiante);
  }
  obtenerEstudiante(estudiante_id: string) {
    return this.estudiantes.get(estudiante_id);
  }
  actualizarEstudiante(estudiante_id: string, estudiante: Estudiante) {
    this.estudiantes.set(estudiante_id, estudiante);
  }

  // Préstamo
  agregarPrestamo(prestamo: Prestamo) {
    this.prestamos.set(prestamo.prestamo_id, prestamo);
  }
  obtenerPrestamo(prestamo_id: string) {
    return this.prestamos.get(prestamo_id);
  }
  actualizarPrestamo(prestamo_id: string, prestamo: Prestamo) {
    this.prestamos.set(prestamo_id, prestamo);
  }
  obtenerPrestamosPorEstudiante(estudiante_id: string) {
    return Array.from(this.prestamos.values()).filter(
      p => p.estudiante_id === estudiante_id
    );
  }

  // Multa
  agregarMulta(multa: Multa) {
    this.multas.set(multa.multa_id, multa);
  }
  obtenerMultasPorEstudiante(estudiante_id: string) {
    return Array.from(this.multas.values()).filter(
      m => m.estudiante_id === estudiante_id
    );
  }
}

export const baseDatos = new BaseDatos();
