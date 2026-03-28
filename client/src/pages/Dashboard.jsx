import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService, boardService } from '../services/api';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [boards, setBoards] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const statsRes = await statsService.getSummary();
                setStats(statsRes.data);
                
                const boardsRes = await boardService.getBoards();
                setBoards(boardsRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDashboardData();
    }, []);

    if (!stats) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

    const priorityData = {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
            label: 'Tasks by Priority',
            data: [stats.byPriority.low, stats.byPriority.medium, stats.byPriority.high],
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            borderWidth: 0,
        }]
    };

    const statusData = {
        labels: Object.keys(stats.byStatus),
        datasets: [{
            label: 'Tasks by Status',
            data: Object.values(stats.byStatus),
            backgroundColor: ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#ec4899'],
            borderWidth: 0,
        }]
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Tus Proyectos</h1>
            
            {/* Boards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {boards.map(board => (
                    <div 
                        key={board._id} 
                        className="glass" 
                        onClick={() => navigate(`/board/${board._id}`)}
                        style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid var(--primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>{board.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                            {board.description || 'Haz clic para abrir el tablero...'}
                        </p>
                    </div>
                ))}
            </div>

            <h2 style={{ marginBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>Analytics Dashboard</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h3>Total Boards</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalBoards}</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <h3>Total Tasks</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{stats.totalTasks}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Task Distribution (Priority)</h3>
                    <div style={{ height: '300px' }}>
                        <Pie data={priorityData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Task Status</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={statusData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
