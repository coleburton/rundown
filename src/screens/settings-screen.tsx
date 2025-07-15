import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Settings: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  } as ViewStyle,
  
  lightContainer: {
    backgroundColor: '#ffffff',
  } as ViewStyle,
  
  darkContainer: {
    backgroundColor: '#111827', // gray-900
  } as ViewStyle,
  
  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  } as ViewStyle,
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  } as TextStyle,
  
  headerTitleLight: {
    color: '#111827', // gray-900
  } as TextStyle,
  
  headerTitleDark: {
    color: '#ffffff',
  } as TextStyle,
  
  headerSpacer: {
    width: 40,
  } as ViewStyle,
  
  // Content
  contentContainer: {
    flex: 1,
  } as ViewStyle,
  
  // Section styles
  sectionContainer: {
    marginBottom: 24,
  } as ViewStyle,
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  } as TextStyle,
  
  sectionTitleLight: {
    color: '#111827', // gray-900
  } as TextStyle,
  
  sectionTitleDark: {
    color: '#ffffff',
  } as TextStyle,
  
  // Setting card styles
  settingCard: {
    borderRadius: 16, // rounded-2xl
    padding: 16,
    marginBottom: 12,
  } as ViewStyle,
  
  settingCardLight: {
    backgroundColor: '#f9fafb', // gray-50
  } as ViewStyle,
  
  settingCardDark: {
    backgroundColor: '#1f2937', // gray-800
  } as ViewStyle,
  
  // Setting item styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  } as ViewStyle,
  
  settingItemWithSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
    paddingBottom: 16,
    marginBottom: 16,
  } as ViewStyle,
  
  settingItemWithSeparatorDark: {
    borderBottomColor: '#374151', // gray-700
  } as ViewStyle,
  
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  } as TextStyle,
  
  settingTextContainer: {
    flex: 1,
  } as ViewStyle,
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  } as TextStyle,
  
  settingTitleLight: {
    color: '#111827', // gray-900
  } as TextStyle,
  
  settingTitleDark: {
    color: '#ffffff',
  } as TextStyle,
  
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  
  settingDescriptionLight: {
    color: '#6b7280', // gray-500
  } as TextStyle,
  
  settingDescriptionDark: {
    color: '#9ca3af', // gray-400
  } as TextStyle,
  
  // Destructive button styles
  destructiveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  } as ViewStyle,
  
  destructiveButtonLight: {
    backgroundColor: '#fef2f2', // red-50
    borderWidth: 1,
    borderColor: '#fecaca', // red-200
  } as ViewStyle,
  
  destructiveButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500 with opacity
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  } as ViewStyle,
  
  destructiveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626', // red-600
  } as TextStyle,
});

export function SettingsScreen({ navigation }: Props) {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDarkMode = colorScheme === 'dark';
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [weeklyReportsEnabled, setWeeklyReportsEnabled] = React.useState(true);
  const [friendsCanSeeEnabled, setFriendsCanSeeEnabled] = React.useState(false);
  const [strictModeEnabled, setStrictModeEnabled] = React.useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeleteAccount = () => {
    // Handle delete account logic
    console.log('Delete account pressed');
  };

  const handleContactSupport = () => {
    // Handle contact support logic
    console.log('Contact support pressed');
  };

  return (
    <View 
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
        { paddingTop: insets.top }
      ]}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleBack}
          style={styles.backButton}
          darkMode={isDarkMode}
        >
          <Text style={{ fontSize: 20 }}>←</Text>
        </Button>
        
        <Text style={[
          styles.headerTitle,
          isDarkMode ? styles.headerTitleDark : styles.headerTitleLight
        ]}>
          Settings
        </Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Settings Content */}
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <View style={styles.sectionContainer}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode ? styles.sectionTitleDark : styles.sectionTitleLight
          ]}>
            Appearance
          </Text>
          
          <View style={[
            styles.settingCard,
            isDarkMode ? styles.settingCardDark : styles.settingCardLight
          ]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>
                  {isDarkMode ? '🌙' : '☀️'}
                </Text>
                <View style={styles.settingTextContainer}>
                  <Text style={[
                    styles.settingTitle,
                    isDarkMode ? styles.settingTitleDark : styles.settingTitleLight
                  ]}>
                    Dark Mode
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    isDarkMode ? styles.settingDescriptionDark : styles.settingDescriptionLight
                  ]}>
                    Easy on the eyes
                  </Text>
                </View>
              </View>
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleColorScheme}
                darkMode={isDarkMode}
              />
            </View>
          </View>
        </View>

        {/* Accountability Section */}
        <View style={styles.sectionContainer}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode ? styles.sectionTitleDark : styles.sectionTitleLight
          ]}>
            Accountability
          </Text>
          
          <View style={[
            styles.settingCard,
            isDarkMode ? styles.settingCardDark : styles.settingCardLight
          ]}>
            <View style={[
              styles.settingItem,
              styles.settingItemWithSeparator,
              isDarkMode && styles.settingItemWithSeparatorDark
            ]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>💬</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={[
                    styles.settingTitle,
                    isDarkMode ? styles.settingTitleDark : styles.settingTitleLight
                  ]}>
                    Text Notifications
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    isDarkMode ? styles.settingDescriptionDark : styles.settingDescriptionLight
                  ]}>
                    Get reminded when you're slacking
                  </Text>
                </View>
              </View>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                darkMode={isDarkMode}
              />
            </View>
            
            <View style={[
              styles.settingItem,
              styles.settingItemWithSeparator,
              isDarkMode && styles.settingItemWithSeparatorDark
            ]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>👥</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={[
                    styles.settingTitle,
                    isDarkMode ? styles.settingTitleDark : styles.settingTitleLight
                  ]}>
                    Friends Can See Progress
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    isDarkMode ? styles.settingDescriptionDark : styles.settingDescriptionLight
                  ]}>
                    Share your shame publicly
                  </Text>
                </View>
              </View>
              <Switch
                checked={friendsCanSeeEnabled}
                onCheckedChange={setFriendsCanSeeEnabled}
                darkMode={isDarkMode}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🔔</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={[
                    styles.settingTitle,
                    isDarkMode ? styles.settingTitleDark : styles.settingTitleLight
                  ]}>
                    Strict Mode
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    isDarkMode ? styles.settingDescriptionDark : styles.settingDescriptionLight
                  ]}>
                    No mercy, no excuses
                  </Text>
                </View>
              </View>
              <Switch
                checked={strictModeEnabled}
                onCheckedChange={setStrictModeEnabled}
                darkMode={isDarkMode}
              />
            </View>
          </View>
        </View>

        {/* Reports Section */}
        <View style={styles.sectionContainer}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode ? styles.sectionTitleDark : styles.sectionTitleLight
          ]}>
            Reports
          </Text>
          
          <View style={[
            styles.settingCard,
            isDarkMode ? styles.settingCardDark : styles.settingCardLight
          ]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📊</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={[
                    styles.settingTitle,
                    isDarkMode ? styles.settingTitleDark : styles.settingTitleLight
                  ]}>
                    Weekly Reports
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    isDarkMode ? styles.settingDescriptionDark : styles.settingDescriptionLight
                  ]}>
                    Get a summary of your failures
                  </Text>
                </View>
              </View>
              <Switch
                checked={weeklyReportsEnabled}
                onCheckedChange={setWeeklyReportsEnabled}
                darkMode={isDarkMode}
              />
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.sectionContainer}>
          <Text style={[
            styles.sectionTitle,
            isDarkMode ? styles.sectionTitleDark : styles.sectionTitleLight
          ]}>
            Support
          </Text>
          
          <View style={[
            styles.settingCard,
            isDarkMode ? styles.settingCardDark : styles.settingCardLight
          ]}>
            <Button
              variant="ghost"
              onPress={handleContactSupport}
              style={{ justifyContent: 'flex-start', paddingHorizontal: 0 }}
              darkMode={isDarkMode}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📧</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={[
                    styles.settingTitle,
                    isDarkMode ? styles.settingTitleDark : styles.settingTitleLight
                  ]}>
                    Contact Support
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    isDarkMode ? styles.settingDescriptionDark : styles.settingDescriptionLight
                  ]}>
                    We're here to help (sometimes)
                  </Text>
                </View>
              </View>
            </Button>
          </View>
        </View>

        {/* Danger Zone */}
        <Button
          variant="ghost"
          onPress={handleDeleteAccount}
          style={[
            styles.destructiveButton,
            isDarkMode ? styles.destructiveButtonDark : styles.destructiveButtonLight
          ]}
          darkMode={isDarkMode}
        >
          <Text style={styles.destructiveButtonText}>
            🗑️ Delete Account
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
} 