import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import VerifyAccountScreen from '../screens/auth/VerifyAccountScreen';

// Home
import HomeScreen from '../screens/home/HomeScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen'
import EditProfileScreen from '../screens/profile/EditProfileScreen'

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
                <Stack.Screen name="Profil" component={ProfileScreen}/>

                {/* Profile */}
                <Stack.Screen name="ModifierProfil" component={EditProfileScreen}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}