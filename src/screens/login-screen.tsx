import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Alert,
  Linking 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useColorScheme } from '../hooks/useColorScheme';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '../constants/OnboardingStyles';
import { OnboardingStepper } from '../components/OnboardingStepper';
import ScreenTracker from '../lib/ScreenTracker';
import analytics, { 
  ANALYTICS_EVENTS, 
  ONBOARDING_SCREENS, 
  USER_PROPERTIES,
  trackOnboardingScreenView, 
  trackOnboardingScreenCompleted,
  setUserProperties
} from '../lib/analytics';
import type { RootStackParamList } from '../../App';

type LoginData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthMode = 'login' | 'signup';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Partial<LoginData>>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [screenStartTime] = useState(Date.now());

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    // Track screen view when component mounts
    trackOnboardingScreenView(ONBOARDING_SCREENS.LOGIN, {
      step_number: 2,
      total_steps: 10,
      auth_mode: authMode
    });
    
    return () => {
      // Track time spent on screen
      const timeSpent = Date.now() - screenStartTime;
      analytics.trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
        screen_name: ONBOARDING_SCREENS.LOGIN,
        time_spent_ms: timeSpent,
        auth_mode: authMode,
        form_completion: getFormCompletionPercentage()
      });
    };
  }, [screenStartTime, authMode]);

  const getFormCompletionPercentage = () => {
    let completed = 0;
    let total = authMode === 'signup' ? 3 : 2;
    
    if (loginData.email) completed++;
    if (loginData.password) completed++;
    if (authMode === 'signup' && loginData.confirmPassword) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (password: string) => {
    setLoginData({ ...loginData, password });
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginData> = {};
    
    // Email validation
    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    } else if (authMode === 'signup' && loginData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation (only for signup)
    if (authMode === 'signup') {
      if (!loginData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (loginData.password !== loginData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (authMode === 'signup' && !acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set user properties for segmentation
      setUserProperties({
        [USER_PROPERTIES.AUTH_METHOD]: 'email',
        [USER_PROPERTIES.ONBOARDING_STEP]: 'login_completed'
      });

      // Track completion
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.LOGIN, {
        completion_time_ms: Date.now() - screenStartTime,
        auth_mode: authMode,
        password_strength: passwordStrength,
        form_completion: 100,
        accepted_terms: authMode === 'signup' ? acceptedTerms : true
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.USER_SIGN_UP, {
        method: 'email',
        auth_mode: authMode,
        success: true,
        password_strength: passwordStrength,
        screen: ONBOARDING_SCREENS.LOGIN
      });
      
      // Navigate to next screen
      navigation.navigate('Welcome');
    } catch (error) {
      Alert.alert('Error', `Failed to ${authMode === 'login' ? 'sign in' : 'create account'}. Please try again.`);
      
      analytics.trackEvent(ANALYTICS_EVENTS.USER_SIGN_UP, {
        method: 'email',
        auth_mode: authMode,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        screen: ONBOARDING_SCREENS.LOGIN
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return '#ef4444'; // red
      case 2:
      case 3: return '#f59e0b'; // yellow
      case 4:
      case 5: return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'Weak';
      case 2:
      case 3: return 'Medium';
      case 4:
      case 5: return 'Strong';
      default: return '';
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[
      styles.container,
      isDarkMode ? styles.darkContainer : styles.lightContainer,
      { paddingTop: insets.top }
    ]}>
      <ScreenTracker screenName="Login" />
      <OnboardingStepper currentStep={2} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, isDarkMode && styles.darkText]}>
            ←
          </Text>
        </TouchableOpacity>
        
        <View style={styles.authModeToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              authMode === 'login' && styles.activeToggle,
              isDarkMode && styles.darkToggleButton,
            ]}
            onPress={() => {
              setAuthMode('login');
              setErrors({});
              analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
                button_name: 'auth_mode_toggle',
                mode: 'login',
                screen: ONBOARDING_SCREENS.LOGIN,
                previous_mode: authMode
              });
            }}
          >
            <Text style={[
              styles.toggleText,
              authMode === 'login' && styles.activeToggleText,
              isDarkMode && styles.darkText,
            ]}>
              Sign In
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              authMode === 'signup' && styles.activeToggle,
              isDarkMode && styles.darkToggleButton,
            ]}
            onPress={() => {
              setAuthMode('signup');
              setErrors({});
              analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
                button_name: 'auth_mode_toggle',
                mode: 'signup',
                screen: ONBOARDING_SCREENS.LOGIN,
                previous_mode: authMode
              });
            }}
          >
            <Text style={[
              styles.toggleText,
              authMode === 'signup' && styles.activeToggleText,
              isDarkMode && styles.darkText,
            ]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Skip Button for QA */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
                button_name: 'skip_login',
                screen: ONBOARDING_SCREENS.LOGIN,
                auth_mode: authMode
              });
              navigation.navigate('Welcome');
            }}
          >
            <Text style={[styles.skipButtonText, isDarkMode && styles.darkText]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={[styles.title, isDarkMode && styles.darkText]}>
              {authMode === 'login' ? 'Welcome back!' : 'Join the community'}
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>
              {authMode === 'login' 
                ? 'Sign in to continue your fitness journey' 
                : 'Create your account and start achieving your goals'
              }
            </Text>
          </View>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDarkMode && styles.darkSubtitle]}>
                "This app changed my running game completely!" ⭐⭐⭐⭐⭐
              </Text>
              <Text style={[styles.testimonialAuthor, isDarkMode && styles.darkSubtitle]}>
                - Sarah M., Marathon Runner
              </Text>
            </View>
            <Text style={[styles.userCount, isDarkMode && styles.darkSubtitle]}>
              Join 10,000+ runners already crushing their goals
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>
                Email Address
              </Text>
              <Input
                value={loginData.email}
                onChangeText={(text) => setLoginData({ ...loginData, email: text.toLowerCase().trim() })}
                placeholder="Enter your email"
                variant={errors.email ? 'destructive' : 'default'}
                darkMode={isDarkMode}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>
                Password
              </Text>
              <View style={styles.passwordContainer}>
                <Input
                  value={loginData.password}
                  onChangeText={handlePasswordChange}
                  placeholder={authMode === 'login' ? 'Enter your password' : 'Create a secure password'}
                  variant={errors.password ? 'destructive' : 'default'}
                  darkMode={isDarkMode}
                  style={[styles.input, styles.passwordInput]}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Text style={styles.passwordToggleText}>
                    {isPasswordVisible ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
              
              {/* Password Strength Indicator (Signup only) */}
              {authMode === 'signup' && loginData.password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthBar}>
                    <View 
                      style={[
                        styles.strengthFill,
                        { 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getPasswordStrengthColor()
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[
                    styles.strengthText,
                    { color: getPasswordStrengthColor() }
                  ]}>
                    {getPasswordStrengthText()}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input (Signup only) */}
            {authMode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>
                  Confirm Password
                </Text>
                <View style={styles.passwordContainer}>
                  <Input
                    value={loginData.confirmPassword}
                    onChangeText={(text) => setLoginData({ ...loginData, confirmPassword: text })}
                    placeholder="Confirm your password"
                    variant={errors.confirmPassword ? 'destructive' : 'default'}
                    darkMode={isDarkMode}
                    style={[styles.input, styles.passwordInput]}
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  >
                    <Text style={styles.passwordToggleText}>
                      {isConfirmPasswordVisible ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            )}

            {/* Terms Acceptance (Signup only) */}
            {authMode === 'signup' && (
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <View style={[
                  styles.checkbox,
                  acceptedTerms && styles.checkedBox,
                  isDarkMode && styles.darkCheckbox,
                ]}>
                  {acceptedTerms && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[styles.termsText, isDarkMode && styles.darkSubtitle]}>
                  I agree to the{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() => openLink('https://example.com/terms')}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() => openLink('https://example.com/privacy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            )}

            {/* Trust Indicators */}
            <View style={styles.trustIndicators}>
              <Text style={[styles.trustText, isDarkMode && styles.darkSubtitle]}>
                🔒 Bank-level encryption
              </Text>
              <Text style={[styles.trustText, isDarkMode && styles.darkSubtitle]}>
                🛡️ Privacy guaranteed
              </Text>
              <Text style={[styles.trustText, isDarkMode && styles.darkSubtitle]}>
                💯 30-day money-back guarantee
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleSubmit}
          variant="default"
          size="lg"
          style={[ONBOARDING_BUTTON_STYLE, isLoading && styles.loadingButton]}
          title={isLoading 
            ? (authMode === 'login' ? 'Signing In...' : 'Creating Account...') 
            : (authMode === 'login' ? 'Sign In' : 'Create Account - Free!')
          }
          darkMode={isDarkMode}
          disabled={isLoading}
        />
        
        <Text style={[styles.footerText, isDarkMode && styles.darkSubtitle]}>
          {authMode === 'login' 
            ? "Free to start. Cancel anytime." 
            : "Free to start. No credit card required."
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
  },
  authModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  darkToggleButton: {
    backgroundColor: '#374151',
  },
  activeToggle: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    ...TYPOGRAPHY_STYLES.body2Medium,
    color: '#6b7280',
  },
  activeToggleText: {
    color: '#111827',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    ...TYPOGRAPHY_STYLES.body2Medium,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...TYPOGRAPHY_STYLES.h2,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY_STYLES.body1,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  socialProof: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  testimonial: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxWidth: 300,
  },
  testimonialText: {
    ...TYPOGRAPHY_STYLES.body2,
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  testimonialAuthor: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#6b7280',
    textAlign: 'center',
  },
  userCount: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...TYPOGRAPHY_STYLES.body2Medium,
    color: '#374151',
  },
  input: {
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 8,
    bottom: 8,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordToggleText: {
    fontSize: 18,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    ...TYPOGRAPHY_STYLES.caption1,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  darkCheckbox: {
    borderColor: '#374151',
  },
  checkedBox: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#6b7280',
    flex: 1,
    lineHeight: 18,
  },
  linkText: {
    color: '#f97316',
    textDecorationLine: 'underline',
  },
  trustIndicators: {
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  trustText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#6b7280',
  },
  errorText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#ef4444',
  },
  footerText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  loadingButton: {
    opacity: 0.8,
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubtitle: {
    color: '#9ca3af',
  },
});