# API de Biblioteca Universitaria - proyecto-v1

Esta es una API REST construida con Node.js y Express para gestionar libros y préstamos en una biblioteca universitaria. Los datos se mantienen en memoria, por lo que se reinician cada vez que el servidor se detiene.

## Instalación y Ejecución

1. Navega a la carpeta del proyecto:
   ```bash
   cd proyecto-v1
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
   El servidor estará disponible en `http://localhost:3000`.

## Endpoints

### 1. Listar Libros
**GET** `/books`
Retorna una lista de todos los libros disponibles y su estado.

### 2. Consultar Préstamos Vigentes
**GET** `/loans/active`
Retorna una lista de todos los préstamos que aún no han sido devueltos.

### 3. Crear un Préstamo
**POST** `/loans`
Crea un nuevo préstamo para un libro específico.
- **Cuerpo (JSON):**
  ```json
  {
    "bookId": 1,
    "studentName": "Juan Pérez"
  }
  ```

### 4. Devolver un Libro
**PATCH** `/loans/:id/return`
Marca un préstamo como devuelto y libera el libro.
- **Parámetro:** `id` del préstamo.

## Datos de Ejemplo (In-Memory)
Al iniciar, la API cuenta con los siguientes libros:
- Cien años de soledad
- Don Quijote de la Mancha
- El amor en los tiempos del cólera
- Rayuela
- Ficciones
