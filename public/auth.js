let temporalSecret = ""; // Guardamos el secreto para la prueba

    async function configurar2FA() {
        const res = await fetch('/api/2fa/setup', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${miToken}` }
        });
        const data = await res.json();
        temporalSecret = data.secret;
        document.getElementById('qr-container').innerHTML = `<img src="${data.qrCode}">`;
    }

    async function verificar2FA() {
        const token = document.getElementById('codigo2fa').value;
        const res = await fetch('/api/2fa/verify', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${miToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, secret: temporalSecret })
        });
        const data = await res.json();
        alert(data.mensaje);
    }