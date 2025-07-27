import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import * as React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { WelcomeScreen } from './src/screens/welcome-screen';
import { FitnessAppConnectScreen } from './src/screens/fitness-app-connect-screen';
import { WhyAccountabilityScreen } from './src/screens/why-accountability-screen';
import { GoalSetupScreen } from './src/screens/goal-setup-screen';
import { MotivationQuizScreen } from './src/screens/motivation-quiz-screen';
import { SocialProofScreen } from './src/screens/social-proof-screen';
import { ValuePreviewScreen } from './src/screens/value-preview-screen';
import { ContactSetupScreen } from './src/screens/contact-setup-screen';
import { MessageStyleScreen } from './src/screens/message-style-screen';
import { DashboardScreen } from './src/screens/dashboard-screen';
import { OnboardingScreen } from './src/screens/onboarding-screen';
import { OnboardingSuccessScreen } from './src/screens/onboarding-success-screen';
import { SettingsScreen } from './src/screens/settings-screen';
import { MockDataProvider } from './src/lib/mock-data-context';
import { useMockAuth } from './src/hooks/useMockAuth';
import { AuthProvider } from './src/lib/auth-context';
import MixpanelProvider from './src/lib/MixpanelProvider';
import MixpanelDebug from './src/lib/MixpanelDebug';

export type RootStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  WhyAccountability: undefined;
  SocialProof: undefined;
  MotivationQuiz: undefined;
  GoalSetup: undefined;
  ValuePreview: undefined;
  FitnessAppConnect: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  OnboardingSuccess: undefined;
  Dashboard: undefined;
  Settings: undefined;
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

  // Always start with the onboarding flow regardless of user state
  const initialRoute: keyof RootStackParamList = 'Onboarding';

  return (
    <AuthProvider auth={{
      user: mockAuth.user,
      loading: mockAuth.isLoading,
      signInWithStrava: async () => {
        const user = await mockAuth.connectStrava();
        return;
      },
      signOut: mockAuth.signOut
    }}>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Onboarding screen */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        
        {/* Auth screens */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        
        {/* Onboarding screens */}
        <Stack.Screen name="WhyAccountability" component={WhyAccountabilityScreen} />
        <Stack.Screen name="SocialProof" component={SocialProofScreen} />
        <Stack.Screen name="MotivationQuiz" component={MotivationQuizScreen} />
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
        <Stack.Screen name="ValuePreview" component={ValuePreviewScreen} />
        <Stack.Screen name="FitnessAppConnect" component={FitnessAppConnectScreen} />
        <Stack.Screen name="ContactSetup" component={ContactSetupScreen} />
        <Stack.Screen name="MessageStyle" component={MessageStyleScreen} />
        <Stack.Screen name="OnboardingSuccess" component={OnboardingSuccessScreen} />
        
        {/* App screens */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </AuthProvider>
  );
}

function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} />
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MockDataProvider>
          <MixpanelProvider>
            <AppContent />
            {/* Show debug overlay in development mode */}
            {__DEV__ && <MixpanelDebug />}
          </MixpanelProvider>
        </MockDataProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

export default App; 