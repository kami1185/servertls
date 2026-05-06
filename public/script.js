let miToken = "";
const displayResultado = document.getElementById('resultado');

// Función para Login
async function login() {
    // 1. Obtener valores de los inputs
    const userVal = document.getElementById('username').value;
    const passVal = document.getElementById('password').value;
    const displayResultado = document.getElementById('resultado');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userVal, password: passVal })
        });
        
        const data = await res.json();
        
        if (data.token) {
            // 2. Guardar token para futuras peticiones (2FA y Datos Secretos)
            localStorage.setItem('token', data.token);
            
            displayResultado.innerText = "✅ ¡Login exitoso! Configure su 2FA para continuar.";
            displayResultado.style.color = "#28a745";
            displayResultado.parentElement.style.backgroundColor = "#d4edda";

            // 3. MOSTRAR LA SECCIÓN DE 2FA
            const section2FA = document.getElementById('section-2fa');
            if (section2FA) {
                section2FA.style.display = 'block';
            }

        } else {
            displayResultado.innerText = `❌ Error: ${data.error || 'Credenciales inválidas'}`;
            displayResultado.style.color = "#dc3545";
            displayResultado.parentElement.style.backgroundColor = "#f8d7da";
        }
    } catch (error) {
        displayResultado.innerText = "⚠️ Error de conexión con el servidor.";
        displayResultado.style.color = "#dc3545";
    }
}

// Función para ver el secreto
async function verSecreto() {
    // if (!miToken) {
    //     displayResultado.innerText = "🔒 Error: Primero debes iniciar sesión.";
    //     displayResultado.style.color = "#dc3545";
    //     return;
    // }

    const token = localStorage.getItem('token');
    if (!token) {
        displayResultado.innerText = "🔒 Error: Primero debes iniciar sesión.";
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

// Función para listar usuarios (VULNERABLE A XSS)
async function listarUsuarios() {
    const token = localStorage.getItem('token');
    const listaUL = document.getElementById('lista-usuarios');
    listaUL.innerHTML = ""; 

    try {
        const res = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usuarios = await res.json();

        usuarios.forEach(user => {
            const li = document.createElement('li');
            // USO DE innerHTML: ESTO ES LO QUE HACE QUE EL XSS FUNCIONE
            li.innerHTML = `ID: ${user.id} - Usuario: <b>${user.username}</b>`;
            listaUL.appendChild(li);
        });
    } catch (error) {
        console.error("Error al listar:", error);
    }
}

// Asignación de eventos a los botones
document.getElementById('btnLogin').addEventListener('click', login);
document.getElementById('btnSecret').addEventListener('click', verSecreto);
document.getElementById('btnListar').addEventListener('click', listarUsuarios);
