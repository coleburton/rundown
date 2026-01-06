import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { IconComponent } from './IconComponent';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export function Toast({
  visible,
  message,
  type = 'success',
  duration = 2000,
  onHide
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Fade in and slide down
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#f0fdf4',
          borderColor: '#10b981',
          iconColor: '#10b981',
          textColor: '#065f46',
          iconName: 'CheckCircle2' as const,
        };
      case 'error':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          iconColor: '#ef4444',
          textColor: '#991b1b',
          iconName: 'AlertCircle' as const,
        };
      case 'info':
      default:
        return {
          backgroundColor: '#fff7ed',
          borderColor: '#f97316',
          iconColor: '#f97316',
          textColor: '#7c2d12',
          iconName: 'Info' as const,
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: toastStyle.backgroundColor,
            borderColor: toastStyle.borderColor,
          },
        ]}
      >
        <IconComponent
          library="Lucide"
          name={toastStyle.iconName}
          size={18}
          color={toastStyle.iconColor}
        />
        <Text
          style={[
            styles.message,
            { color: toastStyle.textColor },
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
  },
  message: {
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    flex: 1,
  },
});
