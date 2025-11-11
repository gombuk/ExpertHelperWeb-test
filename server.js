import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file for local development
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Use the DATABASE_URL from environment variables, provided by Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure the database table exists
async function ensureDbTable() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_data (
                id INT PRIMARY KEY,
                data JSONB
            );
        `);
        // Check if the initial row exists, if not, create it with an empty object
        const res = await client.query('SELECT 1 FROM app_data WHERE id = 1;');
        if (res.rowCount === 0) {
            await client.query('INSERT INTO app_data (id, data) VALUES (1, \'{}\');');
        }
    } catch (error) {
        console.error('Error ensuring database table exists:', error);
    } finally {
        client.release();
    }
}

app.get('/api/data', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT data FROM app_data WHERE id = 1;');
        res.json(result.rows[0]?.data || {});
    } catch (error) {
        console.error('Error reading from DB:', error);
        res.status(500).json({ error: 'Failed to read data' });
    } finally {
        client.release();
    }
});

app.post('/api/data', async (req, res) => {
    const client = await pool.connect();
    try {
        const dataToSave = JSON.stringify(req.body);
        // Use an "UPSERT" operation: update the row if it exists, or insert it if it doesn't.
        await client.query(`
            INSERT INTO app_data (id, data) 
            VALUES (1, $1) 
            ON CONFLICT (id) 
            DO UPDATE SET data = $1;
        `, [dataToSave]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing to DB:', error);
        res.status(500).json({ error: 'Failed to save data' });
    } finally {
        client.release();
    }
});

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    ensureDbTable();
    console.log(`Backend server running on http://localhost:${PORT}`);
});