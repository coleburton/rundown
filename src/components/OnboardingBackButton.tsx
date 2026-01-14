import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface OnboardingBackButtonProps {
  onPress?: () => void;
}

export function OnboardingBackButton({ onPress }: OnboardingBackButtonProps) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={styles.arrow}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 16,
    top: 0,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrow: {
    fontSize: 20,
    color: '#374151',
  },
});
