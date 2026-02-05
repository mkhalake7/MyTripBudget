import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/users/me');
                    setUser({ ...response.data, token });
                } catch {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/token', new URLSearchParams({
            username: email,
            password: password,
        }));
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);

        // Fetch user details
        const userResponse = await api.get('/users/me');
        setUser({ ...userResponse.data, token: access_token });
    };

    const register = async (email, password, fullName, mobileNumber) => {
        await api.post('/signup', {
            email,
            password,
            full_name: fullName,
            mobile_number: mobileNumber || null,
        });
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
