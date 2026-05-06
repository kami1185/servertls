// Variable global temporal (sustituye a la DB por ahora)
let temp2FASecret = "";

// 1. Generar el QR
async function configurar2FA() {
    const token = localStorage.getItem('token');
    if (!token) return alert("Primero inicia sesión");

    try {
        const response = await fetch('/api/2fa/setup', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        // Guardamos el secreto en memoria para la verificación posterior
        temp2FASecret = data.secret;

        // Mostramos el QR en el contenedor del HTML
        const qrContainer = document.getElementById('qr-container');
        qrContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code" style="border: 5px solid white; border-radius: 10px;">`;
        
        //console.log("Secreto temporal:", temp2FASecret);
    } catch (error) {
        console.error("Error al configurar 2FA:", error);
    }
}

// 2. Verificar el código de 6 dígitos
async function verificar2FA() {
    const token = localStorage.getItem('token');
    const codigo = document.getElementById('codigo2fa').value;

    if (!temp2FASecret) return alert("Primero genera el código QR");

    try {
        const response = await fetch('/api/2fa/verify', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                token: codigo, 
                secret: temp2FASecret 
            })
        });

        const data = await response.json();
        const resultadoDiv = document.getElementById('resultado');

        if (data.success) {
            resultadoDiv.innerHTML = `<span style="color: green;">${data.mensaje}</span>`;
            resultadoDiv.parentElement.style.backgroundColor = "#d4edda";
        } else {
            resultadoDiv.innerHTML = `<span style="color: red;">${data.mensaje}</span>`;
            resultadoDiv.parentElement.style.backgroundColor = "#f8d7da";
        }
    } catch (error) {
        alert("Error en la verificación");
    }
}

document.getElementById('btn2FA').addEventListener('click', configurar2FA);
document.getElementById('verificar2FA').addEventListener('click', configurar2FA);