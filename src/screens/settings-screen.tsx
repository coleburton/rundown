import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
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

  useEffect(() => {
    if (user) {
      fetchContacts();
      setUserGoal({
        type: user.goal_type || 'runs',
        value: user.goal_value || user.goal_per_week || 3
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

  const handleDisconnectStrava = async () => {
    if (!user) return;
    
    if (confirm('Are you sure you want to disconnect Strava? This will remove access to your activities.')) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            strava_id: null,
            access_token: null,
          })
          .eq('id', user.id);

        if (error) throw error;
        
        alert('Strava has been disconnected successfully.');
        // Refresh user data
        window.location.reload();
      } catch (error) {
        console.error('Error disconnecting Strava:', error);
        alert('Failed to disconnect Strava. Please try again.');
      }
    }
  };

  const handleConnectStrava = async () => {
    try {
      await signInWithStrava();
      alert('Strava connected successfully!');
    } catch (error) {
      console.error('Error connecting Strava:', error);
      alert('Failed to connect Strava. Please try again.');
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
      alert('Failed to update goal. Please try again.');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to remove this contact?')) {
      try {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId);

        if (error) throw error;
        
        setContacts(contacts.filter(c => c.id !== contactId));
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to remove contact. Please try again.');
      }
    }
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
          <ThemedText style={{ fontSize: 24, fontWeight: 'bold' }}>
            Settings
          </ThemedText>
        </View>

        {/* Fitness Providers Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Fitness Providers
          </ThemedText>
          
          {renderSectionCard(
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>🚴</Text>
                  <ThemedText style={{ fontSize: 16, fontWeight: '500' }}>Strava</ThemedText>
                </View>
                <View style={{ 
                  backgroundColor: user?.strava_id ? '#10b981' : '#ef4444', 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 12 
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                    {user?.strava_id ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              {user?.strava_id ? (
                <Button
                  variant="outline"
                  title="Disconnect Strava"
                  onPress={handleDisconnectStrava}
                />
              ) : (
                <Button
                  title="Connect Strava"
                  onPress={handleConnectStrava}
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
                    alert('Contact setup screen coming soon!');
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
                  alert('Contact setup screen coming soon!');
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