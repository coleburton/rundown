import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Switch } from '../components/ui/switch';
import { useColorScheme } from '../hooks/useColorScheme';
import { resetOnboardingState } from '../lib/utils';
import { EnhancedGoalPicker, Goal } from '../components/EnhancedGoalPicker';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';

type Contact = Database['public']['Tables']['contacts']['Row'];

type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, signOut, signInWithStrava } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [userGoal, setUserGoal] = useState<Goal>({
    type: user?.goal_type || 'runs',
    value: user?.goal_value || user?.goal_per_week || 3
  });
  
  const [messageTiming, setMessageTiming] = useState({
    day: user?.message_day || 'Sunday',
    timePeriod: user?.message_time_period || 'evening'
  });
  
  const [pendingTiming, setPendingTiming] = useState<{
    field: 'day' | 'timePeriod';
    value: string;
  } | null>(null);

  const DAYS_OF_WEEK = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  const TIME_PERIODS = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' }
  ];

  useEffect(() => {
    if (user) {
      fetchContacts();
      setUserGoal({
        type: user.goal_type || 'runs',
        value: user.goal_value || user.goal_per_week || 3
      });
      setMessageTiming({
        day: user.message_day || 'Sunday',
        timePeriod: user.message_time_period || 'evening'
      });
    }
  }, [user, fetchContacts]);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset the onboarding flow. You will see the onboarding screens next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboardingState();
            Alert.alert('Success', 'Onboarding has been reset. You will see the onboarding flow next time you open the app.');
          }
        }
      ]
    );
  };

  const handleDisconnectStrava = async () => {
    if (!user) return;
    
    Alert.alert(
      'Disconnect Strava',
      'Are you sure you want to disconnect Strava? This will remove access to your activities.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            strava_id: null,
            access_token: null,
          })
          .eq('id', user.id);

        if (error) throw error;
        
        Alert.alert('Success', 'Strava has been disconnected successfully.');
        // Refresh user data
        window.location.reload();
      } catch (error) {
        console.error('Error disconnecting Strava:', error);
        Alert.alert('Error', 'Failed to disconnect Strava. Please try again.');
      }
          }
        }
      ]
    );
  };

  const handleConnectStrava = async () => {
    try {
      await signInWithStrava();
      Alert.alert('Success', 'Strava connected successfully!');
    } catch (error) {
      console.error('Error connecting Strava:', error);
      Alert.alert('Error', 'Failed to connect Strava. Please try again.');
    }
  };

  const handleGoalChange = async (newGoal: Goal) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          goal_per_week: newGoal.type === 'runs' ? newGoal.value : user.goal_per_week,
          goal_type: newGoal.type,
          goal_value: newGoal.value
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setUserGoal(newGoal);
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const handleTimingChange = (field: 'day' | 'timePeriod', value: string) => {
    setPendingTiming({ field, value });
    
    const fieldName = field === 'day' ? 'day of week' : 'time of day';
    const confirmMessage = `Change message ${fieldName} to ${value}?`;
    
    Alert.alert(
      'Update Message Timing',
      confirmMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setPendingTiming(null)
        },
        {
          text: 'Update',
          onPress: () => confirmTimingChange(field, value)
        }
      ]
    );
  };

  const confirmTimingChange = async (field: 'day' | 'timePeriod', value: string) => {
    if (!user) return;
    
    const newTiming = { ...messageTiming, [field]: value };
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          message_day: newTiming.day,
          message_time_period: newTiming.timePeriod
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setMessageTiming(newTiming);
      setPendingTiming(null);
      Alert.alert('Success', 'Message timing updated successfully!');
    } catch (error) {
      console.error('Error updating message timing:', error);
      Alert.alert('Error', 'Failed to update message timing. Please try again.');
      setPendingTiming(null);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId);

        if (error) throw error;
        
        setContacts(contacts.filter(c => c.id !== contactId));
      } catch (error) {
        console.error('Error deleting contact:', error);
        Alert.alert('Error', 'Failed to remove contact. Please try again.');
      }
          }
        }
      ]
    );
  };

  const renderSectionCard = (children: React.ReactNode) => (
    <View style={{ 
      backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', 
      borderRadius: 12, 
      padding: 16,
      marginBottom: 12
    }}>
      {children}
    </View>
  );

  return (
    <ThemedView style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header with back button */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginBottom: 20,
          paddingHorizontal: 4
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ 
              padding: 8, 
              marginRight: 12,
              borderRadius: 8,
              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6'
            }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <ThemedText style={[TYPOGRAPHY_STYLES.h3, { fontWeight: '600' }]}>
            Settings
          </ThemedText>
        </View>

        {/* Fitness Providers Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={[TYPOGRAPHY_STYLES.h5, { marginBottom: 10 }]}>
            Fitness Providers
          </ThemedText>
          
          {renderSectionCard(
            <View style={{ gap: 12 }}>
              {/* Strava */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>🏃‍♂️</Text>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[TYPOGRAPHY_STYLES.body1Medium]}>Strava</ThemedText>
                    <ThemedText style={[TYPOGRAPHY_STYLES.caption1, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>Running & cycling platform</ThemedText>
                  </View>
                </View>
                <View style={{ 
                  backgroundColor: user?.strava_id ? '#10b981' : '#ef4444', 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
                    {user?.strava_id ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              {/* Garmin Connect */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>⌚</Text>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[TYPOGRAPHY_STYLES.body1Medium]}>Garmin Connect</ThemedText>
                    <ThemedText style={[TYPOGRAPHY_STYLES.caption1, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>Garmin device integration</ThemedText>
                  </View>
                </View>
                <View style={{ 
                  backgroundColor: '#94a3b8', 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
                    Coming Soon
                  </Text>
                </View>
              </View>
              
              {/* Fitbit */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>📱</Text>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[TYPOGRAPHY_STYLES.body1Medium]}>Fitbit</ThemedText>
                    <ThemedText style={[TYPOGRAPHY_STYLES.caption1, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>Activity tracking platform</ThemedText>
                  </View>
                </View>
                <View style={{ 
                  backgroundColor: '#94a3b8', 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
                    Coming Soon
                  </Text>
                </View>
              </View>
              
              {/* Apple Health */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>🍎</Text>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[TYPOGRAPHY_STYLES.body1Medium]}>Apple Health</ThemedText>
                    <ThemedText style={[TYPOGRAPHY_STYLES.caption1, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>iOS health integration</ThemedText>
                  </View>
                </View>
                <View style={{ 
                  backgroundColor: '#94a3b8', 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '500' }}>
                    Coming Soon
                  </Text>
                </View>
              </View>
              
              {user?.strava_id ? (
                <Button
                  variant="outline"
                  title="Disconnect Strava"
                  onPress={handleDisconnectStrava}
                  style={{ marginTop: 4 }}
                />
              ) : (
                <Button
                  title="Connect Strava"
                  onPress={handleConnectStrava}
                  style={{ 
                    backgroundColor: '#f97316',
                    marginTop: 4
                  }}
                />
              )}
            </View>
          )}
        </View>

        {/* Goals Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Weekly Goal
          </ThemedText>
          
          {renderSectionCard(
            <View>
              <ThemedText style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: 16 }}>
                Set your weekly fitness goal to stay motivated and track progress.
              </ThemedText>
              <EnhancedGoalPicker 
                value={userGoal} 
                onChange={handleGoalChange}
              />
            </View>
          )}
        </View>

        {/* Message Timing Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Message Timing
          </ThemedText>
          
          {renderSectionCard(
            <View>
              <ThemedText style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: 16 }}>
                Choose when you'd like to receive accountability messages if you miss your goal.
              </ThemedText>
              
              {/* Day Selection */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#374151', marginBottom: 8 }}>
                  Day of Week
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = day === messageTiming.day;
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => handleTimingChange('day', day)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          marginHorizontal: 4,
                          borderRadius: 8,
                          backgroundColor: isSelected ? '#f97316' : (isDarkMode ? '#374151' : '#f3f4f6'),
                          borderWidth: 1,
                          borderColor: isSelected ? '#f97316' : 'transparent',
                        }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: isSelected ? '#ffffff' : (isDarkMode ? '#f3f4f6' : '#374151'),
                        }}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              
              {/* Time Period Selection */}
              <View>
                <Text style={{ fontSize: 15, fontWeight: '500', color: isDarkMode ? '#f3f4f6' : '#374151', marginBottom: 8 }}>
                  Time of Day
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {TIME_PERIODS.map((period) => {
                    const isSelected = period.value === messageTiming.timePeriod;
                    return (
                      <TouchableOpacity
                        key={period.value}
                        onPress={() => handleTimingChange('timePeriod', period.value)}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 8,
                          backgroundColor: isSelected ? '#f97316' : (isDarkMode ? '#374151' : '#f3f4f6'),
                          borderWidth: 1,
                          borderColor: isSelected ? '#f97316' : 'transparent',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: isSelected ? '#ffffff' : (isDarkMode ? '#f3f4f6' : '#374151'),
                        }}>
                          {period.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Preview Message */}
              <View style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: isDarkMode ? '#1f2937' : '#f0fdf4',
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: '#22c55e'
              }}>
                <Text style={{
                  fontSize: 12,
                  color: isDarkMode ? '#9ca3af' : '#15803d',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  📅 Messages will be sent {messageTiming.day} {messageTiming.timePeriod} if you miss your goal
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Contacts Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Accountability Contacts
          </ThemedText>
          
          {loadingContacts ? (
            renderSectionCard(
              <ThemedText>Loading contacts...</ThemedText>
            )
          ) : contacts.length === 0 ? (
            renderSectionCard(
              <View>
                <ThemedText style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: 12 }}>
                  No contacts added yet. Add someone to keep you accountable!
                </ThemedText>
                <Button
                  title="Add Contact"
                  onPress={() => {
                    // TODO: Navigate to contact setup screen
                    Alert.alert('Info', 'Contact setup screen coming soon!');
                  }}
                />
              </View>
            )
          ) : (
            <View>
              {contacts.map((contact) => (
                <View key={contact.id} style={{ 
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff', 
                  borderRadius: 8, 
                  padding: 12,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <View>
                    <ThemedText style={{ fontSize: 16, fontWeight: '500' }}>
                      {contact.name}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                      {contact.relationship || 'Contact'} • {contact.phone_number}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteContact(contact.id)}
                    style={{ padding: 8 }}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <Button
                variant="outline"
                title="Add Another Contact"
                onPress={() => {
                  // TODO: Navigate to contact setup screen
                  Alert.alert('Info', 'Contact setup screen coming soon!');
                }}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </View>

        {/* Account Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Account
          </ThemedText>
          
          {renderSectionCard(
            <View>
              <ThemedText style={{ marginBottom: 12 }}>{user?.email}</ThemedText>
              <Button
                variant="destructive"
                title="Sign Out"
                onPress={handleSignOut}
              />
            </View>
          )}
        </View>

        {/* Appearance Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Appearance
          </ThemedText>
          
          {renderSectionCard(
            <View style={{ 
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
          )}
        </View>

        {/* Developer Options Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Developer Options
          </ThemedText>
          
          {renderSectionCard(
            <Button
              variant="outline"
              title="Reset Onboarding"
              onPress={handleResetOnboarding}
            />
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
} 