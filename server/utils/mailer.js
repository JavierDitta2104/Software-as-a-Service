const https = require('https');

/**
 * Generates a random alphanumeric code of specified length.
 * @param {number} length 
 * @returns {string}
 */
const generateVerificationCode = (length = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid O, 0, I, 1 for clarity
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Sends a verification email using Brevo REST API (no SMTP needed).
 * @param {string} to - Recipient email
 * @param {string} code - Verification code
 */
const sendVerificationEmail = async (to, code) => {
    // ✅ Always log to console for development visibility
    console.log('\n' + '='.repeat(50));
    console.log('📧 CÓDIGO DE VERIFICACIÓN');
    console.log('='.repeat(50));
    console.log(`   Para: ${to}`);
    console.log(`   Código: ${code}`);
    console.log('='.repeat(50) + '\n');

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.warn('⚠️  BREVO_API_KEY no configurada. El correo no se enviará.');
        return;
    }

    const payload = JSON.stringify({
        sender: {
            name: 'AgilFlow',
            email: process.env.EMAIL_FROM_ADDRESS || 'javieralfonsoperezditta064@gmail.com'
        },
        to: [{ email: to }],
        subject: 'Verifica tu cuenta de AgilFlow',
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #6366f1;">¡Bienvenido a AgilFlow!</h2>
                <p>Para activar tu cuenta, por favor ingresa el siguiente código de verificación:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 20px 0;">
                    ${code}
                </div>
                <p>Este código tiene una duración de <strong>10 minutos</strong> y puede ser usado una sola vez.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #9ca3af;">Si no solicitaste este registro, por favor ignora este correo.</p>
            </div>
        `
    });

    const options = {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(payload)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Correo enviado exitosamente vía Brevo API\n');
                    resolve();
                } else {
                    const parsed = JSON.parse(data);
                    console.warn('⚠️  Brevo error:', parsed.message || data);
                    resolve(); // Don't reject — code was already logged
                }
            });
        });
        req.on('error', (err) => {
            console.warn('⚠️  Error de red al enviar correo:', err.message);
            resolve(); // Don't reject — code was already logged
        });
        req.write(payload);
        req.end();
    });
};

module.exports = {
    generateVerificationCode,
    sendVerificationEmail
};
