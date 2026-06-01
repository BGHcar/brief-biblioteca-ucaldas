// Tipos y interfaces para el sistema de préstamo de libros

export enum TipoEstudiante {
  PREGRADO = 'pregrado',
  POSGRADO = 'posgrado'
}

export enum EstadoPrestamo {
  ACTIVO = 'activo',
  DEVUELTO = 'devuelto',
  VENCIDO = 'vencido'
}

export enum EstadoMulta {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada'
}

export enum EstadoReserva {
  PENDIENTE = 'pendiente',
  VENCIDA = 'vencida',
  COMPLETADA = 'completada'
}

// Entidad: Libro
export interface Libro {
  libro_id: string;
  titulo: string;
  autor: string;
  sala: string;
  alta_demanda: boolean;
}

// Entidad: Ejemplar
export interface Ejemplar {
  ejemplar_id: string;
  libro_id: string;
  disponible: boolean;
}

// Entidad: Estudiante
export interface Estudiante {
  estudiante_id: string;
  nombre: string;
  programa_academico: string;
  semestre: number;
  tipo_estudiante: TipoEstudiante;
  multa_pendiente: boolean;
}

// Entidad: Préstamo
export interface Prestamo {
  prestamo_id: string;
  estudiante_id: string;
  ejemplar_id: string;
  fecha_prestamo: Date;
  fecha_devolucion_esperada: Date;
  fecha_devolucion_real: Date | null;
  estado: EstadoPrestamo;
  renovaciones_realizadas: number;
}

// Entidad: Reserva
export interface Reserva {
  reserva_id: string;
  estudiante_id: string;
  ejemplar_id: string;
  fecha_reserva: Date;
  estado: EstadoReserva;
}

// Entidad: Multa
export interface Multa {
  multa_id: string;
  estudiante_id: string;
  prestamo_id: string;
  monto: number;
  dias_retraso: number;
  estado: EstadoMulta;
  fecha_calculo: Date;
}

// DTOs para requests/responses
export interface CrearPrestamoDTO {
  estudiante_id: string;
  ejemplar_id: string;
  fechaPrestamoSimulada?: string; // ISO 8601 opcional para pruebas
  fecha_actual_simulada?: string; // ISO 8601 opcional para validar horario/vencimiento
}

export interface DevolverPrestamoDTO {
  fecha_devolucion_real: string; // ISO 8601
  codigo_campana_amnistia?: string; // Ej: "AMNISTIA_2026" para amnistía
}

export interface CrearReservaDTO {
  estudiante_id: string;
  ejemplar_id: string;
}
