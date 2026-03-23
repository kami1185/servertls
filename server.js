const express = require('express');

app.use(express.static('/home/ubuntu/servertls'));

const path = require('path');
const app = express();

// Entregar el HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
