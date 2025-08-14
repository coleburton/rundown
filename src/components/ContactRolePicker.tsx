import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { VectorIcon } from './ui/IconComponent';

interface ContactRolePickerProps {
  onSelect: (role: string) => void;
  style?: any;
  initialValue?: string;
}

const ROLE_SUGGESTIONS = [
  {
    title: 'Family Member',
    description: 'Family knows how to keep you accountable',
    emoji: '👨‍👩‍👧‍👦' as const,
  },
  {
    title: 'Best Friend',
    description: 'They know all your excuses already',
    emoji: '❤️' as const, // Using heart as fallback for handshake
  },
  {
    title: 'Gym Buddy',
    description: 'Your swolemate who keeps it real',
    emoji: '💪' as const,
  },
  {
    title: 'Partner',
    description: 'Love means keeping each other accountable',
    emoji: '❤️' as const,
  },
  {
    title: 'Coach',
    description: 'Your personal drill sergeant',
    emoji: '🏃‍♂️' as const,
  },
  {
    title: 'Sibling',
    description: 'Built-in competition since day one',
    emoji: '👥' as const,
  },
];

export function ContactRolePicker({ onSelect, style, initialValue }: ContactRolePickerProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(initialValue || 'Coach');
  const animation = useSharedValue(0);
  
  // Select default role on mount if initialValue is provided
  useEffect(() => {
    if (initialValue) {
      setSelectedRole(initialValue);
      onSelect(initialValue);
    } else if (!selectedRole) {
      // Default to Coach if no role is selected
      setSelectedRole('Coach');
      onSelect('Coach');
    }
  }, [initialValue]);

  const handleSelect = (role: string) => {
    console.log('ContactRolePicker - role selected:', role);
    setSelectedRole(role);
    onSelect(role);
    
    // Trigger animation
    animation.value = 0;
    animation.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    }, (finished) => {
      if (finished) {
        runOnJS(resetAnimation)();
      }
    });
  };
  
  const resetAnimation = () => {
    animation.value = withSpring(0);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Suggested Roles</Text>
      <Text style={styles.subtitle}>Who's best suited to keep you in check?</Text>

      <View style={styles.grid}>
        {ROLE_SUGGESTIONS.map((role) => {
          const isSelected = role.title === selectedRole;

          const animatedStyle = useAnimatedStyle(() => {
            if (!isSelected) return {};
            
            return {
              transform: [
                {
                  scale: interpolate(
                    animation.value,
                    [0, 0.5, 1],
                    [1, 1.1, 1]
                  ),
                },
              ],
            };
          });

          return (
            <Animated.View
              key={role.title}
              style={[styles.roleCard, animatedStyle]}
            >
              <TouchableOpacity
                onPress={() => handleSelect(role.title)}
                style={[
                  styles.roleButton,
                  isSelected && styles.roleButtonSelected,
                ]}
              >
                <VectorIcon emoji={role.emoji} size={32} color="#6b7280" style={{ marginBottom: 8 }} />
                <Text style={[
                  styles.roleTitle,
                  isSelected && styles.roleTitleSelected,
                ]}>
                  {role.title}
                </Text>
                <Text style={styles.roleDescription}>
                  {role.description}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  roleCard: {
    width: '50%',
    padding: 6,
  },
  roleButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120,
    justifyContent: 'center',
  },
  roleButtonSelected: {
    backgroundColor: '#fff',
    borderColor: '#f97316',
  },
  roleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: '#f97316',
  },
  roleDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 