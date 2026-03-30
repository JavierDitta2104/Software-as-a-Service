import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { listService, cardService, activityService, aiService } from '../services/api';
import { Plus, MoreVertical, Calendar, Clock, Activity, X, Tag, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const KanbanBoard = () => {
    const { boardId } = useParams();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    
    // UI State for Modals
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    
    const [activeListIdForCard, setActiveListIdForCard] = useState(null);
    const [newCardData, setNewCardData] = useState({ title: '', description: '', priority: 'low', dueDate: '', tags: [] });

    // Filter by tag
    const [filterTag, setFilterTag] = useState(null);

    // Temp states for new tag inside new card modal
    const [tempTagName, setTempTagName] = useState('');
    const [tempTagColor, setTempTagColor] = useState('#3b82f6');
    const TAG_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
    
    // AI Magic State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleAiParse = async () => {
        if (!aiPrompt.trim()) return;
        setIsAiLoading(true);
        try {
            const res = await aiService.parseTask(aiPrompt);
            const data = res.data;
            
            // Auto-fill form
            setNewCardData({
                ...newCardData,
                title: data.title || '',
                description: data.description || aiPrompt,
                priority: data.priority || 'medium',
                dueDate: data.dueDate ? data.dueDate.split('T')[0] : ''
            });

            setAiPrompt('');
        } catch (err) {
            console.error('Error parsing with AI:', err);
            alert('Hubo un error al procesar tu solicitud con IA.');
        } finally {
            setIsAiLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await activityService.getBoardActivity(boardId);
            setActivities(res.data);
        } catch (err) {
            console.error('Failed to fetch activities:', err);
        }
    };

    const fetchBoard = async () => {
        try {
            const res = await listService.getLists(boardId);
            const listsWithCards = await Promise.all(res.data.map(async (list) => {
                const cardsRes = await cardService.getCards(list._id);
                return { ...list, cards: cardsRes.data };
            }));
            setLists(listsWithCards);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching board:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoard();
        fetchActivities();
    }, [boardId]);

    const handleAddList = async (e) => {
        e.preventDefault();
        try {
            await listService.createList({ boardId, title: newListTitle, order: lists.length });
            setNewListTitle('');
            setIsListModalOpen(false);
            fetchBoard();
            fetchActivities();
        } catch (err) {
            console.error('Error adding list:', err);
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        try {
            const destList = lists.find(l => l._id === activeListIdForCard);
            
            const payload = { 
                listId: activeListIdForCard, 
                title: newCardData.title, 
                description: newCardData.description, 
                priority: newCardData.priority,
                order: destList ? destList.cards.length : 0 
            };
            if (newCardData.dueDate) payload.dueDate = newCardData.dueDate;
            if (newCardData.tags && newCardData.tags.length > 0) payload.tags = newCardData.tags;

            await cardService.createCard(payload);
            setNewCardData({ title: '', description: '', priority: 'low', dueDate: '', tags: [] });
            setTempTagName('');
            setTempTagColor('#3b82f6');
            setActiveListIdForCard(null);
            fetchBoard(); 
            fetchActivities(); 
        } catch (err) {
            console.error('Error adding card:', err);
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm('¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.')) return;
        try {
            await cardService.deleteCard(cardId);
            fetchBoard();
            fetchActivities();
        } catch (err) {
            console.error('Error deleting card:', err);
        }
    };

    const handleClearList = async (listId) => {
        if (!window.confirm('¿Estás seguro de ELIMINAR TODAS LAS TAREAS de esta columna?')) return;
        try {
            await cardService.clearList(listId);
            fetchBoard();
            fetchActivities();
        } catch (err) {
            console.error('Error clearing list:', err);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // If moved to a different list
        if (destination.droppableId !== source.droppableId) {
            const sourceList = lists.find(l => l._id === source.droppableId);
            const destList = lists.find(l => l._id === destination.droppableId);
            const draggedCard = sourceList.cards.find(c => c._id === draggableId);

            // Optimistic update
            const newLists = lists.map(list => {
                if (list._id === source.droppableId) {
                    return { ...list, cards: list.cards.filter(c => c._id !== draggableId) };
                }
                if (list._id === destination.droppableId) {
                    const newCards = [...list.cards];
                    newCards.splice(destination.index, 0, { ...draggedCard, listId: destination.droppableId });
                    return { ...list, cards: newCards };
                }
                return list;
            });
            setLists(newLists);

            // Persist to backend
            try {
                await cardService.updateCard(draggableId, { listId: destination.droppableId });
            } catch (err) {
                console.error('Failed to update card list:', err);
                fetchBoard(); // Rollback on error
            }

            // Refresh activity log quietly
            fetchActivities();
        }
    };

    const getDueDateStatus = (date) => {
        if (!date) return null;
        const now = new Date();
        const due = new Date(date);
        const diff = due - now;
        const days = diff / (1000 * 60 * 60 * 24);
        
        if (diff < 0) return { label: 'Atrasado', color: '#ef4444' };
        if (days < 1) return { label: 'Próximo', color: '#f59e0b' };
        return { label: 'Al día', color: '#22c55e' };
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading board...</div>;

    // Get all unique tags from all cards
    const allTags = [];
    lists.forEach(list => {
        list.cards?.forEach(card => {
            card.tags?.forEach(tag => {
                if (!allTags.some(t => t.name === tag.name)) {
                    allTags.push(tag);
                }
            });
        });
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
            {/* Filter Toolbar */}
            <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Tag size={16} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Filtrar por Etiqueta:</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => setFilterTag(null)}
                        style={{ 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            fontSize: '0.8rem', 
                            cursor: 'pointer',
                            border: '1px solid ' + (!filterTag ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                            background: !filterTag ? 'var(--primary)' : 'transparent',
                            color: 'white'
                        }}
                    >
                        Todas
                    </button>
                    {allTags.map((tag, i) => (
                        <button 
                            key={i}
                            onClick={() => setFilterTag(filterTag === tag.name ? null : tag.name)}
                            style={{ 
                                padding: '4px 12px', 
                                borderRadius: '20px', 
                                fontSize: '0.8rem', 
                                cursor: 'pointer',
                                border: '1px solid ' + tag.color,
                                background: filterTag === tag.name ? tag.color : 'transparent',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: filterTag === tag.name ? 'white' : tag.color }}></span>
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{ position: 'relative', display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div style={{ flex: 1, overflowX: 'auto', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    {lists.map(list => (
                    <div key={list._id} style={{ width: '320px', flexShrink: 0 }}>
                        <div className="glass" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <h4 style={{ fontWeight: '600', fontSize: '1.1rem' }}>{list.title}</h4>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.6, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                        {list.cards.length}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button 
                                        className="btn-icon" 
                                        onClick={() => handleClearList(list._id)}
                                        title="Limpiar Columna"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <Droppable droppableId={list._id}>
                                {(provided) => (
                                    <div 
                                        {...provided.droppableProps} 
                                        ref={provided.innerRef}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '50px' }}
                                    >
                                        {list.cards.filter(c => !filterTag || (c.tags && c.tags.some(t => t.name.toLowerCase() === filterTag.toLowerCase()))).map((card, index) => {
                                            const dueStatus = getDueDateStatus(card.dueDate);
                                            return (
                                                <Draggable key={card._id} draggableId={card._id} index={index}>
                                                    {(provided) => (
                                                        <div 
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="glass card-hover" 
                                                            style={{ 
                                                                ...provided.draggableProps.style,
                                                                padding: '1.25rem', 
                                                                background: 'var(--bg-card)',
                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                                {card.tags && card.tags.length > 0 ? (
                                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                                        {card.tags.map((tag, i) => (
                                                                            <span key={i} style={{ 
                                                                                background: tag.color, 
                                                                                padding: '2px 6px',
                                                                                borderRadius: '4px',
                                                                                fontSize: '0.65rem',
                                                                                color: 'white',
                                                                                fontWeight: '600'
                                                                            }}>
                                                                                {tag.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : <div></div>}
                                                                <button 
                                                                    className="btn-icon" 
                                                                    style={{ padding: 0, margin: '-4px -4px 0 0' }}
                                                                    onClick={() => handleDeleteCard(card._id)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>

                                                            <p style={{ fontWeight: '500', marginBottom: '1rem', lineHeight: '1.4' }}>{card.title}</p>
                                                            
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                                                <span style={{ 
                                                                    fontSize: '0.75rem', 
                                                                    padding: '4px 10px', 
                                                                    borderRadius: '6px',
                                                                    backgroundColor: card.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : 
                                                                                   card.priority === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 
                                                                                   'rgba(34, 197, 94, 0.15)',
                                                                    color: card.priority === 'high' ? '#ef4444' : 
                                                                           card.priority === 'medium' ? '#f59e0b' : 
                                                                           '#22c55e',
                                                                    fontWeight: '600',
                                                                    textTransform: 'capitalize'
                                                                }}>
                                                                    {card.priority}
                                                                </span>

                                                                {dueStatus && (
                                                                    <div style={{ 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        gap: '4px', 
                                                                        fontSize: '0.75rem', 
                                                                        color: dueStatus.color,
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        <Clock size={14} />
                                                                        {dueStatus.label}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                            <button 
                                onClick={() => setActiveListIdForCard(list._id)}
                                style={{ 
                                    width: '100%', 
                                    marginTop: '1.25rem',
                                    padding: '0.75rem', 
                                    background: 'transparent', 
                                    border: '1px dashed rgba(255,255,255,0.2)',
                                    color: 'rgba(255,255,255,0.5)',
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Plus size={18} /> Add Card
                            </button>
                        </div>
                    </div>
                ))}
                
                <div style={{ width: '300px', flexShrink: 0 }}>
                    <button 
                        onClick={() => setIsListModalOpen(true)}
                        className="glass" 
                        style={{ 
                            width: '100%', 
                            padding: '1.25rem', 
                            background: 'rgba(255,255,255,0.05)', 
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={20} /> Add List
                    </button>
                </div>
            </div>

            {/* Toggle Activity Sidebar Button (Fixed bottom right) */}
            <button 
                onClick={() => setIsActivityOpen(true)}
                className="btn-primary" 
                style={{ position: 'fixed', bottom: '2rem', right: '2rem', borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10 }}
            >
                <Activity size={24} />
            </button>

            {/* Activity Sidebar */}
            <div className="glass" style={{ 
                position: 'fixed', 
                top: '0', 
                right: isActivityOpen ? '0' : '-400px', 
                width: '400px', 
                height: '100vh', 
                zIndex: 100,
                transition: 'right 0.3s ease-in-out',
                background: 'var(--bg-card)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>Historial de Actividad</h3>
                    </div>
                    <button onClick={() => setIsActivityOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {activities.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No hay actividad reciente.</p>
                    ) : (
                        activities.map(act => (
                            <div key={act._id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ 
                                    width: '32px', height: '32px', borderRadius: '50%', 
                                    background: 'var(--primary)', color: 'white', 
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', 
                                    fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 
                                }}>
                                    {act.userId?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', margin: 0 }}>
                                        <strong style={{ color: 'white' }}>{act.userId?.name || 'Usuario'}</strong> {act.action} <strong style={{ color: 'var(--accent)' }}>{act.targetName}</strong>
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                                        {new Date(act.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* List Modal Form */}
            {isListModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="glass" style={{ width: '400px', padding: '2rem', borderRadius: '1rem', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Nueva Lista</h3>
                            <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsListModalOpen(false)} />
                        </div>
                        <form onSubmit={handleAddList}>
                            <input 
                                autoFocus
                                required
                                value={newListTitle}
                                onChange={(e) => setNewListTitle(e.target.value)}
                                placeholder="Nombre de la lista..." 
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', marginBottom: '1.5rem' }} 
                            />
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Crear Lista</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Card Modal Form */}
            {activeListIdForCard && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="glass" style={{ width: '500px', padding: '2rem', borderRadius: '1rem', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Nueva Tarea</h3>
                            <X size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => { setActiveListIdForCard(null); setAiPrompt(''); }} />
                        </div>

                        {/* AI Magic Input */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', 
                            padding: '1rem', 
                            borderRadius: '0.75rem', 
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#a78bfa' }}>
                                <Sparkles size={16} />
                                <span>Crear con IA ✨</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Ej: 'Reunion urgente para mañana'..." 
                                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.85rem' }} 
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiParse())}
                                />
                                <button 
                                    type="button"
                                    disabled={isAiLoading || !aiPrompt.trim()}
                                    onClick={handleAiParse}
                                    style={{ 
                                        padding: '0 1rem', 
                                        borderRadius: '0.4rem', 
                                        background: 'var(--primary)', 
                                        color: 'white', 
                                        border: 'none', 
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        opacity: (isAiLoading || !aiPrompt.trim()) ? 0.6 : 1
                                    }}
                                >
                                    {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : 'Procesar'}
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                                autoFocus
                                required
                                value={newCardData.title}
                                onChange={(e) => setNewCardData({...newCardData, title: e.target.value})}
                                placeholder="Título de la tarea..." 
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} 
                            />
                            <textarea 
                                value={newCardData.description}
                                onChange={(e) => setNewCardData({...newCardData, description: e.target.value})}
                                placeholder="Descripción (opcional)..." 
                                rows={3}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', resize: 'vertical' }} 
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Prioridad</label>
                                    <select 
                                        value={newCardData.priority}
                                        onChange={(e) => setNewCardData({...newCardData, priority: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fecha Límite</label>
                                    <input 
                                        type="date"
                                        value={newCardData.dueDate}
                                        onChange={(e) => setNewCardData({...newCardData, dueDate: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                    />
                                </div>
                            </div>
                            
                            {/* Manage Tags */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Etiquetas</label>
                                
                                {newCardData.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                        {newCardData.tags.map((tag, i) => (
                                            <span key={i} style={{ background: tag.color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {tag.name}
                                                <X size={12} style={{ cursor: 'pointer' }} onClick={() => {
                                                    const newTags = [...newCardData.tags];
                                                    newTags.splice(i, 1);
                                                    setNewCardData({...newCardData, tags: newTags});
                                                }} />
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        value={tempTagName}
                                        onChange={(e) => setTempTagName(e.target.value)}
                                        placeholder="Nombre etiqueta..."
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '0.8rem' }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (tempTagName.trim()) {
                                                setNewCardData({...newCardData, tags: [...newCardData.tags, { name: tempTagName.trim(), color: tempTagColor }]});
                                                setTempTagName('');
                                            }
                                        }}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '0.8rem', cursor: 'pointer' }}
                                    >
                                        Añadir
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '0.75rem' }}>
                                    {TAG_COLORS.map(color => (
                                        <button 
                                            key={color}
                                            type="button"
                                            onClick={() => setTempTagColor(color)}
                                            style={{ 
                                                width: '24px', height: '24px', borderRadius: '50%', background: color, 
                                                border: tempTagColor === color ? '2px solid white' : '2px solid transparent',
                                                cursor: 'pointer', padding: 0
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Añadir Tarea</button>
                        </form>
                    </div>
                </div>
            )}
                </div>
            </DragDropContext>
        </div>
    );
};

export default KanbanBoard;
