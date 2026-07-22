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
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

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
                <Stack.Screen name="ChercherRecettes" component={SearchRecipesScreen} />
                <Stack.Screen name="MesListesCourses" component={ShoppingListsOverviewScreen} />
                <Stack.Screen name="Profil" component={ProfileScreen} />

                {/* Profile */}
                <Stack.Screen name="ModifierProfil" component={EditProfileScreen} />

                {/* Recettes */}
                <Stack.Screen name="DetailsRecette" component={RecipeDetailScreen} />
                <Stack.Screen name="AjouterRecette" component={AddRecipeScreen} />
                <Stack.Screen name="ModifierRecette" component={EditRecipeScreen} />

                {/* Courses */}
                <Stack.Screen name="ListeCourses" component={ShoppingListScreen} />
                <Stack.Screen name="CreerListeCourses" component={CreateShoppingListScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}