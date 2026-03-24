let miToken = "";
const displayResultado = document.getElementById('resultado');

// Función para Login
async function login() {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '1234' })
        });
        
        const data = await res.json();
        
        if (data.token) {
            miToken = data.token;
            displayResultado.innerText = "✅ ¡Login exitoso! Token obtenido.";
            displayResultado.style.color = "#28a745";
        } else {
            displayResultado.innerText = "❌ Error: Credenciales inválidas";
            displayResultado.style.color = "#dc3545";
        }
    } catch (error) {
        displayResultado.innerText = "⚠️ Error de conexión con el servidor.";
        displayResultado.style.color = "#dc3545";
    }
}

// Función para ver el secreto
async function verSecreto() {
    if (!miToken) {
        displayResultado.innerText = "🔒 Error: Primero debes iniciar sesión.";
        displayResultado.style.color = "#dc3545";
        return;
    }

    try {
        const res = await fetch('/api/admin-only', {
            headers: { 'Authorization': `Bearer ${miToken}` }
        });
        
        const data = await res.json();
        displayResultado.innerText = JSON.stringify(data, null, 2);
        displayResultado.style.color = "#333";
    } catch (error) {
        displayResultado.innerText = "⚠️ Error al obtener datos.";
    }
}

// Asignación de eventos a los botones
document.getElementById('btnLogin').addEventListener('click', login);
document.getElementById('btnSecret').addEventListener('click', verSecreto);