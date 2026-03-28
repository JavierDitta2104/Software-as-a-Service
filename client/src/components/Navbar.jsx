import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Layout, BarChart2, User } from 'lucide-react';
import { authService } from '../services/api';

const Navbar = ({ setToken }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await authService.getMe();
                setUser(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        setToken(null);
        navigate('/login');
    };

    return (
        <nav className="glass" style={{ margin: '1rem', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.25rem' }}>
                    AgilFlow
                </Link>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={18} /> Dashboard
                    </Link>
                </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.9rem' }}>
                        <User size={16} color="var(--primary)" />
                        {user.name}
                    </div>
                )}
                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
