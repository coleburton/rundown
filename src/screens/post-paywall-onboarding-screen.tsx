import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../App";
import { Button } from "../components/ui/button";
import { IconComponent } from "../components/ui/IconComponent";
import { useColorScheme } from "../hooks/useColorScheme";
import {
  ONBOARDING_BUTTON_STYLE,
  ONBOARDING_CONTAINER_STYLE,
} from "../constants/OnboardingStyles";

const GETTING_STARTED_ITEMS = [
  {
    iconName: "Activity",
    iconColor: "#f97316",
    title: "Start Moving",
    description: "Begin tracking your activities with your connected apps",
    action: "track",
  },
  {
    iconName: "TrendingUp",
    iconColor: "#22c55e",
    title: "Monitor Progress",
    description:
      "Check your dashboard to see how you're doing towards your goals",
    action: "dashboard",
  },
  {
    iconName: "Sliders",
    iconColor: "#6366f1",
    title: "Adjust Settings",
    description:
      "Fine-tune your goals, notifications, and accountability preferences",
    action: "settings",
  },
];

export function PostPaywallOnboardingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Animations
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const scaleAnimation = useSharedValue(0.9);

  useEffect(() => {
    // Entrance animations
    fadeIn.value = withDelay(100, withSpring(1));
    slideUp.value = withDelay(200, withSpring(0));
    scaleAnimation.value = withDelay(300, withSpring(1));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }, { scale: scaleAnimation.value }],
  }));

  const handleContinue = () => {
    navigation.navigate("Dashboard");
  };

  return (
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      <LinearGradient
        colors={
          isDarkMode
            ? ["#0f172a", "#1e293b", "#334155"]
            : ["#ffffff", "#f8fafc", "#e2e8f0"]
        }
        style={styles.gradient}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, containerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.heroSection}>
              <IconComponent
                library="Lucide"
                name="PartyPopper"
                size={64}
                color="#f97316"
              />
              <View style={styles.sparkles}>
                <View style={[styles.sparkle, { top: 5, left: 15 }]}>
                  <IconComponent
                    library="Lucide"
                    name="Sparkles"
                    size={14}
                    color="#fbbf24"
                  />
                </View>
                <View style={[styles.sparkle, { top: 25, right: 10 }]}>
                  <IconComponent
                    library="Lucide"
                    name="Star"
                    size={14}
                    color="#f59e0b"
                  />
                </View>
                <View style={[styles.sparkle, { bottom: 15, left: 5 }]}>
                  <IconComponent
                    library="Lucide"
                    name="Zap"
                    size={14}
                    color="#8b5cf6"
                  />
                </View>
                <View style={[styles.sparkle, { bottom: 5, right: 20 }]}>
                  <IconComponent
                    library="Lucide"
                    name="Flame"
                    size={14}
                    color="#ef4444"
                  />
                </View>
              </View>
            </View>
            <Text style={[styles.title, isDarkMode && styles.darkText]}>
              Welcome to Rundown!
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.darkSubtext]}>
              Your accountability system is now active
            </Text>
          </View>

          {/* Next Steps Content */}
          <View style={styles.nextStepsContent}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              What's Next?
            </Text>
            <Text
              style={[styles.sectionSubtitle, isDarkMode && styles.darkSubtext]}
            >
              Ready to start your accountability journey:
            </Text>

            {GETTING_STARTED_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionItem, isDarkMode && styles.darkActionItem]}
                onPress={() => {
                  // Handle navigation to specific sections later
                }}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    isDarkMode && styles.darkActionIconContainer,
                  ]}
                >
                  <IconComponent
                    library="Lucide"
                    name={item.iconName}
                    size={20}
                    color={item.iconColor}
                  />
                </View>
                <View style={styles.actionContent}>
                  <Text
                    style={[styles.actionTitle, isDarkMode && styles.darkText]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.actionDescription,
                      isDarkMode && styles.darkSubtext,
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed bottom section */}
      <View
        style={[
          ONBOARDING_CONTAINER_STYLE,
          isDarkMode && styles.darkBottomSection,
          { paddingBottom: Math.max(16, insets.bottom) },
        ]}
      >
        <Button
          onPress={handleContinue}
          size="lg"
          title="Let's Get Started!"
          style={ONBOARDING_BUTTON_STYLE}
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
    backgroundColor: "#ffffff",
  },
  darkContainer: {
    backgroundColor: "#0f172a",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 120,
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 0,
  },
  heroSection: {
    position: "relative",
    marginBottom: 6,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 64,
  },
  sparkles: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#1f2937",
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
    maxWidth: 280,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  darkActionItem: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  darkActionIconContainer: {
    backgroundColor: "#334155",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 18,
  },
  actionChevron: {
    marginLeft: 8,
  },
  chevron: {
    fontSize: 20,
    color: "#9ca3af",
    fontWeight: "bold",
  },
  darkBottomSection: {
    backgroundColor: "#1e293b",
    borderTopColor: "#334155",
  },
  darkText: {
    color: "#f9fafb",
  },
  darkSubtext: {
    color: "#d1d5db",
  },
  nextStepsContent: {
    padding: 20,
    marginTop: 30,
    marginBottom: 16,
  },
});
