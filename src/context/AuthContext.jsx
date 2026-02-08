// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on refresh
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await API.get('/auth/me'); // Hits your backend health/me check
                setUser(res.data.data.user);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await API.post('/auth/login', { email, password });
            setUser(res.data.data.user);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
    };

    const logout = async () => {
        await API.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);