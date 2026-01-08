import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/button';
import { IconComponent } from '../components/ui/IconComponent';
import { ServiceLogo } from '../components/ServiceLogo';
import { Toast } from '../components/ui/Toast';
import { useAuthContext } from '../lib/auth-context';
import { useUserGoals } from '../hooks/useUserGoals';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { resetOnboardingState } from '../lib/utils';
import { Goal } from '../components/EnhancedGoalPicker';
import { supabase } from '../lib/supabase';
import { StravaConnectionService } from '../services/strava-connection-status';
import StravaAuthService from '../services/strava-auth';
import { Database } from '../types/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';
import { AddContactModal } from '../components/AddContactModal';
import { GoalUpdateModal } from '../components/GoalUpdateModal';
import type { RootStackParamList } from '@/types/navigation';

type Contact = Database['public']['Tables']['contacts']['Row'];

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, signOut, signInWithStrava, refreshUser } = useAuthContext();
  const { activeGoal, refreshGoals } = useUserGoals(user?.id);

  const GOAL_TYPE_VALUES: Goal['type'][] = [
    'total_activities',
    'total_runs',
    'total_miles_running',
    'total_rides_biking',
    'total_miles_biking'
  ];

  const isValidGoalType = (type: string | null | undefined): type is Goal['type'] =>
    !!type && GOAL_TYPE_VALUES.includes(type as Goal['type']);

  const getGoalTypeLabel = (type: string) => {
    const labels = {
      'total_activities': 'activities per week',
      'total_runs': 'runs per week',
      'total_miles_running': 'miles running per week',
      'total_rides_biking': 'rides per week',
      'total_miles_biking': 'miles biking per week'
    };
    return labels[type as keyof typeof labels] || 'activities per week';
  };

  const getGoalTypeDescription = (type: string) => {
    const descriptions = {
      'total_activities': 'Any fitness activities per week',
      'total_runs': 'Running workouts per week',
      'total_miles_running': 'Total running miles per week',
      'total_rides_biking': 'Cycling workouts per week',
      'total_miles_biking': 'Total cycling miles per week'
    };
    return descriptions[type as keyof typeof descriptions] || 'Any fitness activities per week';
  };

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [userGoal, setUserGoal] = useState<Goal>({
    type: 'total_activities',
    value: 3
  });
  
  const [messageTiming, setMessageTiming] = useState({
    day: user?.message_day || 'Sunday',
    timePeriod: user?.message_time_period || 'evening'
  });
  
  const [pendingTiming, setPendingTiming] = useState<{
    field: 'day' | 'timePeriod';
    value: string;
  } | null>(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showGoalUpdateModal, setShowGoalUpdateModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const DAYS_OF_WEEK = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  const TIME_PERIODS = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' }
  ];

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
  }, [user?.id]); // Only recreate when user ID changes, not the entire user object

  useEffect(() => {
    if (user) {
      console.log('[Settings] Loading message timing from user:', {
        message_day: user.message_day,
        message_time_period: user.message_time_period
      });
      fetchContacts();
      setMessageTiming({
        day: user.message_day || 'Sunday',
        timePeriod: user.message_time_period || 'evening'
      });
    }
  }, [user?.id, user?.message_day, user?.message_time_period, fetchContacts]);

  // Update userGoal when activeGoal changes
  useEffect(() => {
    if (activeGoal) {
      setUserGoal({
        type: isValidGoalType(activeGoal.goal_type) ? activeGoal.goal_type : 'total_activities',
        value: Number(activeGoal.target_value)
      });
    } else if (user) {
      // Fallback to users table if no active goal found
      setUserGoal({
        type: isValidGoalType(user.goal_type) ? user.goal_type : 'total_activities',
        value: user.goal_value || user.goal_per_week || 3
      });
    }
  }, [activeGoal, user]);

  // Listen for navigation focus to refresh data when returning to settings
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('[Settings] Screen focused, refreshing data...');
      // Refresh both goals and user profile to ensure we have the latest data
      refreshGoals();
      if (refreshUser) {
        await refreshUser();
        console.log('[Settings] User data refreshed on focus');
      }
    });

    return unsubscribe;
  }, [navigation, refreshGoals, refreshUser]);

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
              // Use new disconnect service (calls edge function)
              const result = await StravaConnectionService.disconnect();

              if (!result.success) {
                throw new Error(result.error || 'Disconnect failed');
              }

              // Clear local tokens
              const stravaAuth = StravaAuthService.getInstance();
              await stravaAuth.clearTokens();

              Alert.alert('Success', 'Strava has been disconnected successfully.');

              // Refresh user data
              if (refreshUser) await refreshUser();
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
    if (!signInWithStrava) return;

    try {
      await signInWithStrava();
      if (refreshUser) await refreshUser(); // Refresh user data to get updated Strava connection
      Alert.alert('Success', 'Strava connected successfully!');
    } catch (error) {
      console.error('Error connecting Strava:', error);
      Alert.alert('Error', 'Failed to connect Strava. Please try again.');
    }
  };

  const handleSyncActivities = async () => {
    if (!user?.strava_id) {
      Alert.alert('Error', 'Please connect Strava first');
      return;
    }

    try {
      console.log('Starting manual Strava sync for user:', user.id);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('Manual sync attempted without a valid Supabase session');
        Alert.alert('Not authenticated', 'Please sign in again to sync your Strava activities.');
        return;
      }

      console.log('Manual sync session info:', {
        hasUser: !!session.user,
        userId: session.user?.id,
        hasToken: !!session.access_token,
      });

      const response = await supabase.functions.invoke('strava-sync', {
        body: {}, // Function uses JWT token to identify user
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Full response:', JSON.stringify(response, null, 2));

      if (response.error) {
        console.error('Error syncing activities:', response.error);
        console.error('Error details:', {
          message: response.error.message,
          status: response.error.context?.status,
          statusText: response.error.context?.statusText,
          body: response.error.context?.body
        });

        // Try to read the response body for more details
        try {
          if (response.error.context?._bodyBlob) {
            const blob = response.error.context._bodyBlob;
            const text = await new Response(blob).text();
            console.error('Response body text:', text);
            try {
              const json = JSON.parse(text);
              console.error('Response body JSON:', json);
            } catch {
              // Not JSON
            }
          }
        } catch (e) {
          console.error('Failed to read response body:', e);
        }

        // Try to parse error from data
        if (response.data) {
          console.error('Error data:', response.data);
        }

        Alert.alert('Sync Failed', `Failed to sync activities: ${response.error.message}`);
      } else {
        console.log('Activities synced successfully:', response.data);
        Alert.alert('Success', `Your Strava activities have been synced! Count: ${response.data?.count || 0}`);
      }
    } catch (error: any) {
      console.error('Error during sync:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'An error occurred while syncing. Please try again.');
    }
  };


  const handleTimingChange = async (field: 'day' | 'timePeriod', value: string) => {
    if (!user) return;

    const previousTiming = { ...messageTiming };
    const newTiming = { ...messageTiming, [field]: value };

    // Optimistic update - update UI immediately
    setMessageTiming(newTiming);

    console.log('[Settings] Updating message timing:', {
      field,
      value,
      newTiming,
      userId: user.id
    });

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          message_day: newTiming.day,
          message_time_period: newTiming.timePeriod
        })
        .eq('id', user.id)
        .select('message_day, message_time_period')
        .single();

      if (error) throw error;

      console.log('[Settings] Database updated successfully:', data);

      // Refresh user data to ensure the auth context has the latest values
      if (refreshUser) {
        console.log('[Settings] Calling refreshUser...');
        await refreshUser();
        console.log('[Settings] refreshUser completed');
      }

      // Show success toast
      setToastMessage('Message timing updated');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('[Settings] Error updating message timing:', error);

      // Rollback on error
      setMessageTiming(previousTiming);

      // Show error toast
      setToastMessage('Failed to update timing');
      setToastType('error');
      setShowToast(true);
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
      backgroundColor: '#f9fafb', 
      borderRadius: 12, 
      padding: 16,
      marginBottom: 12
    }}>
      {children}
    </View>
  );

  return (
    <ThemedView style={{ flex: 1, paddingTop: insets.top }}>
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header with back button */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20, color: '#374151' }}>←</Text>
          </TouchableOpacity>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 28,
            lineHeight: 32,
            letterSpacing: -0.5,
            color: '#111827'
          }}>
            Settings
          </Text>
        </View>

        {/* Fitness Providers Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Fitness Providers
          </Text>
          
          {renderSectionCard(
            <View style={{ gap: 12 }}>
              {/* Strava */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ marginRight: 10, width: 32, height: 32, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <ServiceLogo service="strava" size={28} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[TYPOGRAPHY_STYLES.body1Medium]}>Strava</ThemedText>
                    <ThemedText style={[TYPOGRAPHY_STYLES.caption1, { color: '#6b7280' }]}>Running & cycling platform</ThemedText>
                  </View>
                </View>
                <View style={{ 
                  backgroundColor: user?.strava_id ? '#10b981' : '#ef4444', 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  borderRadius: 8 
                }}>
                  <Text style={{ fontFamily: 'DMSans-Medium', color: 'white', fontSize: 10 }}>
                    {user?.strava_id ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              {/* Garmin Connect */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ marginRight: 10, width: 32, height: 32, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <ServiceLogo service="garmin" size={28} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[TYPOGRAPHY_STYLES.body1Medium]}>Garmin Connect</ThemedText>
                    <ThemedText style={[TYPOGRAPHY_STYLES.caption1, { color: '#6b7280' }]}>Garmin device integration</ThemedText>
                  </View>
                </View>
                <View style={{
                  backgroundColor: '#94a3b8',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontFamily: 'DMSans-Medium' }}>
                    Coming Soon
                  </Text>
                </View>
              </View>

              {/* Apple Health */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ marginRight: 10, width: 32, height: 32, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <ServiceLogo service="apple" size={28} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[TYPOGRAPHY_STYLES.body1Medium]}>Apple Health</ThemedText>
                    <ThemedText style={[TYPOGRAPHY_STYLES.caption1, { color: '#6b7280' }]}>iOS health integration</ThemedText>
                  </View>
                </View>
                <View style={{ 
                  backgroundColor: '#94a3b8', 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  borderRadius: 8 
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontFamily: 'DMSans-Medium' }}>
                    Coming Soon
                  </Text>
                </View>
              </View>
              
              {user?.strava_id ? (
                <View>
                  <Button
                    variant="default"
                    title="Sync Activities"
                    onPress={handleSyncActivities}
                    style={{ marginTop: 4 }}
                  />
                  <Button
                    variant="outline"
                    title="Disconnect Strava"
                    onPress={handleDisconnectStrava}
                    style={{ marginTop: 8 }}
                  />
                  <View style={{ 
                    backgroundColor: '#f8f9fa',
                    borderRadius: 6,
                    padding: 8,
                    marginTop: 8,
                    alignItems: 'center'
                  }}>
                    <Text style={{ 
                      fontSize: 10, 
                      color: '#6b7280',
                      textAlign: 'center',
                      marginBottom: 2
                    }}>
                      Compatible with Strava
                    </Text>
                    <Text style={{ 
                      fontSize: 9, 
                      color: '#9ca3af',
                      textAlign: 'center'
                    }}>
                      Data stored for 7 days max • You can request deletion anytime
                    </Text>
                  </View>
                </View>
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
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Weekly Goal
          </Text>
          
          {renderSectionCard(
            <View>
              <ThemedText style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Set your weekly fitness goal to stay motivated and track progress.
              </ThemedText>
              
              {/* Current Goal Display */}
              <View style={{ 
                backgroundColor: '#f0fdf4', 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#d1fae5'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ marginRight: 8 }}>
                    <IconComponent
                      library="Lucide"
                      name="Target"
                      size={20}
                      color="#10b981"
                    />
                  </View>
                  <Text style={{ fontSize: 16, fontFamily: 'DMSans-Medium', color: '#065f46' }}>
                    Current Goal
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontFamily: 'DMSans-Bold', color: '#047857', marginBottom: 4 }}>
                  {userGoal.value} {getGoalTypeLabel(userGoal.type)}
                </Text>
                <Text style={{ fontFamily: 'DMSans-Regular', fontSize: 14, color: '#059669' }}>
                  {getGoalTypeDescription(userGoal.type)}
                </Text>
              </View>
              
              <Button
                variant="outline"
                title="Update Goal"
                onPress={() => setShowGoalUpdateModal(true)}
                style={{ borderColor: '#f97316', borderWidth: 1 }}
              />
            </View>
          )}
        </View>

        {/* Message Timing Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Message Timing
          </Text>
          
          {renderSectionCard(
            <View>
              <ThemedText style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Choose when you'd like to receive accountability messages if you miss your goal.
              </ThemedText>
              
              {/* Day Selection */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontFamily: 'DMSans-Medium', color: '#374151', marginBottom: 8 }}>
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
                          backgroundColor: isSelected ? '#f97316' : '#f3f4f6',
                          borderWidth: 1,
                          borderColor: isSelected ? '#f97316' : 'transparent',
                        }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontFamily: 'DMSans-Medium',
                          color: isSelected ? '#ffffff' : '#374151',
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
                <Text style={{ fontSize: 15, fontFamily: 'DMSans-Medium', color: '#374151', marginBottom: 8 }}>
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
                          backgroundColor: isSelected ? '#f97316' : '#f3f4f6',
                          borderWidth: 1,
                          borderColor: isSelected ? '#f97316' : 'transparent',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontFamily: 'DMSans-Medium',
                          color: isSelected ? '#ffffff' : '#374151',
                        }}>
                          {period.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Preview Message - Redesigned */}
              <View style={{
                marginTop: 16,
                backgroundColor: '#fff7ed',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#fed7aa',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#ffedd5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IconComponent
                      library="Lucide"
                      name="Bell"
                      size={18}
                      color="#f97316"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 13,
                      fontFamily: 'DMSans-Medium',
                      color: '#9a3412',
                      marginBottom: 4,
                    }}>
                      Accountability Message
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      fontFamily: 'DMSans-Regular',
                      color: '#7c2d12',
                      lineHeight: 18,
                    }}>
                      Your contacts will be notified {messageTiming.day} {messageTiming.timePeriod} if you don't hit your goal
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Contacts Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Accountability Contacts
          </Text>
          
          {loadingContacts ? (
            renderSectionCard(
              <ThemedText>Loading contacts...</ThemedText>
            )
          ) : contacts.length === 0 ? (
            renderSectionCard(
              <View>
                <ThemedText style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                  No contacts added yet. Add someone to keep you accountable!
                </ThemedText>
                <Button
                  title="Add Contact"
                  onPress={() => setShowAddContactModal(true)}
                />
              </View>
            )
          ) : (
            <View>
              {contacts.map((contact) => {
                const isOptedOut = Boolean(contact.opted_out_at);
                return (
                  <View
                    key={contact.id}
                    style={{ 
                      backgroundColor: isOptedOut ? '#fff7ed' : '#ffffff', 
                      borderRadius: 8, 
                      padding: 12,
                      marginBottom: 8,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderWidth: 1,
                      borderColor: isOptedOut ? '#fdba74' : '#e5e7eb'
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <ThemedText style={{ 
                          fontSize: 16, 
                          fontFamily: 'DMSans-Medium',
                          color: isOptedOut ? '#9a3412' : '#111827'
                        }}>
                          {contact.name}
                        </ThemedText>
                        {isOptedOut && (
                          <View style={{ 
                            marginLeft: 8,
                            backgroundColor: '#fee2e2',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 999
                          }}>
                            <Text style={{ 
                              fontSize: 10, 
                              fontFamily: 'DMSans-Medium',
                              color: '#b91c1c'
                            }}>
                              Opted Out
                            </Text>
                          </View>
                        )}
                      </View>
                      <ThemedText style={{ fontSize: 14, color: isOptedOut ? '#b45309' : '#6b7280' }}>
                        {contact.relationship || 'Contact'} • {contact.email}
                      </ThemedText>
                      {isOptedOut && (
                        <Text style={{ fontFamily: 'DMSans-Regular', fontSize: 12, color: '#b45309', marginTop: 4 }}>
                          This buddy is not receiving accountability emails.
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteContact(contact.id)}
                      style={{ padding: 8 }}
                    >
                      <Text style={{ fontFamily: 'DMSans-Bold', color: '#ef4444', fontSize: 18 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              
              <Button
                variant="outline"
                title="Add Another Contact"
                onPress={() => setShowAddContactModal(true)}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </View>

        {/* Add Contact Modal */}
        <AddContactModal
          visible={showAddContactModal}
          onClose={() => setShowAddContactModal(false)}
          onContactAdded={fetchContacts}
        />

        {/* Goal Update Modal */}
        <GoalUpdateModal
          visible={showGoalUpdateModal}
          onClose={() => setShowGoalUpdateModal(false)}
          onGoalUpdated={refreshGoals}
        />

        {/* Message History Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Message History
          </Text>
          
          {renderSectionCard(
            <View>
              <ThemedText style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                View all messages sent to your accountability contacts and scheduled messages.
              </ThemedText>
              <Button
                variant="outline"
                title="View Message History"
                onPress={() => navigation.navigate('MessageHistory')}
                style={{ 
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderColor: '#3b82f6',
                  borderWidth: 1
                }}
              />
            </View>
          )}
        </View>

        {/* Activity History Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Activity History
          </Text>
          
          {renderSectionCard(
            <View>
              <ThemedText style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                View your complete fitness activity history with detailed stats and progress tracking.
              </ThemedText>
              <Button
                variant="outline"
                title="View Activity History"
                onPress={() => navigation.navigate('ActivityHistory')}
                style={{ 
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderColor: '#10b981',
                  borderWidth: 1
                }}
              />
            </View>
          )}
        </View>

        {/* Account Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Account
          </Text>
          
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


        {/* Developer Options Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            Developer Options
          </Text>
          
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
