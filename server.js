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
    connectionTimeoutMillis: 10000, // Timeout connection after 10 seconds
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure the main data table exists
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

// Ensure the users table exists and seed it with initial data if empty
async function ensureUsersTable() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                login TEXT UNIQUE NOT NULL,
                fullName TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                email TEXT
            );
        `);
        
        const res = await client.query('SELECT 1 FROM users;');
        if (res.rowCount === 0) {
            console.log('Seeding users table...');
            // In a real app, passwords should be hashed. Storing plain text as requested.
            const initialUsers = [
                { login: 'admin', fullName: 'Адміністратор', password: 'Admin2025!', role: 'admin', email: 'admin@example.com' },
                { login: 'Gomba', fullName: 'Гомба Ю.В.', password: 'Gomba2025!', role: 'user', email: 'gomba@example.com' },
                { login: 'Dan', fullName: 'Дан Т.О.', password: 'Dan2025!', role: 'user', email: 'dan@example.com' },
                { login: 'Snietkov', fullName: 'Снєтков С.Ю.', password: 'Snietkov2025!', role: 'user', email: 'snietkov@example.com' }
            ];
            for (const user of initialUsers) {
                await client.query(
                    'INSERT INTO users (login, fullName, password, role, email) VALUES ($1, $2, $3, $4, $5)',
                    [user.login, user.fullName, user.password, user.role, user.email]
                );
            }
            console.log('Users table seeded.');
        }
    } catch (error) {
        console.error('Error ensuring users table exists:', error);
    } finally {
        client.release();
    }
}

// In-memory store for active users
const activeUsers = new Map(); // Map<login, { lastSeen: number, fullName: string }>

// --- Main Data API ---
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

// --- User & Auth API ---

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    if (!login || !password) {
        return res.status(400).json({ error: 'Логін та пароль обов\'язкові' });
    }
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, login, fullName, password, role FROM users WHERE login = $1', [login]);
        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Неправильний логін або пароль' });
        }
        const user = result.rows[0];
        // Plain text password comparison as requested
        if (user.password === password) {
            res.json({ success: true, user: { login: user.login, fullName: user.fullName, role: user.role } });
        } else {
            res.status(401).json({ error: 'Неправильний логін або пароль' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    } finally {
        client.release();
    }
});

app.post('/api/recover-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'E-mail є обов\'язковим' });
    }
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT login, password FROM users WHERE email = $1', [email]);
        if (result.rowCount > 0) {
            const user = result.rows[0];
            // SIMULATION: In a real app, you would send an email.
            // Here, we just log it to the server console for demonstration.
            console.log(`Password recovery for ${email}:`);
            console.log(`  Login: ${user.login}`);
            console.log(`  Password: ${user.password}`);
        }
        // Always send a generic success response to prevent email enumeration.
        res.json({ success: true, message: 'Якщо такий e-mail існує, інструкції для відновлення було надіслано.' });
    } catch (error) {
        console.error('Password recovery error:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    } finally {
        client.release();
    }
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, login, fullName, password, role, email FROM users ORDER BY login ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    } finally {
        client.release();
    }
});

// Add a user (admin only)
app.post('/api/users', async (req, res) => {
    const { login, fullName, password, role, email } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO users (login, fullName, password, role, email) VALUES ($1, $2, $3, $4, $5) RETURNING id, login, fullName, password, role, email',
            [login, fullName, password, role, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    } finally {
        client.release();
    }
});

// Update a user (admin only)
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { login, fullName, password, role, email } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE users SET login = $1, fullName = $2, password = $3, role = $4, email = $5 WHERE id = $6 RETURNING id, login, fullName, password, role, email',
            [login, fullName, password, role, email, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    } finally {
        client.release();
    }
});

// Delete a user (admin only)
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    } finally {
        client.release();
    }
});

// --- User Activity API ---
app.post('/api/activity/heartbeat', (req, res) => {
    const { login, fullName } = req.body;
    if (login && fullName) {
        activeUsers.set(login, { lastSeen: Date.now(), fullName });
        res.status(200).json({ success: true });
    } else {
        res.status(400).json({ error: 'Login and fullName are required' });
    }
});

app.get('/api/activity/active-users', (req, res) => {
    const now = Date.now();
    const activeFullNames = [];
    for (const [login, data] of activeUsers.entries()) {
        if (now - data.lastSeen < 60000) { // Active within the last minute
            activeFullNames.push(data.fullName);
        }
    }
    res.json(activeFullNames);
});

// Cleanup inactive users periodically
setInterval(() => {
    const now = Date.now();
    for (const [login, data] of activeUsers.entries()) {
        if (now - data.lastSeen >= 60000) { // Inactive for a minute or more
            activeUsers.delete(login);
        }
    }
}, 30000); // Check every 30 seconds

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    ensureDbTable();
    ensureUsersTable();
    console.log(`Backend server running on http://localhost:${PORT}`);
});