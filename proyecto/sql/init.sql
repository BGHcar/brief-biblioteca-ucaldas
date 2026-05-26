-- Script de inicialización de la base de datos SQLite (biblioteca.db)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS libros (
  libro_id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  sala TEXT NOT NULL,
  alta_demanda INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ejemplares (
  ejemplar_id TEXT PRIMARY KEY,
  libro_id TEXT NOT NULL,
  disponible INTEGER NOT NULL,
  FOREIGN KEY (libro_id) REFERENCES libros(libro_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estudiantes (
  estudiante_id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  programa_academico TEXT NOT NULL,
  semestre INTEGER NOT NULL,
  tipo_estudiante TEXT NOT NULL,
  multa_pendiente INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS prestamos (
  prestamo_id TEXT PRIMARY KEY,
  estudiante_id TEXT NOT NULL,
  ejemplar_id TEXT NOT NULL,
  fecha_prestamo TEXT NOT NULL,
  fecha_devolucion_esperada TEXT NOT NULL,
  fecha_devolucion_real TEXT,
  estado TEXT NOT NULL,
  renovado INTEGER NOT NULL,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(estudiante_id),
  FOREIGN KEY (ejemplar_id) REFERENCES ejemplares(ejemplar_id)
);

CREATE TABLE IF NOT EXISTS multas (
  multa_id TEXT PRIMARY KEY,
  estudiante_id TEXT NOT NULL,
  prestamo_id TEXT NOT NULL,
  monto REAL NOT NULL,
  dias_retraso INTEGER NOT NULL,
  estado TEXT NOT NULL,
  fecha_calculo TEXT NOT NULL,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(estudiante_id),
  FOREIGN KEY (prestamo_id) REFERENCES prestamos(prestamo_id)
);

-- Seed inicial (IDs acordados para el plan de pruebas)
INSERT OR REPLACE INTO libros (libro_id,titulo,autor,sala,alta_demanda) VALUES
('LIB-001','Algoritmos en TypeScript','Donald Knuth','Tecnología',1),
('LIB-002','Historia de Colombia','Carlos Morales','Historia',0);

INSERT OR REPLACE INTO ejemplares (ejemplar_id,libro_id,disponible) VALUES
('EJ-001','LIB-001',1),
('EJ-002','LIB-001',1),
('EJ-003','LIB-002',1);

INSERT OR REPLACE INTO estudiantes (estudiante_id,nombre,programa_academico,semestre,tipo_estudiante,multa_pendiente) VALUES
('EST-PRE-01','Juan Pérez','Ingeniería Sistemas',3,'pregrado',0),
('EST-POS-01','María González','Maestría Ingeniería',2,'posgrado',0);

-- No prestamos ni multas iniciales en seed
