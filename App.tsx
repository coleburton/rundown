import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import * as React from 'react';
import { registerRootComponent } from 'expo';
import { WelcomeScreen } from './src/screens/welcome-screen';
import { GoalSetupScreen } from './src/screens/goal-setup-screen';
import { ContactSetupScreen } from './src/screens/contact-setup-screen';
import { MessageStyleScreen } from './src/screens/message-style-screen';
import { DashboardScreen } from './src/screens/dashboard-screen';
import { MockDataProvider } from './src/lib/mock-data-context';
import { useMockAuth } from './src/hooks/useMockAuth';
import { AuthProvider } from './src/lib/auth-context';

export type RootStackParamList = {
  Welcome: undefined;
  GoalSetup: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const mockAuth = useMockAuth();
  const { user, isLoading } = mockAuth;

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} />
    );
  }

  // Determine initial route based on auth state
  let initialRoute: keyof RootStackParamList = 'Welcome';
  if (user) {
    if (!user.goal_per_week || !user.message_style) {
      initialRoute = 'GoalSetup';
    } else {
      initialRoute = 'Dashboard';
    }
  }

  return (
    <AuthProvider auth={{
      user: mockAuth.user,
      loading: mockAuth.isLoading,
      signInWithStrava: mockAuth.connectStrava,
      signOut: mockAuth.signOut
    }}>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Auth screens */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        
        {/* Onboarding screens */}
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
        <Stack.Screen name="ContactSetup" component={ContactSetupScreen} />
        <Stack.Screen name="MessageStyle" component={MessageStyleScreen} />
        
        {/* App screens */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </AuthProvider>
  );
}

function App() {
  return (
    <NavigationContainer>
      <MockDataProvider>
        <AppContent />
      </MockDataProvider>
    </NavigationContainer>
  );
}

registerRootComponent(App);

export default App; 