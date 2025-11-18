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
        // Note: We use lowercase 'fullname' to avoid quoting issues in Postgres
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                login TEXT UNIQUE NOT NULL,
                fullname TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
            );
        `);
        
        const res = await client.query('SELECT 1 FROM users;');
        if (res.rowCount === 0) {
            console.log('Seeding users table...');
            const initialUsers = [
                { login: 'admin', fullName: 'Адміністратор', password: 'Admin2025!', role: 'admin' },
                { login: 'Gomba', fullName: 'Гомба Ю.В.', password: 'Gomba2025!', role: 'user' },
                { login: 'Dan', fullName: 'Дан Т.О.', password: 'Dan2025!', role: 'user' },
                { login: 'Snietkov', fullName: 'Снєтков С.Ю.', password: 'Snietkov2025!', role: 'user' }
            ];
            for (const user of initialUsers) {
                await client.query(
                    'INSERT INTO users (login, fullname, password, role) VALUES ($1, $2, $3, $4)',
                    [user.login, user.fullName, user.password, user.role]
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

// Ensure the activity table exists
async function ensureActivityTable() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS active_users (
                login TEXT PRIMARY KEY,
                fullname TEXT NOT NULL,
                last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
    } catch (error) {
        console.error('Error ensuring activity table exists:', error);
    } finally {
        client.release();
    }
}

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
        // Use lowercase column names
        const result = await client.query('SELECT id, login, fullname, password, role FROM users WHERE login = $1', [login]);
        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Неправильний логін або пароль' });
        }
        const user = result.rows[0];
        if (user.password === password) {
            // Map lowercase 'fullname' from DB to 'fullName' for frontend
            res.json({ success: true, user: { login: user.login, fullName: user.fullname, role: user.role } });
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

app.get('/api/users', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, login, fullname, password, role FROM users ORDER BY login ASC');
        // Map db rows to frontend structure
        const users = result.rows.map(row => ({
            id: row.id,
            login: row.login,
            fullName: row.fullname,
            password: row.password,
            role: row.role
        }));
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    } finally {
        client.release();
    }
});

app.post('/api/users', async (req, res) => {
    const { login, fullName, password, role } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO users (login, fullname, password, role) VALUES ($1, $2, $3, $4) RETURNING id, login, fullname, password, role',
            [login, fullName, password, role]
        );
        const row = result.rows[0];
        res.status(201).json({
            id: row.id,
            login: row.login,
            fullName: row.fullname,
            password: row.password,
            role: row.role
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    } finally {
        client.release();
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { login, fullName, password, role } = req.body;
    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE users SET login = $1, fullname = $2, password = $3, role = $4 WHERE id = $5 RETURNING id, login, fullname, password, role',
            [login, fullName, password, role, id]
        );
        const row = result.rows[0];
        res.json({
            id: row.id,
            login: row.login,
            fullName: row.fullname,
            password: row.password,
            role: row.role
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    } finally {
        client.release();
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    } finally {
        client.release();
    }
});

// --- User Activity API ---
app.post('/api/activity/heartbeat', async (req, res) => {
    const { login, fullName } = req.body;
    if (login && fullName) {
        const client = await pool.connect();
        try {
            await client.query(`
                INSERT INTO active_users (login, fullname, last_seen)
                VALUES ($1, $2, NOW())
                ON CONFLICT (login)
                DO UPDATE SET last_seen = NOW(), fullname = $2;
            `, [login, fullName]);
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Heartbeat DB error:', error);
            res.status(500).json({ error: 'Server error during heartbeat' });
        } finally {
            client.release();
        }
    } else {
        res.status(400).json({ error: 'Login and fullName are required' });
    }
});

app.get('/api/activity/active-users', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT fullname FROM active_users WHERE last_seen > NOW() - INTERVAL '1 minute'`
        );
        // Map rows back to simple array of names
        const activeFullNames = result.rows.map(row => row.fullname);
        res.json(activeFullNames);
    } catch (error) {
        console.error('Get active users DB error:', error);
        res.status(500).json({ error: 'Server error getting active users' });
    } finally {
        client.release();
    }
});

// Cleanup inactive users periodically from DB
setInterval(async () => {
    const client = await pool.connect();
    try {
        // Remove users not seen in the last 5 minutes
        await client.query("DELETE FROM active_users WHERE last_seen < NOW() - INTERVAL '5 minutes'");
    } catch (error) {
        console.error('Error cleaning up inactive users:', error);
    } finally {
        client.release();
    }
}, 60000); // Run every minute

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, async () => {
    // We try to ensure tables exist on startup. 
    // We don't await them blocking the listen, but we log errors.
    await ensureDbTable();
    await ensureUsersTable();
    await ensureActivityTable();
    console.log(`Backend server running on http://localhost:${PORT}`);
});
