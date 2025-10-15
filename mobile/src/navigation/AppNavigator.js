import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import TasksScreen from '../screens/TasksScreen';
import ComplaintsScreen from '../screens/ComplaintsScreen';
import ContractsScreen from '../screens/ContractsScreen';
import StockScreen from '../screens/StockScreen';
import NotesScreen from '../screens/NotesScreen';
import RawMaterialsScreen from '../screens/RawMaterialsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();
  const permissions = user?.permissions || {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Contactos') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Actividades') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Tareas') iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          else if (route.name === 'Reclamos') iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          else if (route.name === 'Contratos') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Stock') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Notas') iconName = focused ? 'document' : 'document-outline';
          else if (route.name === 'Fichas Técnicas') iconName = focused ? 'flask' : 'flask-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#3b82f6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11 }
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Contactos" component={ContactsScreen} />
      {permissions.activities !== false && (
        <Tab.Screen name="Actividades" component={ActivitiesScreen} />
      )}
      {permissions.tasks !== false && (
        <Tab.Screen name="Tareas" component={TasksScreen} />
      )}
      {permissions.complaints !== false && (
        <Tab.Screen name="Reclamos" component={ComplaintsScreen} />
      )}
      {permissions.contracts !== false && (
        <Tab.Screen name="Contratos" component={ContractsScreen} />
      )}
      {permissions.stock !== false && (
        <Tab.Screen name="Stock" component={StockScreen} />
      )}
      {permissions.notes !== false && (
        <Tab.Screen name="Notas" component={NotesScreen} />
      )}
      {permissions.rawMaterials !== false && (
        <Tab.Screen name="Fichas Técnicas" component={RawMaterialsScreen} />
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
