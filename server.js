import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Ensure db.json exists
async function ensureDb() {
    try {
        await fs.access(DB_FILE);
    } catch (error) {
        await fs.writeFile(DB_FILE, '{}', 'utf8');
    }
}

app.get('/api/data', async (req, res) => {
    await ensureDb();
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        res.json(JSON.parse(data || '{}'));
    } catch (error) {
        console.error('Error reading DB:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/data', async (req, res) => {
    await ensureDb();
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing DB:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});