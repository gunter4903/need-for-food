import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from '../api/authApi';

jest.mock('../api/authApi');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
    });

    it('finishes initializing with no session when nothing is stored', async () => {
        const { result } = await renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.initializing).toBe(false));

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(authApi.getMe).not.toHaveBeenCalled();
    });

    it('restores the session from a valid stored token', async () => {
        await AsyncStorage.setItem('auth_token', 'stored-token');
        authApi.getMe.mockResolvedValue({ id: 1, username: 'julia' });

        const { result } = await renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.initializing).toBe(false));

        expect(authApi.getMe).toHaveBeenCalledWith('stored-token');
        expect(result.current.token).toBe('stored-token');
        expect(result.current.user).toEqual({ id: 1, username: 'julia' });
    });

    it('discards an invalid stored token instead of leaving the user stuck', async () => {
        await AsyncStorage.setItem('auth_token', 'expired-token');
        authApi.getMe.mockRejectedValue(new Error('401'));

        const { result } = await renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.initializing).toBe(false));

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(await AsyncStorage.getItem('auth_token')).toBeNull();
    });

    it('login stores the token and sets the user', async () => {
        authApi.login.mockResolvedValue({ token: 'new-token' });
        authApi.getMe.mockResolvedValue({ id: 2, username: 'chef' });

        const { result } = await renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await result.current.login('chef@needforfood.dev', 's3cret-pwd');
        });

        expect(authApi.login).toHaveBeenCalledWith('chef@needforfood.dev', 's3cret-pwd');
        expect(result.current.token).toBe('new-token');
        expect(result.current.user).toEqual({ id: 2, username: 'chef' });
        expect(await AsyncStorage.getItem('auth_token')).toBe('new-token');
    });

    it('register creates the account then logs in with the same credentials', async () => {
        authApi.register.mockResolvedValue({ id: 3, username: 'nouveau' });
        authApi.login.mockResolvedValue({ token: 'fresh-token' });
        authApi.getMe.mockResolvedValue({ id: 3, username: 'nouveau' });

        const { result } = await renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await result.current.register('nouveau@needforfood.dev', 'nouveau', 's3cret-pwd');
        });

        expect(authApi.register).toHaveBeenCalledWith('nouveau@needforfood.dev', 'nouveau', 's3cret-pwd');
        expect(authApi.login).toHaveBeenCalledWith('nouveau@needforfood.dev', 's3cret-pwd');
        expect(result.current.user).toEqual({ id: 3, username: 'nouveau' });
    });

    it('logout clears the stored token and resets the session', async () => {
        await AsyncStorage.setItem('auth_token', 'stored-token');
        authApi.getMe.mockResolvedValue({ id: 1, username: 'julia' });

        const { result } = await renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.initializing).toBe(false));
        expect(result.current.user).not.toBeNull();

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(await AsyncStorage.getItem('auth_token')).toBeNull();
    });

    it('updateProfile sends the current token and replaces the user with the response', async () => {
        await AsyncStorage.setItem('auth_token', 'stored-token');
        authApi.getMe.mockResolvedValue({ id: 1, username: 'julia', bio: '' });
        authApi.updateMe.mockResolvedValue({ id: 1, username: 'julia', bio: 'Passionnée de cuisine' });

        const { result } = await renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await result.current.updateProfile({ bio: 'Passionnée de cuisine' });
        });

        expect(authApi.updateMe).toHaveBeenCalledWith('stored-token', { bio: 'Passionnée de cuisine' });
        expect(result.current.user.bio).toBe('Passionnée de cuisine');
    });

    it('deleteAccount removes the account then logs the user out', async () => {
        await AsyncStorage.setItem('auth_token', 'stored-token');
        authApi.getMe.mockResolvedValue({ id: 1, username: 'julia' });
        authApi.deleteMe.mockResolvedValue(null);

        const { result } = await renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.initializing).toBe(false));

        await act(async () => {
            await result.current.deleteAccount();
        });

        expect(authApi.deleteMe).toHaveBeenCalledWith('stored-token');
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
    });
});
