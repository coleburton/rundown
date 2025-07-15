import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingCarousel } from '../components/OnboardingCarousel';
import { Button } from '../components/ui/button';
import { useColorScheme } from '../hooks/useColorScheme';

type RootStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleContinue = () => {
    navigation.navigate('Welcome');
  };

  return (
    <View style={[
      styles.container, 
      isDarkMode ? styles.darkContainer : styles.lightContainer,
      { paddingTop: insets.top }
    ]}>
      <OnboardingCarousel style={styles.carousel} />
      
      <View style={styles.footer}>
        <Button
          onPress={handleContinue}
          variant="default"
          size="lg"
          style={styles.continueButton}
          title="Get Started"
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
    backgroundColor: '#111827', // gray-900
  },
  carousel: {
    flex: 1,
  },
  footer: {
    padding: 24,
  },
  continueButton: {
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
}); 