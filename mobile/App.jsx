// mobile/App.js
import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import SplashScreen from 'react-native-splash-screen';

// Import i18n configuration
import './src/i18n';

// Import Contexts
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { NotificationProvider } from './src/context/NotificationContext';

// Import Screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import IssueFormScreen from './src/screens/IssueFormScreen';
import IssueTrackingScreen from './src/screens/IssueTrackingScreen';
import IssueDetailScreen from './src/screens/IssueDetailScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationScreen from './src/screens/NotificationScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="IssueForm" component={IssueFormScreen} />
    <Stack.Screen name="IssueTracking" component={IssueTrackingScreen} />
    <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
    <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
  </Stack.Navigator>
);

const Navigation = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const App = () => {
  useEffect(() => {
    // Hide splash screen when app is ready
    if (Platform.OS !== 'web') {
      SplashScreen?.hide();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Navigation />
            <Toast />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;