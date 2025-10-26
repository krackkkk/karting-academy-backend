const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) console.error('DB Error:', err);
  else console.log('DB Connected');
});

pool.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    username TEXT,
    plan TEXT,
    "group" TEXT,
    date DATE,
    time TEXT,
    childName TEXT,
    childAge INTEGER,
    parentName TEXT,
    phone TEXT,
    source TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);

// POST /api/book
app.post('/api/book', async (req, res) => {
  try {
    const bookings = Array.isArray(req.body) ? req.body : [req.body];
    for (const b of bookings) {
      await pool.query(
        `INSERT INTO bookings (user_id, username, plan, "group", date, time, childName, childAge, parentName, phone, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [b.user_id, b.username, b.plan, b.group, b.date, b.time, b.childName, b.childAge, b.parentName, b.phone, b.source]
      );
    }
    res.send('OK');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error');
  }
});

// GET /api/my
app.get('/api/my', async (req, res) => {
  try {
    const { user_id } = req.query;
    const result = await pool.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).send('Error');
  }
});

// GET /api/admin
app.get('/api/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    let html = '<h1>АДМИНКА — ЗАПИСИ</h1><table border="1"><tr><th>ID</th><th>Пользователь</th><th>План</th><th>Дата</th><th>Время</th><th>Ребёнок</th><th>Телефон</th></tr>';
    result.rows.forEach(r => {
      html += `<tr><td>${r.id}</td><td>${r.username || r.user_id}</td><td>${r.plan}</td><td>${new Date(r.date).toLocaleDateString('ru')}</td><td>${r.time}</td><td>${r.childName} (${r.childAge})</td><td>${r.phone}</td></tr>`;
    });
    html += '</table>';
    res.send(html);
  } catch (e) {
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
