const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Testing SMTP connection...');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('Pass prefix:', process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 15) + '...' : 'NOT SET');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error('\n❌ Error de conexión:', error.message);
    } else {
        console.log('\n✅ Conexión SMTP exitosa! El servidor está listo para enviar correos.');
    }
});
