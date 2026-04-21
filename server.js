const express = require('express');
// jwt
const jwt = require('jsonwebtoken');
const path = require('path');

// 2FA
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const app = express();

app.use(express.json()); // Para poder leer JSON en el body de las peticiones

// leer los archivos js y css
app.use(express.static(__dirname));

const SECRET_KEY = "mi_clave_super_secreta_123"; // En producción usa variables de entorno (.env)

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (!token) return res.status(401).json({ error: "Acceso denegado. No hay token." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido o expirado." });
        req.user = user; // Guardamos los datos del usuario en la petición
        next();
    });
};

// Entregar el HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login simulado: Genera un token
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Simulación de base de datos
    if (username === "admin" && password === "1234") {
        const user = { name: username, role: 'admin' };
        const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    } 
    
    res.status(401).json({ error: "Credenciales incorrectas" });
});

// --- RUTA PROTEGIDA (AUTORIZACIÓN) ---
app.get('/api/admin-only', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "No tienes permisos de Administrador" });
    }
    res.json({ mensaje: "¡Bienvenido, Administrador! Aquí están los datos sensibles." });
});


/************ 2FA (Autenticación de dos factores) */

// 1. Ruta para CONFIGURAR 2FA (Genera el QR)
app.post('/api/2fa/setup', authenticateToken, (req, res) => {
    // Generamos un secreto único para el usuario
    const secret = speakeasy.generateSecret({
        name: `MiAppSegura (${req.user.name})`
    });

    // En una app real, guardarías 'secret.base32' en tu base de datos para este usuario
    // Por ahora, lo enviamos al frontend para generar el QR
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        res.json({
            qrCode: data_url,
            secret: secret.base32 // ¡Cuidado! Solo para fines educativos
        });
    });
});

// 2. Ruta para VERIFICAR el código de 6 dígitos
app.post('/api/2fa/verify', authenticateToken, (req, res) => {
    const { token, secret } = req.body; // El 'token' es el número de 6 dígitos de la App

    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Permite un margen de error de 30 segundos (antes/después)
    });

    if (verified) {
        res.json({ success: true, mensaje: "✅ Segundo factor verificado correctamente" });
    } else {
        res.status(400).json({ success: false, mensaje: "❌ Código incorrecto" });
    }
});

// API
app.get('/api/status', (req, res) => {
    res.json({
        mensaje: "MEnsaje probando tls y nginx",
        protocolo_interno: "HTTP",
        protocolo_externo: "HTTPS (TLS 1.3)"
    });
});

// Escuchamos en el puerto 3000 (puerto interno)
app.listen(3000, () => {
    console.log('🚀 Backend escuchando en puerto 3000');
});
