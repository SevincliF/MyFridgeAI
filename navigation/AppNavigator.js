import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ekranlar
import FridgeScreen from '../screens/FridgeScreen';
import RecipesScreen from '../screens/RecipesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';

const Tab = createBottomTabNavigator();
const RecipesStack = createNativeStackNavigator();

// Tarifler için Stack Navigator
const RecipesStackNavigator = () => {
  return (
    <RecipesStack.Navigator screenOptions={{ headerShown: false }}>
      <RecipesStack.Screen name="RecipesList" component={RecipesScreen} />
      <RecipesStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </RecipesStack.Navigator>
  );
};

const getTabBarIcon = (routeName) => {
  let iconName;
  switch (routeName) {
    case 'Fridge':
      iconName = 'kitchen';
      break;
    case 'Recipes':
      iconName = 'restaurant';
      break;
    case 'Profile':
      iconName = 'person';
      break;
    case 'RecipeDetail':
      iconName = 'restaurant';
      break;
    case 'RecipesList':
      iconName = 'restaurant';
      break;
    default:
      iconName = 'circle';
  }
  
  return iconName;
};

const AppNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? route.name;
          const iconName = getTabBarIcon(routeName);
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4285F4',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 60,
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 90,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Fridge" 
        component={FridgeScreen} 
        options={{ 
          title: 'Buzdolabım' 
        }} 
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipesStackNavigator} 
        options={{ 
          title: 'Tarifler' 
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profilim' 
        }} 
      />
    </Tab.Navigator>
  );
};

export default AppNavigator; 