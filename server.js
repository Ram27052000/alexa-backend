const express = require('express');
const app = express();
const sqLite = require('sqlite3').verbose();

app.use(express.json());

const db = new sqLite.Database('./German.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_number INTEGER NOT NULL,
            section TEXT,
            type TEXT,
            description TEXT,
            mistakes TEXT,
            done BOOLEAN DEFAULT 0,
            date TEXT NOT NULL,
            completed_at DATETIME
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Database table ready');
        }
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.get('/german/tasks', (req, res) => {
    db.all('SELECT * FROM lessons', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ lessons: rows, count: rows.length });
        }
    });
});

app.post('/german/tasks', (req, res) => {
    const { lesson_number, section, type, description, mistakes, done, date, completed_at } = req.body;
    db.run(`INSERT INTO lessons (lesson_number, section, type, description, mistakes, done, date, completed_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lesson_number, section, type, description, mistakes, done, date, completed_at],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID });
            }
        }
    );
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});