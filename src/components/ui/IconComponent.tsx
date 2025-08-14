import React from 'react';
import { Text } from 'react-native';
import { 
  Ionicons, 
  MaterialIcons, 
  FontAwesome5, 
  MaterialCommunityIcons,
  AntDesign,
  Feather
} from '@expo/vector-icons';
import * as LucideIcons from 'lucide-react-native';

type IconLibrary = 'Ionicons' | 'MaterialIcons' | 'FontAwesome5' | 'MaterialCommunityIcons' | 'AntDesign' | 'Feather' | 'Lucide';

interface IconComponentProps {
  name: string;
  size?: number;
  color?: string;
  library?: IconLibrary;
}

export const IconComponent: React.FC<IconComponentProps> = ({ 
  name, 
  size = 24, 
  color = '#000000', 
  library = 'Ionicons' 
}) => {
  if (library === 'Lucide') {
    const LucideIcon = (LucideIcons as any)[name];
    if (LucideIcon) {
      return <LucideIcon size={size} color={color} />;
    }
    // Fallback to text if Lucide icon not found
    return <Text style={{ fontSize: size, color }}>{name}</Text>;
  }

  const IconLib = {
    Ionicons,
    MaterialIcons,
    FontAwesome5,
    MaterialCommunityIcons,
    AntDesign,
    Feather
  }[library];

  return <IconLib name={name as any} size={size} color={color} />;
};

// Icon mapping from emojis to vector icons
export const ICON_MAP = {
  // Activity & Fitness
  '💪': { library: 'Ionicons' as const, name: 'fitness' },
  '🏃‍♂️': { library: 'FontAwesome5' as const, name: 'running' },
  '🏃': { library: 'FontAwesome5' as const, name: 'running' },
  '🚴‍♂️': { library: 'FontAwesome5' as const, name: 'biking' },
  '🚴': { library: 'FontAwesome5' as const, name: 'biking' },
  '🏊‍♂️': { library: 'FontAwesome5' as const, name: 'swimmer' },
  '🚶‍♂️': { library: 'FontAwesome5' as const, name: 'walking' },
  '🏋️‍♂️': { library: 'FontAwesome5' as const, name: 'dumbbell' },
  '🧘‍♂️': { library: 'MaterialCommunityIcons' as const, name: 'meditation' },
  
  // Goals & Progress
  '🎯': { library: 'MaterialIcons' as const, name: 'track-changes' },
  '📊': { library: 'AntDesign' as const, name: 'barschart' },
  '🔥': { library: 'Ionicons' as const, name: 'flame' },
  '🚀': { library: 'AntDesign' as const, name: 'rocket1' },
  '👑': { library: 'FontAwesome5' as const, name: 'crown' },
  
  // Balance & Growth
  '🌱': { library: 'Ionicons' as const, name: 'leaf' },
  '⚖️': { library: 'MaterialCommunityIcons' as const, name: 'scale-balance' },
  
  // Communication & Social
  '💬': { library: 'Ionicons' as const, name: 'chatbubble' },
  '👥': { library: 'Ionicons' as const, name: 'people' },
  '👨‍👩‍👧‍👦': { library: 'Ionicons' as const, name: 'people' },
  
  // UI & Navigation
  '⚙️': { library: 'Ionicons' as const, name: 'settings' },
  '📱': { library: 'Ionicons' as const, name: 'phone-portrait' },
  '📍': { library: 'Ionicons' as const, name: 'location' },
  '📅': { library: 'Ionicons' as const, name: 'calendar' },
  '✓': { library: 'Ionicons' as const, name: 'checkmark' },
  '👋': { library: 'Ionicons' as const, name: 'hand-left' },
  
  // Celebration & Success
  '🎉': { library: 'MaterialCommunityIcons' as const, name: 'party-popper' },
  '🌟': { library: 'Ionicons' as const, name: 'star' },
  '💯': { library: 'MaterialCommunityIcons' as const, name: 'numeric-100-circle' },
  
  // Mood & Expression
  '😤': { library: 'MaterialCommunityIcons' as const, name: 'emoticon-angry' },
  '😏': { library: 'MaterialCommunityIcons' as const, name: 'emoticon-wink' },
  '😬': { library: 'MaterialCommunityIcons' as const, name: 'emoticon-neutral' },
  '😅': { library: 'MaterialCommunityIcons' as const, name: 'emoticon-happy' },
  '😭': { library: 'MaterialCommunityIcons' as const, name: 'emoticon-cry' },
  '😩': { library: 'MaterialCommunityIcons' as const, name: 'emoticon-sad' },
  
  // Items & Objects
  '👟': { library: 'MaterialCommunityIcons' as const, name: 'shoe-sneaker' },
  '🍎': { library: 'MaterialCommunityIcons' as const, name: 'apple' },
  '🎵': { library: 'Ionicons' as const, name: 'musical-notes' },
  '🔍': { library: 'Ionicons' as const, name: 'search' },
  '🛋️': { library: 'MaterialCommunityIcons' as const, name: 'sofa' },
  '📰': { library: 'Ionicons' as const, name: 'newspaper' },
  '🐌': { library: 'MaterialCommunityIcons' as const, name: 'snail' },
  '⏰': { library: 'Ionicons' as const, name: 'alarm' },
  
  // Theme & Mode
  '☀️': { library: 'Ionicons' as const, name: 'sunny' },
  '🌙': { library: 'Ionicons' as const, name: 'moon' },
  
  // Weather & Environment (Lucide)
  '⛰️': { library: 'Lucide' as const, name: 'Mountain' },
  '🌡️': { library: 'Ionicons' as const, name: 'thermometer' },
  
  // Heart & Health (Lucide)
  '❤️': { library: 'Lucide' as const, name: 'HeartPulse' },
  '💓': { library: 'Lucide' as const, name: 'HeartPlus' },
  
  // Performance & Speed (Lucide)
  '📈': { library: 'Lucide' as const, name: 'ChartLine' },
  '⚡': { library: 'Lucide' as const, name: 'Zap' },
  
  // Social & Interaction (Lucide)
  '👍': { library: 'Lucide' as const, name: 'ThumbsUp' },
  '🏆': { library: 'Lucide' as const, name: 'Trophy' },
  
  // Alerts & Status
  '🚨': { library: 'Ionicons' as const, name: 'warning' },
  '📶': { library: 'Ionicons' as const, name: 'cellular' },
  '💡': { library: 'Ionicons' as const, name: 'bulb' },
  
  // Creatures & Fun
  '👻': { library: 'MaterialCommunityIcons' as const, name: 'ghost' },
  '🫥': { library: 'MaterialCommunityIcons' as const, name: 'emoticon-neutral' },
  '🕵️': { library: 'MaterialCommunityIcons' as const, name: 'magnify' },
  '💨': { library: 'Ionicons' as const, name: 'cloudy' },
  '🦄': { library: 'MaterialCommunityIcons' as const, name: 'unicorn' },
  '🌈': { library: 'Ionicons' as const, name: 'color-palette' },
  '🎭': { library: 'MaterialCommunityIcons' as const, name: 'drama-masks' },
  '🎪': { library: 'MaterialCommunityIcons' as const, name: 'circus' },
  '🌪️': { library: 'MaterialCommunityIcons' as const, name: 'weather-tornado' },
  '📺': { library: 'Ionicons' as const, name: 'tv' },
} as const;

interface VectorIconProps {
  emoji: keyof typeof ICON_MAP;
  size?: number;
  color?: string;
  style?: any;
}

export const VectorIcon: React.FC<VectorIconProps> = ({ emoji, size = 24, color = '#000000', style }) => {
  const iconConfig = ICON_MAP[emoji];
  
  if (!iconConfig) {
    // Fallback to text if emoji not mapped
    return <Text style={{ fontSize: size, color, ...style }}>{emoji}</Text>;
  }
  
  return (
    <IconComponent
      library={iconConfig.library}
      name={iconConfig.name}
      size={size}
      color={color}
    />
  );
};

export default VectorIcon;