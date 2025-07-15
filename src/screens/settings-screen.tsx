import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Switch } from '../components/ui/switch';
import { useColorScheme } from '../hooks/useColorScheme';
import { resetOnboardingState } from '../lib/utils';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleSignOut = () => {
    // Simple confirmation without using Alert API
    if (confirm('Are you sure you want to sign out?')) {
      signOut();
    }
  };

  const handleResetOnboarding = async () => {
    // Simple confirmation without using Alert API
    if (confirm('This will reset the onboarding flow. You will see the onboarding screens next time you open the app.')) {
      await resetOnboardingState();
      alert('Onboarding has been reset. You will see the onboarding flow next time you open the app.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ThemedText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Settings
        </ThemedText>

        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Account
          </ThemedText>
          
          <View style={{ 
            backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', 
            borderRadius: 12, 
            padding: 16,
            marginBottom: 10
          }}>
            <ThemedText>{user?.email}</ThemedText>
          </View>
          
          <Button
            variant="destructive"
            title="Sign Out"
            onPress={handleSignOut}
            style={{ marginTop: 10 }}
          />
        </View>

        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Appearance
          </ThemedText>
          
          <View style={{ 
            backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', 
            borderRadius: 12, 
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <ThemedText>Dark Mode</ThemedText>
            <Switch 
              checked={isDarkMode} 
              onCheckedChange={toggleColorScheme} 
            />
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Developer Options
          </ThemedText>
          
          <Button
            variant="outline"
            title="Reset Onboarding"
            onPress={handleResetOnboarding}
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
} 