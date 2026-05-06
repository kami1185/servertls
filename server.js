const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const bcrypt = require('bcryptjs');
const { setupDB } = require('./database'); // Importamos la conexión
const helmet = require('helmet');
const xss = require('xss');

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Permitimos scripts de nuestro servidor y 'unsafe-inline' para que tus botones funcionen
            // Si quitas 'unsafe-inline', el ataque XSS inyectado se bloquea totalmente.
            // scriptSrc: ["'self'", "'unsafe-inline'"], 
            scriptSrc: ["'self'"], 
            // Permitimos que las imágenes (como el QR) y la conexión a Webhook funcionen
            imgSrc: ["'self'", "data:", "https://webhook.site"],
            connectSrc: ["'self'", "https://webhook.site"],
        },
    },
    // Protección contra Clickjacking
    frameguard: { action: 'deny' } 
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SECRET_KEY = "mi_clave_super_secreta_123"; 

let db;
// Inicializar Base de Datos al arrancar
setupDB().then(database => {
    db = database;
    console.log('🗄️ Base de datos SQLite conectada y persistente');
});

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No hay token" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

// --- RUTAS DE AUTENTICACIÓN CON DB ---

// 1. Registro 
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    const cleanUsername = xss(username);

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [cleanUsername, hashedPassword]);
        res.json({ mensaje: "✅ Usuario registrado con éxito" });
    } catch (e) {
        res.status(400).json({ error: "El usuario ya existe" });
    }
});

// 2. Login validando contra SQLite
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    // const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    const user = await db.get(`SELECT * FROM users WHERE username = '${username}'`);

    if (user && await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign({ name: user.username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ 
            token, 
            has2FA: !!user.twofa_secret // Informamos si ya tiene 2FA configurado
        });
    } 
    res.status(401).json({ error: "Credenciales incorrectas" });
});

// --- 2FA (CONFIGURACIÓN Y VERIFICACIÓN) ---

app.post('/api/2fa/setup', authenticateToken, (req, res) => {
    const secret = speakeasy.generateSecret({ name: `SeguridadTLS (${req.user.name})` });
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        res.json({ qrCode: data_url, secret: secret.base32 });
    });
});

app.post('/api/2fa/verify', authenticateToken, async (req, res) => {
    const { token, secret } = req.body;
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1
    });

    if (verified) {
        // GUARDAR EL SECRETO EN LA DB (Persistencia real)
        await db.run('UPDATE users SET twofa_secret = ? WHERE username = ?', [secret, req.user.name]);
        res.json({ success: true, mensaje: "✅ 2FA activado permanentemente" });
    } else {
        res.status(400).json({ success: false, mensaje: "❌ Código incorrecto" });
    }
});

// --- API STATUS ---
app.get('/api/status', (req, res) => {
    res.json({
        mensaje: "Servidor con SQLite y Persistencia",
        protocolo_externo: "HTTPS (TLS 1.3)"
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ---- Pruebas -----
app.get('/api/user/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    try {
        // USO DE ? PARA EVITAR SQL INJECTION
        // const user = await db.get('SELECT id, username, role FROM users WHERE id = ?', [userId]); // seguro
        const user = await db.get(`SELECT * FROM users WHERE id = ${userId}`);
        // await db.exec(`SELECT * FROM users WHERE id = ${userId}`); // db.exec inseguro
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(user);

        // const firstUser = await db.get('SELECT id, username FROM users ORDER BY id ASC LIMIT 1');
        // if (!firstUser) {
        //     return res.status(404).json({ error: "No hay usuarios en la base de datos" });
        // }
        // res.json({
        //     message: "Primer usuario encontrado",
        //     user: firstUser
        // });
    } catch (error) {
        console.error(error); // Esto se verá en la terminal de Linux/EC2
    res.status(500).json({ 
        error: "Error en consultar la base de datos", 
        details: error.message // <--- Esto te dirá si falta una columna o hay un fallo de sintaxis
    });
    }
});

// Endpoint para obtener todos los usuarios (para la demo de XSS)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await db.all('SELECT id, username FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

// ---- Iniciar el server

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});