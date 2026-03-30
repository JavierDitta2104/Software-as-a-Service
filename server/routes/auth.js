const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateDemoData } = require('../utils/demoData');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/mailer');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'agilflow_secret_key_12345';
const { auth } = require('../middleware/auth');

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode(6);
        const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user = new User({ 
            name, 
            email, 
            password, 
            role, 
            verificationCode, 
            verificationCodeExpires,
            isVerified: false 
        });
        
        await user.save();

        // ✅ Siempre loguear el código en la consola (útil en desarrollo)
        console.log('\n' + '='.repeat(50));
        console.log('📧 CÓDIGO DE VERIFICACIÓN');
        console.log('='.repeat(50));
        console.log(`   Para: ${email}`);
        console.log(`   Código: ${verificationCode}`);
        console.log('='.repeat(50) + '\n');

        // Send Email (optional, may fail in dev)
        try {
            await sendVerificationEmail(email, verificationCode);
        } catch (mailError) {
            console.warn('⚠️  Email no pudo enviarse:', mailError.message);
        }

        res.status(201).json({ message: 'Usuario registrado. Por favor verifica tu correo electrónico.' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ 
            email, 
            verificationCode: code.toUpperCase(),
            verificationCodeExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ message: 'Código inválido o expirado' });
        }

        // Mark as verified and clear code
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        // Generate demo data for new user
        await generateDemoData(user._id);

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Por favor verifica tu correo electrónico antes de iniciar sesión' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
