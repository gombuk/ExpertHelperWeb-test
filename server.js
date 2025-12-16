
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { exportToGoogleSheets, importFromGoogleSheets } from './googleSheetsService.js';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// --- In-Memory Storage (Fallback) ---
let useInMemoryDb = false;
const inMemoryStore = {
    appData: {},
    users: [
        { id: 1, login: 'admin', fullname: 'Адміністратор', password: 'Admin2025!', role: 'admin' },
        { id: 2, login: 'Gomba', fullname: 'Гомба Ю.В.', password: 'Gomba2025!', role: 'user' },
        { id: 3, login: 'Dan', fullname: 'Дан Т.О.', password: 'Dan2025!', role: 'user' },
        { id: 4, login: 'Snietkov', fullname: 'Снєтков С.Ю.', password: 'Snietkov2025!', role: 'user' }
    ],
    activeUsers: new Map() // login -> { fullname, last_seen }
};

// --- Database Connection ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000, 
});

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Helper to safely release client
const safeRelease = (client) => {
    if (client) {
        try {
            client.release();
        } catch (e) {
            console.error('Error releasing client', e);
        }
    }
};

// Check DB connection on startup
async function checkDbConnection() {
    let client;
    try {
        console.log("Attempting to connect to PostgreSQL...");
        client = await pool.connect();
        console.log("✅ Database connected successfully.");
        useInMemoryDb = false;
        
        // Initialize tables only if connected
        await ensureDbTable(client);
        await ensureUsersTable(client);
        await ensureActivityTable(client);
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        console.warn("⚠️  SWITCHING TO IN-MEMORY MODE. Data will not persist after restart.");
        useInMemoryDb = true;
    } finally {
        safeRelease(client);
    }
}

async function ensureDbTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS app_data (
            id INT PRIMARY KEY,
            data JSONB
        );
    `);
    const res = await client.query('SELECT 1 FROM app_data WHERE id = 1;');
    if (res.rowCount === 0) {
        await client.query('INSERT INTO app_data (id, data) VALUES (1, \'{}\');');
    }
}

async function ensureUsersTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            login TEXT UNIQUE NOT NULL,
            fullname TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user'
        );
    `);
    
    // Attempt migration
    try { await client.query('ALTER TABLE users RENAME COLUMN "fullName" TO fullname'); } catch (e) {}

    const res = await client.query('SELECT 1 FROM users;');
    if (res.rowCount === 0) {
        console.log('Seeding users table...');
        for (const user of inMemoryStore.users) {
            await client.query(
                'INSERT INTO users (login, fullname, password, role) VALUES ($1, $2, $3, $4)',
                [user.login, user.fullname, user.password, user.role]
            );
        }
    }
}

async function ensureActivityTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS active_users (
            login TEXT PRIMARY KEY,
            fullname TEXT NOT NULL,
            last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}


// --- Main Data API ---
app.get('/api/data', async (req, res) => {
    if (useInMemoryDb) {
        return res.json(inMemoryStore.appData || {});
    }

    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT data FROM app_data WHERE id = 1;');
        const data = result.rows[0]?.data || {};
        res.json(data);
    } catch (error) {
        console.error('Error reading from DB, switching to memory:', error.message);
        useInMemoryDb = true; // Failover
        res.json(inMemoryStore.appData || {});
    } finally {
        safeRelease(client);
    }
});

app.post('/api/data', async (req, res) => {
    // Update memory cache
    inMemoryStore.appData = req.body;

    // Non-blocking sync to Google Sheets (works in both modes)
    exportToGoogleSheets(req.body).catch(err => console.error("Auto-sync to Google failed:", err));

    if (useInMemoryDb) {
        return res.json({ success: true, mode: 'memory' });
    }

    let client;
    try {
        client = await pool.connect();
        const dataToSave = JSON.stringify(req.body);
        await client.query(`
            INSERT INTO app_data (id, data) 
            VALUES (1, $1) 
            ON CONFLICT (id) 
            DO UPDATE SET data = $1;
        `, [dataToSave]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error writing to DB:', error.message);
        res.json({ success: true, mode: 'memory_fallback' }); // Don't fail the request
    } finally {
        safeRelease(client);
    }
});

// --- Google Sheets Sync Endpoint (Manual Pull) ---
app.post('/api/sync/google-import', async (req, res) => {
    try {
        const currentData = useInMemoryDb ? inMemoryStore.appData : await (async () => {
            let client;
            try {
                client = await pool.connect();
                const r = await client.query('SELECT data FROM app_data WHERE id = 1;');
                return r.rows[0]?.data || {};
            } catch (e) {
                return inMemoryStore.appData;
            } finally {
                safeRelease(client);
            }
        })();

        // Perform Import
        const newData = await importFromGoogleSheets(currentData);
        
        if (!newData) {
            return res.status(500).json({ error: 'Failed to fetch from Google Sheets. Check configuration.' });
        }

        // --- SAFETY CHECK ---
        // If we have local data, but remote data is empty, DO NOT overwrite.
        const hasLocalData = (currentData.conclusions?.records?.length > 0 || currentData.certificates?.records?.length > 0);
        const hasRemoteData = (newData.conclusions?.records?.length > 0 || newData.certificates?.records?.length > 0);

        if (hasLocalData && !hasRemoteData) {
             console.warn("Sync aborted: Google Sheet is empty, but local data exists.");
             // We return success: false but with a specific error to show in frontend if possible, 
             // but here we just throw 500 to stop the UI from updating.
             return res.status(400).json({ error: 'ЗАХИСТ: Google Таблиця порожня, а в програмі є дані. Синхронізацію скасовано, щоб не видалити вашу роботу. Перевірте підключення до таблиці.' });
        }
        // --------------------

        // Save back
        inMemoryStore.appData = newData; // Update memory
        
        if (!useInMemoryDb) {
            let client;
            try {
                client = await pool.connect();
                await client.query(`
                    INSERT INTO app_data (id, data) VALUES (1, $1) 
                    ON CONFLICT (id) DO UPDATE SET data = $1;
                `, [JSON.stringify(newData)]);
            } catch (e) {
                console.error("DB save failed during sync:", e);
            } finally {
                safeRelease(client);
            }
        }

        res.json({ success: true, data: newData });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message || 'Sync failed' });
    }
});


// --- User & Auth API ---
app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Логін та пароль обов\'язкові' });

    const checkCredentials = (userList) => {
        const user = userList.find(u => u.login === login);
        if (user && user.password === password) {
            return { success: true, user: { login: user.login, fullName: user.fullname, role: user.role } };
        }
        return null;
    };

    if (useInMemoryDb) {
        const result = checkCredentials(inMemoryStore.users);
        if (result) return res.json(result);
        return res.status(401).json({ error: 'Неправильний логін або пароль' });
    }

    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT id, login, fullname, password, role FROM users WHERE login = $1', [login]);
        const user = result.rows[0];
        if (user && user.password === password) {
            res.json({ success: true, user: { login: user.login, fullName: user.fullname, role: user.role } });
        } else {
            res.status(401).json({ error: 'Неправильний логін або пароль' });
        }
    } catch (error) {
        console.error('Login DB error, using memory:', error.message);
        useInMemoryDb = true;
        const fallback = checkCredentials(inMemoryStore.users);
        if (fallback) return res.json(fallback);
        res.status(401).json({ error: 'Неправильний логін або пароль (Fallback)' });
    } finally {
        safeRelease(client);
    }
});

app.get('/api/users', async (req, res) => {
    if (useInMemoryDb) {
        return res.json(inMemoryStore.users.map(u => ({...u, fullName: u.fullname})));
    }
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT id, login, fullname, password, role FROM users ORDER BY login ASC');
        res.json(result.rows.map(row => ({
            id: row.id, login: row.login, fullName: row.fullname, password: row.password, role: row.role
        })));
    } catch (error) {
        console.error('Fetch users error:', error);
        res.json(inMemoryStore.users.map(u => ({...u, fullName: u.fullname})));
    } finally {
        safeRelease(client);
    }
});

app.post('/api/users', async (req, res) => {
    const { login, fullName, password, role } = req.body;
    
    if (useInMemoryDb) {
        const newUser = { id: Date.now(), login, fullname: fullName, password, role };
        inMemoryStore.users.push(newUser);
        return res.status(201).json({ ...newUser, fullName: newUser.fullname });
    }

    let client;
    try {
        client = await pool.connect();
        const result = await client.query(
            'INSERT INTO users (login, fullname, password, role) VALUES ($1, $2, $3, $4) RETURNING id, login, fullname, password, role',
            [login, fullName, password, role]
        );
        const row = result.rows[0];
        res.status(201).json({ id: row.id, login: row.login, fullName: row.fullname, password: row.password, role: row.role });
    } catch (error) {
        console.error('Create user error:', error);
        const newUser = { id: Date.now(), login, fullname: fullName, password, role };
        inMemoryStore.users.push(newUser);
        res.status(201).json({ ...newUser, fullName: newUser.fullname });
    } finally {
        safeRelease(client);
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { login, fullName, password, role } = req.body;

    if (useInMemoryDb) {
        const idx = inMemoryStore.users.findIndex(u => u.id == id);
        if (idx !== -1) {
            inMemoryStore.users[idx] = { ...inMemoryStore.users[idx], login, fullname: fullName, password, role };
            const u = inMemoryStore.users[idx];
            return res.json({ id: u.id, login: u.login, fullName: u.fullname, password: u.password, role: u.role });
        }
        return res.status(404).json({error: 'User not found'});
    }

    let client;
    try {
        client = await pool.connect();
        const result = await client.query(
            'UPDATE users SET login = $1, fullname = $2, password = $3, role = $4 WHERE id = $5 RETURNING id, login, fullname, password, role',
            [login, fullName, password, role, id]
        );
        const row = result.rows[0];
        res.json({ id: row.id, login: row.login, fullName: row.fullname, password: row.password, role: row.role });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    } finally {
        safeRelease(client);
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    
    if (useInMemoryDb) {
        inMemoryStore.users = inMemoryStore.users.filter(u => u.id != id);
        return res.status(204).send();
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    } finally {
        safeRelease(client);
    }
});

// --- User Activity API ---
app.post('/api/activity/heartbeat', async (req, res) => {
    const { login, fullName } = req.body;
    if (!login) return res.status(400).json({ error: 'Login required' });

    // Update in memory always for speed
    inMemoryStore.activeUsers.set(login, { fullname: fullName, last_seen: new Date() });

    if (!useInMemoryDb) {
        let client;
        try {
            client = await pool.connect();
            await client.query(`
                INSERT INTO active_users (login, fullname, last_seen)
                VALUES ($1, $2, NOW())
                ON CONFLICT (login)
                DO UPDATE SET last_seen = NOW(), fullname = $2;
            `, [login, fullName]);
        } catch (error) {
            // silent fail for heartbeat
        } finally {
            safeRelease(client);
        }
    }
    res.json({ success: true });
});

app.get('/api/activity/active-users', async (req, res) => {
    // Clean up memory
    const now = new Date();
    for (const [login, data] of inMemoryStore.activeUsers.entries()) {
        if (now - data.last_seen > 60000) inMemoryStore.activeUsers.delete(login);
    }

    if (useInMemoryDb) {
        return res.json(Array.from(inMemoryStore.activeUsers.values()).map(u => u.fullname));
    }

    let client;
    try {
        client = await pool.connect();
        const result = await client.query(
            `SELECT fullname FROM active_users WHERE last_seen > NOW() - INTERVAL '1 minute'`
        );
        res.json(result.rows.map(row => row.fullname));
    } catch (error) {
        // Fallback to memory if DB fails
        res.json(Array.from(inMemoryStore.activeUsers.values()).map(u => u.fullname));
    } finally {
        safeRelease(client);
    }
});

// --- Record Editing Focus API (In-Memory) ---
const editingRecords = new Map();

app.post('/api/activity/focus', (req, res) => {
    const { recordId, userFullName, isEditing } = req.body;
    if (!recordId || !userFullName) return res.status(400).json({ error: 'Missing data' });

    if (isEditing) {
        editingRecords.set(recordId, { userFullName, timestamp: Date.now() });
    } else {
        const current = editingRecords.get(recordId);
        if (current && current.userFullName === userFullName) {
            editingRecords.delete(recordId);
        }
    }
    res.json({ success: true });
});

app.get('/api/activity/focus', (req, res) => {
    const now = Date.now();
    for (const [id, data] of editingRecords.entries()) {
        if (now - data.timestamp > 300000) {
            editingRecords.delete(id);
        }
    }
    const activityList = Array.from(editingRecords.entries()).map(([id, data]) => ({
        recordId: Number(id),
        userFullName: data.userFullName,
        timestamp: data.timestamp
    }));
    res.json(activityList);
});

// Cleanup inactive users in DB
setInterval(async () => {
    if (useInMemoryDb) return;
    let client;
    try {
        client = await pool.connect();
        await client.query("DELETE FROM active_users WHERE last_seen < NOW() - INTERVAL '5 minutes'");
    } catch (error) {
        // ignore
    } finally {
        safeRelease(client);
    }
}, 60000);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
    console.log(`Backend server starting on port ${PORT}... (v0.0.4)`);
    await checkDbConnection();
    console.log(`Backend server initialized on http://localhost:${PORT}`);
});
