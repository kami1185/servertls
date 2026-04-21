const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

// --- CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
// Servimos la carpeta public para que local y Nginx encuentren los CSS/JS
app.use(express.static(path.join(__dirname, 'public')));

const SECRET_KEY = "mi_clave_super_secreta_123"; 

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Acceso denegado. No hay token." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido o expirado." });
        req.user = user;
        next();
    });
};

// --- RUTAS DE NAVEGACIÓN ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API DE AUTENTICACIÓN (LOGIN SIMULADO) ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Validación directa (sin base de datos)
    if (username === "admin" && password === "1234") {
        const payload = { name: username, role: 'admin' };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    } 
    
    res.status(401).json({ error: "Credenciales incorrectas" });
});

// --- RUTAS PROTEGIDAS ---
app.get('/api/admin-only', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "No tienes permisos" });
    }
    res.json({ mensaje: "¡Bienvenido! Accediendo a datos protegidos por TLS y JWT." });
});

// --- 2FA (AUTENTICACIÓN DE DOS FACTORES) ---
app.post('/api/2fa/setup', authenticateToken, (req, res) => {
    const secret = speakeasy.generateSecret({ name: `SeguridadTLS (${req.user.name})` });
    
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        res.json({ 
            qrCode: data_url, 
            secret: secret.base32 // Se envía al cliente para la verificación actual
        });
    });
});

app.post('/api/2fa/verify', authenticateToken, (req, res) => {
    const { token, secret } = req.body;

    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1
    });

    if (verified) {
        res.json({ success: true, mensaje: "✅ Segundo factor verificado correctamente" });
    } else {
        res.status(400).json({ success: false, mensaje: "❌ Código incorrecto" });
    }
});

// API STATUS
app.get('/api/status', (req, res) => {
    res.json({
        mensaje: "Servidor funcionando correctamente sin DB",
        protocolo_interno: "HTTP",
        protocolo_externo: "HTTPS (TLS 1.3)"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});