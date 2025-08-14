import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { isDebugMode } from '../lib/debug-mode';

interface DebugSkipButtonProps {
  onSkip: () => void;
  title?: string;
}

export function DebugSkipButton({ onSkip, title = "Skip for Testing" }: DebugSkipButtonProps) {
  if (!isDebugMode()) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.debugButton} onPress={onSkip}>
      <Text style={styles.debugButtonText}>🚀 {title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  debugButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});