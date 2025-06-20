import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import HoldsScreen from './src/screens/HoldsScreen';
import PurchasesScreen from './src/screens/PurchasesScreen';
import InvestmentScreen from './src/screens/InvestmentScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import theme
import { theme } from './src/theme/theme';

// Import context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { InventoryProvider } from './src/context/InventoryContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Inventory':
              iconName = 'inventory';
              break;
            case 'Add Item':
              iconName = 'add-circle';
              break;
            case 'Holds':
              iconName = 'handshake';
              break;
            case 'Purchases':
              iconName = 'shopping-cart';
              break;
            case 'Investment':
              iconName = 'trending-up';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Add Item" 
        component={AddItemScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Holds" 
        component={HoldsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Purchases" 
        component={PurchasesScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Investment" 
        component={InvestmentScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Navigation component
function Navigation() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main app screens
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="ItemDetail" 
            component={ItemDetailScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
              },
              headerTintColor: theme.colors.text,
              headerTitleStyle: {
                fontWeight: '600',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Main App component
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <InventoryProvider>
            <NavigationContainer theme={theme}>
              <Navigation />
            </NavigationContainer>
          </InventoryProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 