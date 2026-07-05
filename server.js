const express = require('express');
const app = express();
const Database = require('better-sqlite3');

app.use(express.json());

const db = new Database('./German.db');

try {
    db.exec(`
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
    `);
    console.log('Database table ready');
} catch (err) {
    console.error('Error creating table:', err.message);
}

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Get all lessons
app.get('/german/tasks', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM lessons').all();
        res.json({ lessons: rows, count: rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/german/tasks', (req, res) => {
    try {
        const { lesson_number, section, type, description, mistakes, done, date, completed_at } = req.body;

        const stmt = db.prepare(`
            INSERT INTO lessons (lesson_number, section, type, description, mistakes, done, date, completed_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(lesson_number, section, type, description, mistakes, done, date, completed_at);
        res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/suggest', (req, res) => {
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
    const missed = db.prepare(
        `SELECT * FROM lessons where date =? And done = 0`
    ).all(yesterday);

    let suggestion = ' ';
    if(missed.length > 0) {
        suggestion = `You missed ${missed[0].type} in lesson ${missed[0].lesson_number} yesterday. Do that first.`;
    }
    else{
        suggestion = `All caught up! Start a new lesson today.`;
    }
    res.json({ suggestion });
})

app.patch('/german/tasks/:id', (req, res) => {
    const { done } = req.body;
    db.prepare(
        `UPDATE lessons SET done = ?, completed_at = ? WHERE id = ?`
    ).run(done ? 1 : 0, new Date().toISOString(), req.params.id);
    res.json({ message: 'Task updated!' });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});