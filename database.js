const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDB() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    // Creamos la tabla si no existe
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            twofa_secret TEXT
        )
    `);

    // await db.exec(`
    //     CREATE TABLE IF NOT EXISTS users (
    //         id INTEGER PRIMARY KEY AUTOINCREMENT,
    //         username TEXT UNIQUE,
    //         password_hash TEXT,
    //         twofa_secret TEXT,
    //         role TEXT DEFAULT 'user' -- Roles: 'admin' o 'user'
    //     )
    // `);

    return db;
}

module.exports = { setupDB };