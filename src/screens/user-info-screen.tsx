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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../App';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { VectorIcon } from '../components/ui/IconComponent';
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
  const [errors, setErrors] = useState<Partial<UserInfoData>>({});
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
    const newErrors: Partial<UserInfoData> = {};
    
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
              placeholder="Enter your first name"
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
              placeholder="Enter your last name"
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
              {FITNESS_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.optionCard,
                    userInfo.fitnessLevel === level.id && styles.selectedCard,
                    isDarkMode && styles.darkCard,
                    userInfo.fitnessLevel === level.id && isDarkMode && styles.darkSelectedCard,
                  ]}
                  onPress={() => setUserInfo({ ...userInfo, fitnessLevel: level.id as any })}
                >
                  <VectorIcon 
                    emoji={level.icon as any} 
                    size={22} 
                    color={userInfo.fitnessLevel === level.id ? '#ea580c' : level.color} 
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={[
                    styles.optionLabel,
                    isDarkMode && styles.darkText,
                    userInfo.fitnessLevel === level.id && styles.selectedText
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    isDarkMode && styles.darkSubtitle,
                    userInfo.fitnessLevel === level.id && styles.selectedDescription
                  ]}>
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
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
              {PRIMARY_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.optionCard,
                    userInfo.primaryGoal === goal.id && styles.selectedCard,
                    isDarkMode && styles.darkCard,
                    userInfo.primaryGoal === goal.id && isDarkMode && styles.darkSelectedCard,
                  ]}
                  onPress={() => setUserInfo({ ...userInfo, primaryGoal: goal.id as any })}
                >
                  <VectorIcon 
                    emoji={goal.icon as any} 
                    size={22} 
                    color={userInfo.primaryGoal === goal.id ? '#ea580c' : goal.color} 
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={[
                    styles.optionLabel,
                    isDarkMode && styles.darkText,
                    userInfo.primaryGoal === goal.id && styles.selectedText
                  ]}>
                    {goal.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    isDarkMode && styles.darkSubtitle,
                    userInfo.primaryGoal === goal.id && styles.selectedDescription
                  ]}>
                    {goal.description}
                  </Text>
                </TouchableOpacity>
              ))}
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
    <View style={[
      styles.container,
      isDarkMode ? styles.darkContainer : styles.lightContainer,
      { paddingTop: insets.top }
    ]}>
      <ScreenTracker screenName="UserInfo" />
      <OnboardingStepper currentStep={1} />
      
      {/* Header with progress */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={[styles.backButton, currentStep === 1 && styles.backButtonDisabled]}
          disabled={currentStep === 1}
        >
          <Text style={[
            styles.backButtonText, 
            isDarkMode && styles.darkText,
            currentStep === 1 && styles.backButtonTextDisabled
          ]}>
            ←
          </Text>
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, isDarkMode && styles.darkProgressBar]}>
            <Animated.View 
              style={[
                styles.progressFill,
                { width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                }) }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, isDarkMode && styles.darkSubtitle]}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>


      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
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
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDisabled: {
    opacity: 0.3,
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
  },
  backButtonTextDisabled: {
    color: '#9ca3af',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 8,
  },
  darkProgressBar: {
    backgroundColor: '#374151',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 2,
  },
  progressText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#6b7280',
  },
  socialProof: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  socialProofText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    paddingVertical: 12,
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    ...TYPOGRAPHY_STYLES.h3,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    ...TYPOGRAPHY_STYLES.body1,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
    ...TYPOGRAPHY_STYLES.body1,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 4,
    marginBottom: 8,
  },
  optionCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  darkCard: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  selectedCard: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  darkSelectedCard: {
    backgroundColor: '#431407',
    borderColor: '#f97316',
  },
  optionIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  optionLabel: {
    ...TYPOGRAPHY_STYLES.h6,
    color: '#111827',
    marginBottom: 2,
  },
  optionDescription: {
    ...TYPOGRAPHY_STYLES.body2,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedText: {
    color: '#ea580c',
  },
  selectedDescription: {
    color: '#ea580c',
  },
  errorText: {
    ...TYPOGRAPHY_STYLES.caption1,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 4,
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubtitle: {
    color: '#9ca3af',
  },
});