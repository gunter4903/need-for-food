import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import VerifyAccountScreen from '../screens/auth/VerifyAccountScreen';

// Coeur de l'app
import HomeScreen from '../screens/home/HomeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Connexion"
                screenOptions={{ headerShown: false }}
            >
                {/* Authentification */}
                <Stack.Screen name="Connexion" component={LoginScreen} />
                <Stack.Screen name="Inscription" component={SignupScreen} />
                <Stack.Screen name="VerificationCompte" component={VerifyAccountScreen} />

                {/* Onglets principaux */}
                <Stack.Screen name="Accueil" component={HomeScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}