import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    verifyEmail: (email, code) => api.post('/auth/verify-email', { email, code }),
    getMe: () => api.get('/auth/me'),
};

export const boardService = {
    getBoards: () => api.get('/boards'),
    createBoard: (data) => api.post('/boards', data),
    updateBoard: (id, data) => api.patch(`/boards/${id}`, data),
    deleteBoard: (id) => api.delete(`/boards/${id}`),
};

export const listService = {
    getLists: (boardId) => api.get(`/lists/board/${boardId}`),
    createList: (data) => api.post('/lists', data),
    updateList: (id, data) => api.patch(`/lists/${id}`, data),
    deleteList: (id) => api.delete(`/lists/${id}`),
};

export const cardService = {
    getCards: (listId) => api.get(`/cards/list/${listId}`),
    createCard: (data) => api.post('/cards', data),
    updateCard: (id, data) => api.patch(`/cards/${id}`, data),
    deleteCard: (id) => api.delete(`/cards/${id}`),
    clearList: (listId) => api.delete(`/cards/clear/${listId}`),
};

export const statsService = {
    getSummary: () => api.get('/stats/user-summary'),
};

export const activityService = {
    getBoardActivity: (boardId) => api.get(`/activity/board/${boardId}`)
};

export const aiService = {
    parseTask: (text) => api.post('/ai/parse-task', { text })
};

export default api;
