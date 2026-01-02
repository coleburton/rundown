import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DebugSkipButton } from '@/components/DebugSkipButton';
import { ContactRolePicker } from '@/components/ContactRolePicker';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { Tooltip } from '@/components/ui/tooltip';
import { formatEmail, isValidEmail } from '@/lib/utils';
import analytics, { 
  ANALYTICS_EVENTS, 
  ONBOARDING_SCREENS, 
  USER_PROPERTIES,
  trackOnboardingScreenView, 
  trackOnboardingScreenCompleted,
  trackOnboardingError,
  trackFunnelStep,
  setUserProperties
} from '../lib/analytics';

type RootStackParamList = {
  GoalSetup: undefined;
  MotivationQuiz: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ContactSetup'>;

type Contact = {
  id?: string;
  name: string;
  email: string;
  role?: string;
};

export function ContactSetupScreen({ navigation }: Props) {
  const { user } = useMockAuth();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState<Contact>({ name: '', email: '', role: 'Coach' });
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [screenStartTime] = useState(Date.now());

  // Track screen view on mount
  useEffect(() => {
    try {
      trackOnboardingScreenView(ONBOARDING_SCREENS.CONTACT_SETUP, {
        step_number: 7,
        total_steps: 9
      });
      
      analytics.trackEvent(ANALYTICS_EVENTS.CONTACT_SETUP_STARTED);
    } catch (error) {
      trackOnboardingError(error as Error, {
        screen: ONBOARDING_SCREENS.CONTACT_SETUP,
        action: 'screen_view_tracking'
      });
    }
  }, []);

  // Check if form is valid
  const isValid = newContact.name.trim() && isValidEmail(newContact.email);

  // Clear error when form inputs change
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [newContact.name, newContact.email, newContact.role]);


  const handleAddContact = () => {
    console.log('Add Contact button pressed');
    
    try {
      // Basic validation
      if (!newContact.name.trim()) {
        setError('Please enter a name');
        return;
      }
      
      if (!isValidEmail(newContact.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Create the contact object
      const contact = {
        id: Date.now().toString(),
        name: newContact.name.trim(),
        email: formatEmail(newContact.email),
        role: newContact.role || 'Coach'
      };
      
      // Check if we already have 5 contacts
      if (contacts.length >= 5) {
        setError('You can only add up to 5 contacts');
        return;
      }
      
      // Check for duplicate emails
      const emailLower = newContact.email.toLowerCase();
      if (contacts.some(c => c.email.toLowerCase() === emailLower)) {
        setError('This email address has already been added');
        return;
      }
      
      // Add to contacts array
      const updatedContacts = [...contacts, contact];
      setContacts(updatedContacts);
      console.log('Contact added:', contact);
      console.log('Updated contacts:', updatedContacts);
      
      // Reset form
      setNewContact({ name: '', email: '', role: 'Coach' });
      setFormKey(prev => prev + 1);
      setError(null);
      
    } catch (err) {
      console.error('Error adding contact:', err);
      setError('Failed to add contact');
    }
  };

  const handleRoleSelect = (role: string) => {
    console.log('Role selected:', role);
    setNewContact({...newContact, role});
  };

  const handleRemoveContact = (contactId: string) => {
    setContacts(contacts.filter(contact => contact.id !== contactId));
  };

  const handleNext = () => {
    if (contacts.length === 0) {
      setError('Please add at least one contact');
      return;
    }
    
    navigation.navigate('MessageStyle');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back Button */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
        <TouchableOpacity 
          onPress={handleBack}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 4
          }}
        >
          <Text style={{ fontSize: 16, color: '#6b7280', marginRight: 8 }}>←</Text>
          <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500' }}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
      >
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', flex: 1 }}>
              Add your accountability buddy
            </Text>
            <Tooltip 
              text="Choose someone who will motivate you - a coach, friend, or family member who cares about your goals."
              style={{ marginLeft: 8 }}
            />
          </View>
          <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 12 }}>
            Who should we email when you're slacking?
          </Text>
          
          {/* Timing Information - Compact */}
          <View style={{
            backgroundColor: '#f0fdf4',
            borderRadius: 8,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: '#22c55e'
          }}>
            <Text style={{
              fontSize: 13,
              color: '#15803d',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              📅 Emails sent Sunday evening if you miss your weekly goal
            </Text>
          </View>
        </View>
        
        {error && (
          <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#fef2f2', borderRadius: 8 }}>
            <Text style={{ color: '#dc2626', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Input Fields */}
        <View style={{ marginBottom: 16 }}>
          <Input
            placeholder="Name"
            value={newContact.name}
            onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            style={{ 
              marginBottom: 12, 
              borderRadius: 12, 
              height: 52, 
              fontSize: 16,
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
            }}
          />
          <Input
            placeholder="Email address"
            value={newContact.email}
            onChangeText={(text) => {
              const formatted = formatEmail(text);
              setNewContact({ ...newContact, email: formatted });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            style={{
              marginBottom: 12,
              borderRadius: 12,
              height: 52,
              fontSize: 16,
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
            }}
          />
        </View>
        
        {/* Selected Role Display - Compact */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#6b7280', marginBottom: 6 }}>
            Selected role: <Text style={{ color: '#f97316', fontWeight: '600' }}>{newContact.role}</Text>
          </Text>
          
          {/* Message Preview - Compact */}
          <View style={{
            backgroundColor: '#fef3e2',
            borderRadius: 8,
            padding: 10,
            borderLeftWidth: 3,
            borderLeftColor: '#f97316'
          }}>
            <Text style={{
              fontSize: 11,
              color: '#ea580c',
              fontWeight: '600',
              marginBottom: 3
            }}>
              💬 Example: "Hey! {user?.first_name || user?.name || user?.email?.split('@')[0] || 'Your friend'} missed their goal. Time for motivation!"
            </Text>
          </View>
        </View>
        
        {/* Role Picker */}
        <ContactRolePicker
          onSelect={handleRoleSelect}
          initialValue={newContact.role}
          style={{ marginBottom: 16 }}
        />
        
        {/* Added Contacts List */}
        {contacts.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
              Added Contacts ({contacts.length}/5)
            </Text>
            {contacts.map((contact, index) => (
              <View key={contact.id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: '#f97316'
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                    {contact.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 2 }}>
                    {contact.email}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#f97316', fontWeight: '500' }}>
                    {contact.role}
                  </Text>
                </View>
                <Button
                  onPress={() => handleRemoveContact(contact.id!)}
                  size="sm"
                  title="Remove"
                  style={{
                    backgroundColor: '#ef4444',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6
                  }}
                />
              </View>
            ))}
            
            {contacts.length < 5 && (
              <View style={{ padding: 16, backgroundColor: '#f0f9ff', borderRadius: 12, marginTop: 8 }}>
                <Text style={{ fontSize: 14, color: '#0369a1', textAlign: 'center' }}>
                  Add {5 - contacts.length} more contact{5 - contacts.length !== 1 ? 's' : ''} (optional)
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        {/* Continue Button - Only visible when contacts exist */}
        {contacts.length > 0 ? (
          <View style={{ gap: 12 }}>
            {contacts.length < 5 && (
              <Button
                onPress={handleAddContact}
                size="lg"
                title="Add Another Contact"
                disabled={!isValid}
                style={{
                  backgroundColor: isValid ? '#f97316' : '#e5e7eb',
                  borderRadius: 12,
                  paddingVertical: 16,
                }}
              />
            )}
            <Button
              onPress={handleNext}
              size="lg"
              title="Continue →"
              style={ONBOARDING_BUTTON_STYLE}
            />
          </View>
        ) : (
          <Button
            onPress={handleAddContact}
            size="lg"
            title="Add Contact"
            disabled={!isValid}
            style={{
              ...ONBOARDING_BUTTON_STYLE,
              backgroundColor: isValid ? '#f97316' : '#e5e7eb',
            }}
          />
        )}
        <DebugSkipButton 
          onSkip={() => navigation.navigate('MessageStyle')}
          title="Debug Skip Contact Setup"
        />
      </View>
    </KeyboardAvoidingView>
  );
} 
