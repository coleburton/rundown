import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { IconComponent, VectorIcon } from '../components/ui/IconComponent';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '../constants/OnboardingStyles';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';
import { useColorScheme } from '../hooks/useColorScheme';
import ScreenTracker from '../lib/ScreenTracker';
import analytics, {
	ANALYTICS_EVENTS,
	ONBOARDING_SCREENS,
	USER_PROPERTIES,
	setUserProperties,
	trackFunnelStep,
	trackOnboardingScreenCompleted,
	trackOnboardingScreenView
} from '../lib/analytics';

type UserInfoData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | '';
  primaryGoal: 'consistency' | 'accountability' | 'motivation' | 'habit_building' | '';
};

type UserInfoErrors = Partial<Record<keyof UserInfoData, string>>;

const FITNESS_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'New to running', icon: '🌱', color: '#10b981' },
  { id: 'intermediate', label: 'Intermediate', description: 'Regular runner', icon: '🏃‍♂️', color: '#3b82f6' },
  { id: 'advanced', label: 'Advanced', description: 'Experienced athlete', icon: '🏆', color: '#f59e0b' },
];

const PRIMARY_GOALS = [
  { id: 'consistency', label: 'Build Consistency', description: 'Create lasting habits', icon: '✓', color: '#10b981' },
  { id: 'accountability', label: 'Stay Accountable', description: 'Regular check-ins', icon: '🤝', color: '#8b5cf6' },
  { id: 'motivation', label: 'Stay Motivated', description: 'Positive reinforcement', icon: '🔥', color: '#ef4444' },
  { id: 'habit_building', label: 'Form Good Habits', description: 'Sustainable progress', icon: '📈', color: '#3b82f6' },
];

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function UserInfoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [userInfo, setUserInfo] = useState<UserInfoData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    fitnessLevel: '',
    primaryGoal: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [progressAnim] = useState(new Animated.Value(0.2));
  const [errors, setErrors] = useState<UserInfoErrors>({});
  const [screenStartTime] = useState(Date.now());

  const totalSteps = 5;
  const progress = currentStep / totalSteps;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    // Track screen view when component mounts
    trackOnboardingScreenView(ONBOARDING_SCREENS.USER_INFO, {
      step_number: 1,
      total_steps: 10
    });
    
    return () => {
      // Track time spent on screen
      const timeSpent = Date.now() - screenStartTime;
      analytics.trackEvent(ANALYTICS_EVENTS.SCREEN_VIEW, {
        screen_name: ONBOARDING_SCREENS.USER_INFO,
        time_spent_ms: timeSpent,
        exit_step: currentStep
      });
    };
  }, [screenStartTime, currentStep]);

  const validateStep = (step: number): boolean => {
    const newErrors: UserInfoErrors = {};
    
    switch (step) {
      case 1:
        if (!userInfo.firstName.trim()) newErrors.firstName = 'First name is required';
        break;
      case 2:
        if (!userInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
        break;
      case 3:
        if (!userInfo.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(userInfo.dateOfBirth)) {
          newErrors.dateOfBirth = 'Please use MM/DD/YYYY format';
        }
        break;
      case 4:
        if (!userInfo.fitnessLevel) newErrors.fitnessLevel = 'Please select your fitness level';
        break;
      case 5:
        if (!userInfo.primaryGoal) newErrors.primaryGoal = 'Please select your primary goal';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        // Track step completion
        trackFunnelStep(`user_info_step_${currentStep}`, currentStep, totalSteps, {
          screen: ONBOARDING_SCREENS.USER_INFO,
          field_data: getCurrentStepData()
        });
        
        setCurrentStep(currentStep + 1);
        analytics.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICK, {
          button_name: 'next_step',
          step: currentStep,
          screen: ONBOARDING_SCREENS.USER_INFO
        });
      } else {
        handleSubmit();
      }
    }
  };

  const getCurrentStepData = () => {
    switch (currentStep) {
      case 1: return { first_name: userInfo.firstName };
      case 2: return { last_name: userInfo.lastName };
      case 3: return { date_of_birth: userInfo.dateOfBirth };
      case 4: return { fitness_level: userInfo.fitnessLevel };
      case 5: return { primary_goal: userInfo.primaryGoal };
      default: return {};
    }
  };

  const getStepButtonText = () => {
    switch (currentStep) {
      case 1: return "Nice to meet you!";
      case 2: return "Got it, thanks!";
      case 3: return "Perfect timing!";
      case 4: return "You've got this!";
      case 5: return "Let's make it happen!";
      default: return "Continue";
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    try {
      // Store user info in AsyncStorage to be saved after login
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('pendingUserInfo', JSON.stringify(userInfo));

      // Set user properties for segmentation
      setUserProperties({
        [USER_PROPERTIES.FIRST_NAME]: userInfo.firstName,
        [USER_PROPERTIES.LAST_NAME]: userInfo.lastName,
        [USER_PROPERTIES.DATE_OF_BIRTH]: userInfo.dateOfBirth,
        [USER_PROPERTIES.FITNESS_LEVEL]: userInfo.fitnessLevel,
        [USER_PROPERTIES.PRIMARY_GOAL]: userInfo.primaryGoal,
        [USER_PROPERTIES.ONBOARDING_STEP]: 'user_info_completed'
      });

      // Track completion
      trackOnboardingScreenCompleted(ONBOARDING_SCREENS.USER_INFO, {
        completion_time_ms: Date.now() - screenStartTime,
        user_data: {
          fitness_level: userInfo.fitnessLevel,
          primary_goal: userInfo.primaryGoal,
          has_name: !!(userInfo.firstName && userInfo.lastName),
          has_dob: !!userInfo.dateOfBirth
        }
      });

      analytics.trackEvent(ANALYTICS_EVENTS.USER_PROFILE_UPDATE, {
        fitness_level: userInfo.fitnessLevel,
        primary_goal: userInfo.primaryGoal,
        completion_rate: 100,
        screen: ONBOARDING_SCREENS.USER_INFO
      });
      
      // Navigate to next screen
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

  const formatDateInput = (text: string, previousValue: string) => {
    // If user is deleting, handle it gracefully
    if (text.length < previousValue.length) {
      // If deleting a slash, remove the character before it too
      if (previousValue.charAt(text.length) === '/') {
        return text.slice(0, -1);
      }
      return text;
    }
    
    // Remove all non-digits for processing
    const digits = text.replace(/\D/g, '');
    
    // Limit to 8 digits max (MMDDYYYY)
    const limitedDigits = digits.slice(0, 8);
    
    // Format as MM/DD/YYYY
    if (limitedDigits.length >= 2 && limitedDigits.length < 4) {
      return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length >= 4) {
      return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2, 4)}/${limitedDigits.slice(4)}`;
    }
    return limitedDigits;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>
              What's your first name?
            </Text>
            <Text style={[styles.stepSubtitle, isDarkMode && styles.darkSubtitle]}>
              We'll use this to personalize your experience
            </Text>
            <Input
              value={userInfo.firstName}
              onChangeText={(text) => setUserInfo({ ...userInfo, firstName: text })}
              placeholder="First name"
              variant={errors.firstName ? 'destructive' : 'default'}
              darkMode={isDarkMode}
              style={styles.input}
              autoCapitalize="words"
              autoFocus
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>
              And your last name?
            </Text>
            <Text style={[styles.stepSubtitle, isDarkMode && styles.darkSubtitle]}>
              Almost there, {userInfo.firstName}!
            </Text>
            <Input
              value={userInfo.lastName}
              onChangeText={(text) => setUserInfo({ ...userInfo, lastName: text })}
              placeholder="Last name"
              variant={errors.lastName ? 'destructive' : 'default'}
              darkMode={isDarkMode}
              style={styles.input}
              autoCapitalize="words"
              autoFocus
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>
              When's your birthday?
            </Text>
            <Text style={[styles.stepSubtitle, isDarkMode && styles.darkSubtitle]}>
              We'll use this to personalize your training plans
            </Text>
            <Input
              value={userInfo.dateOfBirth}
              onChangeText={(text) => {
                const formatted = formatDateInput(text, userInfo.dateOfBirth);
                setUserInfo({ ...userInfo, dateOfBirth: formatted });
              }}
              placeholder="MM/DD/YYYY"
              variant={errors.dateOfBirth ? 'destructive' : 'default'}
              darkMode={isDarkMode}
              style={styles.input}
              keyboardType="numeric"
              autoFocus
            />
            {errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>
              What's your fitness level?
            </Text>
            <Text style={[styles.stepSubtitle, isDarkMode && styles.darkSubtitle]}>
              This helps us customize your experience
            </Text>
            <View style={styles.optionsContainer}>
              {FITNESS_LEVELS.map((level) => {
                const selected = userInfo.fitnessLevel === level.id;

                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.optionCard,
                      selected && styles.selectedCard,
                      isDarkMode && styles.darkCard,
                      selected && isDarkMode && styles.darkSelectedCard,
                    ]}
                    onPress={() => setUserInfo({ ...userInfo, fitnessLevel: level.id as any })}
                    accessibilityRole="button"
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionIconWrapper,
                          {
                            borderColor: selected ? level.color : 'transparent',
                            backgroundColor: hexToRgba(level.color, selected ? 0.25 : 0.12),
                          },
                          isDarkMode && { backgroundColor: hexToRgba(level.color, selected ? 0.35 : 0.2) },
                        ]}
                      >
                        <VectorIcon
                          emoji={level.icon as any}
                          size={20}
                          color={selected ? '#ffffff' : level.color}
                        />
                      </View>
                      <View style={styles.optionTextGroup}>
                        <Text style={[
                          styles.optionLabel,
                          isDarkMode && styles.darkText,
                          selected && styles.selectedText
                        ]}>
                          {level.label}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          isDarkMode && styles.darkSubtitle,
                          selected && styles.selectedDescription
                        ]}>
                          {level.description}
                        </Text>
                      </View>
                      {selected && (
                        <View style={[styles.optionCheck, { backgroundColor: level.color }]}>
                          <IconComponent library="Feather" name="check" size={14} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.fitnessLevel && (
              <Text style={styles.errorText}>{errors.fitnessLevel}</Text>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, isDarkMode && styles.darkText]}>
              What's most important to you?
            </Text>
            <Text style={[styles.stepSubtitle, isDarkMode && styles.darkSubtitle]}>
              We'll help you build sustainable habits through positive reinforcement
            </Text>
            <View style={styles.optionsContainer}>
              {PRIMARY_GOALS.map((goal) => {
                const selected = userInfo.primaryGoal === goal.id;

                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.optionCard,
                      selected && styles.selectedCard,
                      isDarkMode && styles.darkCard,
                      selected && isDarkMode && styles.darkSelectedCard,
                    ]}
                    onPress={() => setUserInfo({ ...userInfo, primaryGoal: goal.id as any })}
                    accessibilityRole="button"
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionIconWrapper,
                          {
                            borderColor: selected ? goal.color : 'transparent',
                            backgroundColor: hexToRgba(goal.color, selected ? 0.25 : 0.12),
                          },
                          isDarkMode && { backgroundColor: hexToRgba(goal.color, selected ? 0.35 : 0.2) },
                        ]}
                      >
                        <VectorIcon
                          emoji={goal.icon as any}
                          size={20}
                          color={selected ? '#ffffff' : goal.color}
                        />
                      </View>
                      <View style={styles.optionTextGroup}>
                        <Text style={[
                          styles.optionLabel,
                          isDarkMode && styles.darkText,
                          selected && styles.selectedText
                        ]}>
                          {goal.label}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          isDarkMode && styles.darkSubtitle,
                          selected && styles.selectedDescription
                        ]}>
                          {goal.description}
                        </Text>
                      </View>
                      {selected && (
                        <View style={[styles.optionCheck, { backgroundColor: goal.color }]}>
                          <IconComponent library="Feather" name="check" size={14} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.primaryGoal && (
              <Text style={styles.errorText}>{errors.primaryGoal}</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
        { paddingTop: insets.top }
      ]}
    >
      <ScreenTracker screenName="UserInfo" />
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={isDarkMode ? ['#020617', '#0f172a'] : ['#0f172a', '#1e293b']}
          style={[styles.heroGradient, { paddingTop: 16 }]}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.iconButton, currentStep === 1 && styles.iconButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              disabled={currentStep === 1}
            >
              <IconComponent
                library="Feather"
                name="arrow-left"
                size={18}
                color={currentStep === 1 ? '#94a3b8' : '#f8fafc'}
              />
            </TouchableOpacity>

            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Step {currentStep} of {totalSteps}</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Dashboard')}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip"
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroProgressContainer}>
            <View style={styles.heroProgressTrack}>
              <Animated.View
                style={[
                  styles.heroProgressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.cardSurface,
            styles.cardSurfaceFloating,
            isDarkMode && styles.cardSurfaceDark
          ]}
        >
          {renderStep()}
        </View>
      </ScrollView>

      <View
        style={[
          ONBOARDING_CONTAINER_STYLE,
          styles.footer,
          isDarkMode && styles.darkFooter,
          { paddingBottom: Math.max(16, insets.bottom) }
        ]}
      >
        <Button
          onPress={handleNext}
          variant="default"
          size="lg"
          style={ONBOARDING_BUTTON_STYLE}
          title={getStepButtonText()}
          darkMode={isDarkMode}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#f8fafc',
  },
  darkContainer: {
    backgroundColor: '#020617',
  },
  heroWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  heroGradient: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderRadius: 28,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  heroCopy: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: 'rgba(248, 250, 252, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipButtonText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: '#bae6fd',
  },
  heroProgressContainer: {
    marginTop: 16,
  },
  heroProgressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(248, 250, 252, 0.25)',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 24,
  },
  cardSurface: {
    borderRadius: 28,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  cardSurfaceFloating: {
    marginTop: 16,
    zIndex: 10,
  },
  cardSurfaceDark: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: 'transparent',
  },
  footer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  darkFooter: {
    backgroundColor: '#020617',
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 24,
    lineHeight: 28,
    color: '#0f172a',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    textAlign: 'left',
  },
  optionsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  darkCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#1f2937',
  },
  selectedCard: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  darkSelectedCard: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextGroup: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  optionDescription: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  optionCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
  },
  selectedText: {
    color: '#ea580c',
  },
  selectedDescription: {
    color: '#ea580c',
  },
  errorText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'left',
    marginTop: 4,
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubtitle: {
    color: '#94a3b8',
  },
});
