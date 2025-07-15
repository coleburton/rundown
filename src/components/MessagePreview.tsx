import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
} from 'react-native-reanimated';

interface MessagePreviewProps {
  style?: any;
  messages: string[];
}

export function MessagePreview({ style, messages }: MessagePreviewProps) {
  const animations = messages.map(() => useSharedValue(0));

  useEffect(() => {
    messages.forEach((_, index) => {
      animations[index].value = withDelay(
        index * 500,
        withSequence(
          withSpring(1),
          withDelay(2000, withSpring(0))
        )
      );
    });

    const interval = setInterval(() => {
      messages.forEach((_, index) => {
        animations[index].value = withDelay(
          index * 500,
          withSequence(
            withSpring(1),
            withDelay(2000, withSpring(0))
          )
        );
      });
    }, messages.length * 500 + 3000);

    return () => clearInterval(interval);
  }, [messages]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.phone}>
        <View style={styles.notch} />
        <View style={styles.content}>
          {messages.map((message, index) => {
            const animatedStyle = useAnimatedStyle(() => ({
              opacity: animations[index].value,
              transform: [
                {
                  translateY: interpolate(
                    animations[index].value,
                    [0, 1],
                    [20, 0]
                  ),
                },
                {
                  scale: interpolate(
                    animations[index].value,
                    [0, 1],
                    [0.8, 1]
                  ),
                },
              ],
            }));

            return (
              <Animated.View
                key={index}
                style={[
                  styles.message,
                  index % 2 === 0 ? styles.received : styles.sent,
                  animatedStyle,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    index % 2 === 0 ? styles.receivedText : styles.sentText,
                  ]}
                >
                  {message}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  phone: {
    width: 280,
    height: 400,
    backgroundColor: '#f3f4f6',
    borderRadius: 32,
    padding: 16,
    overflow: 'hidden',
  },
  notch: {
    width: 120,
    height: 24,
    backgroundColor: '#000',
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  message: {
    maxWidth: '80%',
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#f97316',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
  },
  receivedText: {
    color: '#1f2937',
  },
  sentText: {
    color: '#fff',
  },
}); 