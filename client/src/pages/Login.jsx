import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const Login = ({ setToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await authService.login({ email, password });
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Credenciales inválidas');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="glass" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>AgilFlow</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>Bienvenido, inicia sesión.</p>
                
                {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="btn-primary" style={{ width: '100%' }} type="submit">Iniciar Sesión</button>
                </form>
                
                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    ¿No tienes una cuenta? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Regístrate</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
