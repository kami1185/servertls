const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
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
