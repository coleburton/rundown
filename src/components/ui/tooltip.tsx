import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconComponent } from './IconComponent';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
  icon?: string;
  iconLibrary?: 'Lucide' | 'MaterialIcons';
  position?: 'top' | 'bottom' | 'left' | 'right';
  style?: any;
  textStyle?: any;
  isDarkMode?: boolean;
}

export function Tooltip({ 
  text, 
  children,
  icon = 'HelpCircle',
  iconLibrary = 'Lucide',
  position = 'bottom',
  style,
  textStyle,
  isDarkMode = false
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const toggleTooltip = () => {
    setVisible(!visible);
  };

  const getTooltipPosition = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', marginBottom: 8 };
      case 'left':
        return { right: '100%', marginRight: 8 };
      case 'right':
        return { left: '100%', marginLeft: 8 };
      default: // bottom
        return { top: '100%', marginTop: 8 };
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={toggleTooltip} style={styles.trigger}>
        {children || (
          <IconComponent
            library={iconLibrary}
            name={icon}
            size={20}
            color={isDarkMode ? '#9ca3af' : '#6b7280'}
          />
        )}
      </TouchableOpacity>
      
      {visible && (
        <View style={[
          styles.tooltip,
          getTooltipPosition(),
          isDarkMode ? styles.darkTooltip : styles.lightTooltip
        ]}>
          <Text style={[
            styles.tooltipText,
            isDarkMode ? styles.darkText : styles.lightText,
            textStyle
          ]}>
            {text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    padding: 4,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 250,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  lightTooltip: {
    backgroundColor: '#374151',
  },
  darkTooltip: {
    backgroundColor: '#1f2937',
  },
  tooltipText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  lightText: {
    color: '#ffffff',
  },
  darkText: {
    color: '#f9fafb',
  },
});