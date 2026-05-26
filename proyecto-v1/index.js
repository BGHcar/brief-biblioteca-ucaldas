const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// In-memory data
let books = [];
let exemplars = []; // { id: 'EJ-001-01', libro_id: 'LIB-001', disponible: true }
let students = []; // { id: 'EST-PRE-01', nombre, tipo }
let loans = []; // simple loans array

// seed minimal catalog for manual testing
books.push({ id: 'LIB-001', titulo: 'Ingenieria del Software', autor: 'Pressman', sala: 'Sala General', altaDemanda: false });
books.push({ id: 'LIB-002', titulo: 'Clean Code', autor: 'Robert C. Martin', sala: 'Sala de Reserva', altaDemanda: true });
exemplars.push({ id: 'EJ-001-01', libro_id: 'LIB-001', disponible: true });
exemplars.push({ id: 'EJ-001-02', libro_id: 'LIB-001', disponible: true });
exemplars.push({ id: 'EJ-002-01', libro_id: 'LIB-002', disponible: true });


// 1. List books
app.get('/api/libros', (req, res) => {
    res.json(books);
});

// GET ejemplares
app.get('/api/libros/:libro_id/ejemplares', (req, res) => {
    const libro_id = req.params.libro_id;
    const list = exemplars.filter(e => e.libro_id === libro_id);
    res.json(list);
});

// 2. Create loans
app.post('/api/prestamos', (req, res) => {
    const { estudianteId, ejemplarId } = req.body;
    if (!estudianteId || !ejemplarId) return res.status(400).json({ message: 'estudianteId y ejemplarId requeridos' });

    const estudiante = students.find(s => s.id === estudianteId);
    if (!estudiante) return res.status(404).json({ message: 'Estudiante no encontrado' });

    const ejemplar = exemplars.find(e => e.id === ejemplarId);
    if (!ejemplar) return res.status(404).json({ message: 'Ejemplar no encontrado' });
    if (!ejemplar.disponible) return res.status(409).json({ message: 'Ejemplar no disponible' });

    // basic limit: max 3 activos por estudiante
    const activos = loans.filter(l => l.estudianteId === estudianteId && l.status === 'active');
    if (activos.length >= 3) return res.status(409).json({ message: 'limite de prestamos alcanzado' });

    const loan = { id: loans.length + 1, estudianteId, ejemplarId, fecha_prestamo: new Date(), status: 'active' };
    ejemplar.disponible = false;
    loans.push(loan);
    res.status(201).json(loan);
});

// 3. Return books
app.patch('/loans/:id/return', (req, res) => {
    const loanId = parseInt(req.params.id);
    const loan = loans.find(l => l.id === loanId);

    if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status === 'returned') {
        return res.status(400).json({ message: 'Book already returned' });
    }

    const book = books.find(b => b.id === loan.bookId);
    if (book) {
        book.available = true;
    }

    loan.status = 'returned';
    loan.returnDate = new Date();

    res.json({ message: 'Book returned successfully', loan });
});

// 4. Consult active loans
app.get('/loans/active', (req, res) => {
    const activeLoans = loans.filter(l => l.status === 'active');
    res.json(activeLoans);
});

app.listen(port, () => {
    console.log(`Library API listening at http://localhost:${port}`);
});
