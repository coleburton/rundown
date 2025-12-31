import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Polyfill for structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}
import { useAuth } from './src/hooks/useAuth';
import { AuthProvider } from './src/lib/auth-context';
import MixpanelDebug from './src/lib/MixpanelDebug';
import AnalyticsProvider from './src/lib/AnalyticsProvider';
import { MockDataProvider } from './src/lib/mock-data-context';
import { ActivityDetailScreen } from './src/screens/activity-detail-screen';
import { ContactSetupScreen } from './src/screens/contact-setup-screen';
import { DashboardScreen } from './src/screens/dashboard-screen';
import { FitnessAppConnectScreen } from './src/screens/fitness-app-connect-screen';
import { GoalSetupScreen } from './src/screens/goal-setup-screen';
import { LoginScreen } from './src/screens/login-screen';
import { MessageStyleScreen } from './src/screens/message-style-screen';
import { MotivationQuizScreen } from './src/screens/motivation-quiz-screen';
import { OnboardingScreen } from './src/screens/onboarding-screen';
import { PaywallScreen } from './src/screens/paywall-screen';
import { PaywallFreeTrialScreen } from './src/screens/paywall-free-trial-screen';
import { SettingsScreen } from './src/screens/settings-screen';
import { SocialProofScreen } from './src/screens/social-proof-screen';
import { UserInfoScreen } from './src/screens/user-info-screen';
import { ValuePreviewScreen } from './src/screens/value-preview-screen';
import { WhyAccountabilityScreen } from './src/screens/why-accountability-screen';
import { PostPaywallOnboardingScreen } from './src/screens/post-paywall-onboarding-screen';
import { MessageHistoryScreen } from './src/screens/message-history-screen';
import { ActivityHistoryScreen } from './src/screens/activity-history-screen';
import { isDebugMode } from './src/lib/debug-mode';

export type RootStackParamList = {
  Onboarding: undefined;
  UserInfo: undefined;
  Login: undefined;
  WhyAccountability: undefined;
  SocialProof: undefined;
  MotivationQuiz: undefined;
  GoalSetup: undefined;
  ValuePreview: undefined;
  FitnessAppConnect: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
  Dashboard: undefined;
  Settings: undefined;
  MessageHistory: undefined;
  ActivityHistory: undefined;
  Paywall: undefined;
  PaywallFreeTrial: undefined;
  PostPaywallOnboarding: undefined;
  ActivityDetail: { activityId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const auth = useAuth();
  const { user, loading } = auth;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} />
    );
  }

  // Start with onboarding if no user, otherwise go to dashboard
  // In debug mode, you can override this by setting a query param or env var
  let initialRoute: keyof RootStackParamList = user ? 'Dashboard' : 'Onboarding';
  
  // Debug override: Force onboarding flow even with existing user
  if (isDebugMode() && user) {
    // You can uncomment this line to always start with onboarding in debug mode:
    // initialRoute = 'Onboarding';
  }

  return (
    <AuthProvider auth={{
      user: auth.user,
      loading: auth.loading,
      signInWithStrava: auth.signInWithStrava,
      signOut: auth.signOut
    }}>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Onboarding screen */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        
        {/* Auth screens */}
        <Stack.Screen name="UserInfo" component={UserInfoScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Onboarding screens */}
        <Stack.Screen name="WhyAccountability" component={WhyAccountabilityScreen} />
        <Stack.Screen name="SocialProof" component={SocialProofScreen} />
        <Stack.Screen name="MotivationQuiz" component={MotivationQuizScreen} />
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
        <Stack.Screen name="ValuePreview" component={ValuePreviewScreen} />
        <Stack.Screen name="FitnessAppConnect" component={FitnessAppConnectScreen} />
        <Stack.Screen name="ContactSetup" component={ContactSetupScreen} />
        <Stack.Screen name="MessageStyle" component={MessageStyleScreen} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="PaywallFreeTrial" component={PaywallFreeTrialScreen} />
        <Stack.Screen name="PostPaywallOnboarding" component={PostPaywallOnboardingScreen} />
        
        {/* App screens */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="MessageHistory" component={MessageHistoryScreen} />
        <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />
        <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
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
          <AnalyticsProvider>
            <AppContent />
            {/* Show debug overlay in development mode */}
            {__DEV__ && <MixpanelDebug />}
          </AnalyticsProvider>
        </MockDataProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

export default App; 