import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { VectorIcon, ICON_MAP } from './ui/IconComponent';

interface ContactRolePickerProps {
  onSelect: (role: string) => void;
  style?: any;
  initialValue?: string;
}

interface RoleCardProps {
  role: {
    title: string;
    description: string;
    emoji: keyof typeof ICON_MAP;
  };
  isSelected: boolean;
  onSelect: () => void;
  animation: SharedValue<number>;
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
    emoji: '❤️' as const,
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

function RoleCard({ role, isSelected, onSelect, animation }: RoleCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (!isSelected) return {};

    return {
      transform: [
        {
          scale: interpolate(
            animation.value,
            [0, 0.5, 1],
            [1, 1.05, 1]
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.roleCard, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onSelect}
        activeOpacity={0.7}
        style={[
          styles.roleButton,
          isSelected && styles.roleButtonSelected,
        ]}
      >
        {/* Emoji Icon */}
        <View style={[
          styles.iconContainer,
          isSelected && styles.iconContainerSelected
        ]}>
          <VectorIcon
            emoji={role.emoji}
            size={28}
            color={isSelected ? '#f97316' : '#6b7280'}
          />
        </View>

        {/* Role Title */}
        <Text style={[
          styles.roleTitle,
          isSelected && styles.roleTitleSelected,
        ]}>
          {role.title}
        </Text>

        {/* Role Description */}
        <Text style={[
          styles.roleDescription,
          isSelected && styles.roleDescriptionSelected,
        ]}>
          {role.description}
        </Text>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

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
      damping: 12,
      stiffness: 150,
    });
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Suggested Roles</Text>
      <Text style={styles.subtitle}>Who's best suited to keep you in check?</Text>

      <View style={styles.grid}>
        {ROLE_SUGGESTIONS.map((role) => (
          <RoleCard
            key={role.title}
            role={role}
            isSelected={role.title === selectedRole}
            onSelect={() => handleSelect(role.title)}
            animation={animation}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'DMSans-Regular',
    color: '#6b7280',
    marginBottom: 18,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  roleCard: {
    width: '50%',
    padding: 5,
  },
  roleButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    height: 130,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  roleButtonSelected: {
    backgroundColor: '#fff7ed',
    borderColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconContainerSelected: {
    backgroundColor: '#ffedd5',
    borderColor: '#fed7aa',
  },
  roleTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  roleTitleSelected: {
    color: '#ea580c',
  },
  roleDescription: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 2,
  },
  roleDescriptionSelected: {
    color: '#9a3412',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#f97316',
  },
});
