import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import VerifyAccountScreen from '../screens/auth/VerifyAccountScreen';

// Home
import HomeScreen from '../screens/home/HomeScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PreferencesScreen from '../screens/profile/PreferencesScreen';
import PrivacyScreen from '../screens/profile/PrivacyScreen';

// Recettes
import SearchRecipesScreen from '../screens/recipes/SearchRecipesScreen';
import RecipeDetailScreen from '../screens/recipes/RecipeDetailScreen';
import AddRecipeScreen from '../screens/recipes/AddRecipeScreen';
import EditRecipeScreen from '../screens/recipes/EditRecipeScreen';

// Courses
import ShoppingListsOverviewScreen from '../screens/shoppingList/ShopingListsOverviewScreen';
import ShoppingListScreen from '../screens/shoppingList/ShoppingListScreen';
import CreateShoppingListScreen from '../screens/shoppingList/CreateShoppingListScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, initializing } = useAuth();

    if (initializing) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        {/* Onglets principaux */}
                        <Stack.Screen name="Accueil" component={HomeScreen} />
                        <Stack.Screen name="ChercherRecettes" component={SearchRecipesScreen} />
                        <Stack.Screen name="MesListesCourses" component={ShoppingListsOverviewScreen} />
                        <Stack.Screen name="Profil" component={ProfileScreen} />

                        {/* Profile */}
                        <Stack.Screen name="ModifierProfil" component={EditProfileScreen} />
                        <Stack.Screen name="Preferences" component={PreferencesScreen} />
                        <Stack.Screen name="Confidentialite" component={PrivacyScreen} />

                        {/* Recettes */}
                        <Stack.Screen name="DetailsRecette" component={RecipeDetailScreen} />
                        <Stack.Screen name="AjouterRecette" component={AddRecipeScreen} />
                        <Stack.Screen name="ModifierRecette" component={EditRecipeScreen} />

                        {/* Courses */}
                        <Stack.Screen name="ListeCourses" component={ShoppingListScreen} />
                        <Stack.Screen name="CreerListeCourses" component={CreateShoppingListScreen} />
                    </>
                ) : (
                    <>
                        {/* Authentification */}
                        <Stack.Screen name="Connexion" component={LoginScreen} />
                        <Stack.Screen name="Inscription" component={SignupScreen} />
                        <Stack.Screen name="VerificationCompte" component={VerifyAccountScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}