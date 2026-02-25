const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Postgres (Ajusta con tus credenciales)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'vfinance_db',
    password: 'tu_password',
    port: 5432,
});

const PRECIO_DIA = 59000;
const PRECIO_EXTRA = 5500;

// Obtener resumen financiero
app.get('/api/resumen', async (req, res) => {
    try {
        const jornadas = await pool.query('SELECT SUM(monto_total) as total_nomina FROM jornadas');
        const movimientos = await pool.query('SELECT tipo, SUM(valor) as suma FROM movimientos GROUP BY tipo');

        res.json({
            nomina: jornadas.rows[0].total_nomina || 0,
            otros: movimientos.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Guardar nueva jornada con cálculo automático de extras
app.post('/api/jornadas', async (req, res) => {
    const { fecha, salida_real } = req.body;

    // Lógica: Entrada 7am, Salida estándar 4pm (16:00). 5pm (17:00) es 1 extra.
    const [hora, min] = salida_real.split(':').map(Number);
    let extras = 0;
    if (hora >= 17) {
        extras = hora - 16;
    }

    const monto_total = PRECIO_DIA + (extras * PRECIO_EXTRA);

    try {
        const query = 'INSERT INTO jornadas (fecha, salida_real, horas_extras, monto_total) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [fecha, salida_real, extras, monto_total]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log('Servidor VFinance corriendo en http://localhost:5000'));
