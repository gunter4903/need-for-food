import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/authApi';

const TOKEN_KEY = 'auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        (async () => {
            const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            if (storedToken) {
                try {
                    const me = await authApi.getMe(storedToken);
                    setToken(storedToken);
                    setUser(me);
                } catch {
                    await AsyncStorage.removeItem(TOKEN_KEY);
                }
            }
            setInitializing(false);
        })();
    }, []);

    const login = useCallback(async (email, password) => {
        const { token: newToken } = await authApi.login(email, password);
        const me = await authApi.getMe(newToken);
        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(me);
    }, []);

    const register = useCallback(async (email, username, password) => {
        await authApi.register(email, username, password);
        await login(email, password);
    }, [login]);

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (data) => {
        const updated = await authApi.updateMe(token, data);
        setUser(updated);
        return updated;
    }, [token]);

    const deleteAccount = useCallback(async () => {
        await authApi.deleteMe(token);
        await logout();
    }, [token, logout]);

    const changePassword = useCallback((currentPassword, newPassword) => {
        return authApi.changePassword(token, currentPassword, newPassword);
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, user, initializing, login, register, logout, updateProfile, deleteAccount, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
