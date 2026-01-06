import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './src/types/navigation';
import { useAuth } from './src/hooks/useAuth';
import { AuthProvider } from './src/lib/auth-context';
import MixpanelDebug from './src/lib/MixpanelDebug';
import AnalyticsProvider from './src/lib/AnalyticsProvider';
import { MockDataProvider } from './src/lib/mock-data-context';
import { ActivityDetailScreen } from './src/screens/activity-detail-screen';
import { ActivityHistoryScreen } from './src/screens/activity-history-screen';
import { ContactSetupScreen } from './src/screens/contact-setup-screen';
import { DashboardScreen } from './src/screens/dashboard-screen';
import { FitnessAppConnectScreen } from './src/screens/fitness-app-connect-screen';
import { GoalSetupScreen } from './src/screens/goal-setup-screen';
import { LoginScreen } from './src/screens/login-screen';
import { MessageHistoryScreen } from './src/screens/message-history-screen';
import { MessageStyleScreen } from './src/screens/message-style-screen';
import { MotivationQuizScreen } from './src/screens/motivation-quiz-screen';
import { OnboardingScreen } from './src/screens/onboarding-screen';
import { OnboardingSuccessScreen } from './src/screens/onboarding-success-screen';
import { PaywallScreen } from './src/screens/paywall-screen';
import { PaywallFreeTrialScreen } from './src/screens/paywall-free-trial-screen';
import { PostPaywallOnboardingScreen } from './src/screens/post-paywall-onboarding-screen';
import { SettingsScreen } from './src/screens/settings-screen';
import { SocialProofScreen } from './src/screens/social-proof-screen';
import { SplashScreen } from './src/screens/splash-screen';
import { UserInfoScreen } from './src/screens/user-info-screen';
import { ValuePreviewScreen } from './src/screens/value-preview-screen';
import { WhyAccountabilityScreen } from './src/screens/why-accountability-screen';
import { isDebugMode } from './src/lib/debug-mode';
export type { RootStackParamList } from './src/types/navigation';

// Polyfill for structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const auth = useAuth();
  const { user, loading } = auth;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} />
    );
  }

  // Always start with splash screen, then route based on auth state
  let initialRoute: keyof RootStackParamList = 'Splash';
  
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
      signOut: auth.signOut,
      refreshUser: auth.refreshUser,
      updateUser: auth.updateUser
    }}>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />

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
        <Stack.Screen name="OnboardingSuccess" component={OnboardingSuccessScreen} />
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
    'DMSans-Regular': require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('./assets/fonts/DMSans-Medium.ttf'),
    'DMSans-Bold': require('./assets/fonts/DMSans-Bold.ttf'),
  });

  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  if (!fontsLoaded) {
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
