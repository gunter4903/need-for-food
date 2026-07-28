import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './AppNavigator';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../api/authApi';
import * as recipeApi from '../api/recipeApi';
import * as preferenceApi from '../api/preferenceApi';

jest.mock('../api/authApi');
jest.mock('../api/recipeApi');
jest.mock('../api/preferenceApi');

const EMPTY_PREFERENCES = {
    diet: [],
    allergies: [],
    dislikedIngredients: [],
    favoriteRecipeTypes: [],
    maxPreparationTime: null,
};

function renderApp() {
    return render(
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}

describe('AppNavigator', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
        recipeApi.getSuggestions.mockResolvedValue([]);
        recipeApi.getAll.mockResolvedValue([]);
        recipeApi.getMine.mockResolvedValue([]);
        preferenceApi.getMine.mockResolvedValue(EMPTY_PREFERENCES);
    });

    it('shows the login screen when there is no stored session', async () => {
        const { findByPlaceholderText } = await renderApp();

        expect(await findByPlaceholderText('votre@email.com')).toBeTruthy();
    });

    it('switches to the authenticated Home screen after a successful login', async () => {
        authApi.login.mockResolvedValue({ token: 'new-token' });
        authApi.getMe.mockResolvedValue({ id: 1, username: 'Julia Martin', verified: true });

        const { findByPlaceholderText, getByText, findByText } = await renderApp();

        const emailInput = await findByPlaceholderText('votre@email.com');
        fireEvent.changeText(emailInput, 'julia@needforfood.dev');
        await waitFor(() => expect(emailInput.props.value).toBe('julia@needforfood.dev'));

        const passwordInput = await findByPlaceholderText('••••••••');
        fireEvent.changeText(passwordInput, 's3cret-pwd');
        await waitFor(() => expect(passwordInput.props.value).toBe('s3cret-pwd'));

        fireEvent.press(getByText('Se connecter'));

        expect(await findByText('Bonjour, Julia')).toBeTruthy();
        expect(authApi.login).toHaveBeenCalledWith('julia@needforfood.dev', 's3cret-pwd');
    });

    it('returns to the login screen after logging out from the profile tab', async () => {
        authApi.login.mockResolvedValue({ token: 'new-token' });
        authApi.getMe.mockResolvedValue({ id: 1, username: 'Julia Martin', verified: true });

        const { findByPlaceholderText, getByText, findByText } = await renderApp();

        const emailInput = await findByPlaceholderText('votre@email.com');
        fireEvent.changeText(emailInput, 'julia@needforfood.dev');
        await waitFor(() => expect(emailInput.props.value).toBe('julia@needforfood.dev'));

        const passwordInput = await findByPlaceholderText('••••••••');
        fireEvent.changeText(passwordInput, 's3cret-pwd');
        await waitFor(() => expect(passwordInput.props.value).toBe('s3cret-pwd'));

        fireEvent.press(getByText('Se connecter'));
        await findByText('Bonjour, Julia');

        fireEvent.press(getByText('Profil'));
        await waitFor(() => expect(preferenceApi.getMine).toHaveBeenCalled());

        fireEvent.press(await findByText('Déconnexion'));

        expect(await findByPlaceholderText('votre@email.com')).toBeTruthy();
    });

    it('redirects to the verification screen when logging in with an unverified account', async () => {
        authApi.login.mockResolvedValue({ token: 'new-token' });
        authApi.getMe.mockResolvedValue({ id: 1, email: 'julia@needforfood.dev', username: 'Julia Martin', verified: false });

        const { findByPlaceholderText, getByText, findByText, queryByText } = await renderApp();

        const emailInput = await findByPlaceholderText('votre@email.com');
        fireEvent.changeText(emailInput, 'julia@needforfood.dev');
        await waitFor(() => expect(emailInput.props.value).toBe('julia@needforfood.dev'));

        const passwordInput = await findByPlaceholderText('••••••••');
        fireEvent.changeText(passwordInput, 's3cret-pwd');
        await waitFor(() => expect(passwordInput.props.value).toBe('s3cret-pwd'));

        fireEvent.press(getByText('Se connecter'));

        expect(await findByText('Vérification de compte')).toBeTruthy();
        expect(queryByText('Bonjour, Julia')).toBeNull();
    });

    it('returns to the login screen when logging out from the verification screen reached via login', async () => {
        authApi.login.mockResolvedValue({ token: 'new-token' });
        authApi.getMe.mockResolvedValue({ id: 1, email: 'julia@needforfood.dev', username: 'Julia Martin', verified: false });

        const { findByPlaceholderText, getByText, findByText } = await renderApp();

        const emailInput = await findByPlaceholderText('votre@email.com');
        fireEvent.changeText(emailInput, 'julia@needforfood.dev');
        await waitFor(() => expect(emailInput.props.value).toBe('julia@needforfood.dev'));

        const passwordInput = await findByPlaceholderText('••••••••');
        fireEvent.changeText(passwordInput, 's3cret-pwd');
        await waitFor(() => expect(passwordInput.props.value).toBe('s3cret-pwd'));

        fireEvent.press(getByText('Se connecter'));
        await findByText('Vérification de compte');

        fireEvent.press(getByText('Se déconnecter'));

        expect(await findByPlaceholderText('votre@email.com')).toBeTruthy();
    });
});
