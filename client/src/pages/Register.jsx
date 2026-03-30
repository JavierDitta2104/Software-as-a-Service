import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const Register = ({ setToken }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await authService.register({ name, email, password });
            // Redirect to verify email instead of logging in
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Error en el registro');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="glass" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>AgilFlow</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>Crea tu cuenta gratuita.</p>

                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nombre Completo</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="btn-primary" style={{ width: '100%' }} type="submit">Registrarse</button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                ¿Ya tienes una cuenta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Inicia sesión</Link>
            </p>
        </div>
        </div >
    );
};

export default Register;
