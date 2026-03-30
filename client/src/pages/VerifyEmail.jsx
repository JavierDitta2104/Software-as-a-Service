import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const VerifyEmail = ({ setToken }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const email = queryParams.get('email') || '';
    
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await authService.verifyEmail(email, code.trim().toUpperCase());
            const { token } = res.data;
            setToken(token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al verificar el código');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: 'var(--bg-dark)'
        }}>
            <div className="glass" style={{ width: '400px', padding: '2.5rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white' }}>Verifica tu Correo</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Hemos enviado un código alfanumérico a <strong>{email}</strong>. El código expira en 10 minutos.
                </p>

                {error && (
                    <div style={{ 
                        padding: '0.75rem', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid var(--danger)', 
                        color: 'var(--danger)', 
                        borderRadius: '0.5rem', 
                        marginBottom: '1.5rem',
                        fontSize: '0.85rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Código de Verificación</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Ej: A7B2X9"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={6}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px', textTransform: 'uppercase' }}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading || code.length < 6}
                    >
                        {loading ? 'Verificando...' : 'Verificar y Entrar'}
                    </button>
                </form>
                
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ¿No recibiste el código? Revisa tu carpeta de spam.
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
