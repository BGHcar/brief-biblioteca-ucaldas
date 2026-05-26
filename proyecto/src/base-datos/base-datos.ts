import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Libro, Ejemplar, Estudiante, Prestamo, Multa } from '../modelos/tipos';
import path from 'path';
import fs from 'fs';

class BaseDatos {
  private db!: Database<sqlite3.Database, sqlite3.Statement>;
  public ready: Promise<void>;

  constructor() {
    const isTest = process.env.NODE_ENV === 'test';
    const dbPath = isTest ? ':memory:' : path.resolve(__dirname, '..', '..', 'biblioteca.db');
    const needSeed = !isTest && !fs.existsSync(dbPath);

    this.ready = this.connect(dbPath, needSeed);
  }

  private async connect(dbPath: string, needSeed: boolean) {
    sqlite3.verbose();
    this.db = await open({ filename: dbPath, driver: sqlite3.Database });
    await this.db.exec('PRAGMA foreign_keys = ON;');
    await this.inicializarBaseDatos();

    if (needSeed) {
      const sqlPath = path.resolve(__dirname, '..', '..', 'sql', 'init.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await this.db.exec(sql);
      }
    }
  }

  private async inicializarBaseDatos() {
    const createLibros = `
      CREATE TABLE IF NOT EXISTS libros (
        libro_id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        autor TEXT NOT NULL,
        sala TEXT NOT NULL,
        alta_demanda INTEGER NOT NULL
      );`;

    const createEjemplares = `
      CREATE TABLE IF NOT EXISTS ejemplares (
        ejemplar_id TEXT PRIMARY KEY,
        libro_id TEXT NOT NULL,
        disponible INTEGER NOT NULL,
        FOREIGN KEY (libro_id) REFERENCES libros(libro_id) ON DELETE CASCADE
      );`;

    const createEstudiantes = `
      CREATE TABLE IF NOT EXISTS estudiantes (
        estudiante_id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        programa_academico TEXT NOT NULL,
        semestre INTEGER NOT NULL,
        tipo_estudiante TEXT NOT NULL,
        multa_pendiente INTEGER NOT NULL
      );`;

    const createPrestamos = `
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
      );`;

    const createMultas = `
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
      );`;

    await this.db.exec(createLibros);
    await this.db.exec(createEjemplares);
    await this.db.exec(createEstudiantes);
    await this.db.exec(createPrestamos);
    await this.db.exec(createMultas);
  }

  async limpiarTodos() {
    await this.ready;
    await this.db.exec('BEGIN');
    try {
      await this.db.exec('DELETE FROM multas');
      await this.db.exec('DELETE FROM prestamos');
      await this.db.exec('DELETE FROM ejemplares');
      await this.db.exec('DELETE FROM libros');
      await this.db.exec('DELETE FROM estudiantes');
      await this.db.exec('COMMIT');
    } catch (err) {
      await this.db.exec('ROLLBACK');
      throw err;
    }
  }

  // ---------- Helpers para mapeo ----------
  private rowToLibro(row: any): Libro {
    return {
      libro_id: row.libro_id,
      titulo: row.titulo,
      autor: row.autor,
      sala: row.sala,
      alta_demanda: !!row.alta_demanda
    };
  }

  private rowToEjemplar(row: any): Ejemplar {
    return {
      ejemplar_id: row.ejemplar_id,
      libro_id: row.libro_id,
      disponible: !!row.disponible
    };
  }

  private rowToEstudiante(row: any): Estudiante {
    return {
      estudiante_id: row.estudiante_id,
      nombre: row.nombre,
      programa_academico: row.programa_academico,
      semestre: row.semestre,
      tipo_estudiante: row.tipo_estudiante,
      multa_pendiente: !!row.multa_pendiente
    };
  }

  private rowToPrestamo(row: any): Prestamo {
    return {
      prestamo_id: row.prestamo_id,
      estudiante_id: row.estudiante_id,
      ejemplar_id: row.ejemplar_id,
      fecha_prestamo: new Date(row.fecha_prestamo),
      fecha_devolucion_esperada: new Date(row.fecha_devolucion_esperada),
      fecha_devolucion_real: row.fecha_devolucion_real ? new Date(row.fecha_devolucion_real) : null,
      estado: row.estado,
      renovado: !!row.renovado
    };
  }

  private rowToMulta(row: any): Multa {
    return {
      multa_id: row.multa_id,
      estudiante_id: row.estudiante_id,
      prestamo_id: row.prestamo_id,
      monto: row.monto,
      dias_retraso: row.dias_retraso,
      estado: row.estado,
      fecha_calculo: new Date(row.fecha_calculo)
    };
  }

  // ---------- Getters (compatibilidad) ----------
  getLibros = async (): Promise<Libro[]> => {
    await this.ready;
    const rows = await this.db.all('SELECT * FROM libros');
    return rows.map((r: any) => this.rowToLibro(r));
  };

  getEjemplares = async (): Promise<Ejemplar[]> => {
    await this.ready;
    const rows = await this.db.all('SELECT * FROM ejemplares');
    return rows.map((r: any) => this.rowToEjemplar(r));
  };

  getEstudiantes = async (): Promise<Estudiante[]> => {
    await this.ready;
    const rows = await this.db.all('SELECT * FROM estudiantes');
    return rows.map((r: any) => this.rowToEstudiante(r));
  };

  getPrestamos = async (): Promise<Prestamo[]> => {
    await this.ready;
    const rows = await this.db.all('SELECT * FROM prestamos');
    return rows.map((r: any) => this.rowToPrestamo(r));
  };

  getMultas = async (): Promise<Multa[]> => {
    await this.ready;
    const rows = await this.db.all('SELECT * FROM multas');
    return rows.map((r: any) => this.rowToMulta(r));
  };

  // ---------- Libro ----------
  async agregarLibro(libro: Libro) {
    await this.ready;
    await this.db.run(
      `INSERT INTO libros (libro_id,titulo,autor,sala,alta_demanda)
       VALUES (?,?,?,?,?)
       ON CONFLICT(libro_id) DO UPDATE SET
         titulo = excluded.titulo,
         autor = excluded.autor,
         sala = excluded.sala,
         alta_demanda = excluded.alta_demanda`,
      libro.libro_id,
      libro.titulo,
      libro.autor,
      libro.sala,
      libro.alta_demanda ? 1 : 0
    );
  }

  async obtenerLibro(libro_id: string) {
    await this.ready;
    const row = await this.db.get('SELECT * FROM libros WHERE libro_id = ?', libro_id);
    return row ? this.rowToLibro(row) : undefined;
  }

  // ---------- Ejemplar ----------
  async agregarEjemplar(ejemplar: Ejemplar) {
    await this.ready;
    await this.db.run(
      `INSERT INTO ejemplares (ejemplar_id,libro_id,disponible)
       VALUES (?,?,?)
       ON CONFLICT(ejemplar_id) DO UPDATE SET
         libro_id = excluded.libro_id,
         disponible = excluded.disponible`,
      ejemplar.ejemplar_id,
      ejemplar.libro_id,
      ejemplar.disponible ? 1 : 0
    );
  }

  async obtenerEjemplar(ejemplar_id: string) {
    await this.ready;
    const row = await this.db.get('SELECT * FROM ejemplares WHERE ejemplar_id = ?', ejemplar_id);
    return row ? this.rowToEjemplar(row) : undefined;
  }

  async actualizarEjemplar(ejemplar_id: string, ejemplar: Ejemplar) {
    await this.ready;
    await this.db.run(
      'UPDATE ejemplares SET libro_id = ?, disponible = ? WHERE ejemplar_id = ?',
      ejemplar.libro_id,
      ejemplar.disponible ? 1 : 0,
      ejemplar_id
    );
  }

  // ---------- Estudiante ----------
  async agregarEstudiante(estudiante: Estudiante) {
    await this.ready;
    await this.db.run(
      `INSERT INTO estudiantes (estudiante_id,nombre,programa_academico,semestre,tipo_estudiante,multa_pendiente)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(estudiante_id) DO UPDATE SET
         nombre = excluded.nombre,
         programa_academico = excluded.programa_academico,
         semestre = excluded.semestre,
         tipo_estudiante = excluded.tipo_estudiante,
         multa_pendiente = excluded.multa_pendiente`,
      estudiante.estudiante_id,
      estudiante.nombre,
      estudiante.programa_academico,
      estudiante.semestre,
      estudiante.tipo_estudiante,
      estudiante.multa_pendiente ? 1 : 0
    );
  }

  async obtenerEstudiante(estudiante_id: string) {
    await this.ready;
    const row = await this.db.get('SELECT * FROM estudiantes WHERE estudiante_id = ?', estudiante_id);
    return row ? this.rowToEstudiante(row) : undefined;
  }

  async actualizarEstudiante(estudiante_id: string, estudiante: Estudiante) {
    await this.ready;
    await this.db.run(
      'UPDATE estudiantes SET nombre = ?, programa_academico = ?, semestre = ?, tipo_estudiante = ?, multa_pendiente = ? WHERE estudiante_id = ?',
      estudiante.nombre,
      estudiante.programa_academico,
      estudiante.semestre,
      estudiante.tipo_estudiante,
      estudiante.multa_pendiente ? 1 : 0,
      estudiante_id
    );
  }

  // ---------- Préstamo ----------
  async agregarPrestamo(prestamo: Prestamo) {
    await this.ready;
    await this.db.run(
      `INSERT INTO prestamos (prestamo_id,estudiante_id,ejemplar_id,fecha_prestamo,fecha_devolucion_esperada,fecha_devolucion_real,estado,renovado)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(prestamo_id) DO UPDATE SET
         estudiante_id = excluded.estudiante_id,
         ejemplar_id = excluded.ejemplar_id,
         fecha_prestamo = excluded.fecha_prestamo,
         fecha_devolucion_esperada = excluded.fecha_devolucion_esperada,
         fecha_devolucion_real = excluded.fecha_devolucion_real,
         estado = excluded.estado,
         renovado = excluded.renovado`,
      prestamo.prestamo_id,
      prestamo.estudiante_id,
      prestamo.ejemplar_id,
      prestamo.fecha_prestamo.toISOString(),
      prestamo.fecha_devolucion_esperada.toISOString(),
      prestamo.fecha_devolucion_real ? prestamo.fecha_devolucion_real.toISOString() : null,
      prestamo.estado,
      prestamo.renovado ? 1 : 0
    );
  }

  async obtenerPrestamo(prestamo_id: string) {
    await this.ready;
    const row = await this.db.get('SELECT * FROM prestamos WHERE prestamo_id = ?', prestamo_id);
    return row ? this.rowToPrestamo(row) : undefined;
  }

  async actualizarPrestamo(prestamo_id: string, prestamo: Prestamo) {
    await this.ready;
    await this.db.run(
      'UPDATE prestamos SET estudiante_id = ?, ejemplar_id = ?, fecha_prestamo = ?, fecha_devolucion_esperada = ?, fecha_devolucion_real = ?, estado = ?, renovado = ? WHERE prestamo_id = ?',
      prestamo.estudiante_id,
      prestamo.ejemplar_id,
      prestamo.fecha_prestamo.toISOString(),
      prestamo.fecha_devolucion_esperada.toISOString(),
      prestamo.fecha_devolucion_real ? prestamo.fecha_devolucion_real.toISOString() : null,
      prestamo.estado,
      prestamo.renovado ? 1 : 0,
      prestamo_id
    );
  }

  async obtenerPrestamosPorEstudiante(estudiante_id: string) {
    await this.ready;
    const rows = await this.db.all('SELECT * FROM prestamos WHERE estudiante_id = ?', estudiante_id);
    return rows.map((r: any) => this.rowToPrestamo(r));
  }

  // ---------- Multa ----------
  async agregarMulta(multa: Multa) {
    await this.ready;
    await this.db.run(
      `INSERT INTO multas (multa_id,estudiante_id,prestamo_id,monto,dias_retraso,estado,fecha_calculo)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(multa_id) DO UPDATE SET
         estudiante_id = excluded.estudiante_id,
         prestamo_id = excluded.prestamo_id,
         monto = excluded.monto,
         dias_retraso = excluded.dias_retraso,
         estado = excluded.estado,
         fecha_calculo = excluded.fecha_calculo`,
      multa.multa_id,
      multa.estudiante_id,
      multa.prestamo_id,
      multa.monto,
      multa.dias_retraso,
      multa.estado,
      multa.fecha_calculo.toISOString()
    );
  }

  async obtenerMultasPorEstudiante(estudiante_id: string) {
    await this.ready;
    const rows = await this.db.all('SELECT * FROM multas WHERE estudiante_id = ?', estudiante_id);
    return rows.map((r: any) => this.rowToMulta(r));
  }

  async obtenerMulta(multa_id: string) {
    await this.ready;
    const row = await this.db.get('SELECT * FROM multas WHERE multa_id = ?', multa_id);
    return row ? this.rowToMulta(row) : undefined;
  }

  async actualizarMulta(multa_id: string, multa: Multa) {
    await this.ready;
    await this.db.run(
      'UPDATE multas SET estudiante_id = ?, prestamo_id = ?, monto = ?, dias_retraso = ?, estado = ?, fecha_calculo = ? WHERE multa_id = ?',
      multa.estudiante_id,
      multa.prestamo_id,
      multa.monto,
      multa.dias_retraso,
      multa.estado,
      multa.fecha_calculo.toISOString(),
      multa_id
    );
  }
}

export const baseDatos = new BaseDatos();
