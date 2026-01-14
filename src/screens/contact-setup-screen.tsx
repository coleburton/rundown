import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DebugSkipButton } from '@/components/DebugSkipButton';
import { ContactRolePicker } from '@/components/ContactRolePicker';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { TYPOGRAPHY_STYLES } from '@/constants/Typography';
import { Tooltip } from '@/components/ui/tooltip';
import { formatEmail, isValidEmail } from '@/lib/utils';
import { OnboardingBackButton } from '@/components/OnboardingBackButton';
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
  const safeTopPadding = Math.max(insets.top, 16);
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
      
      analytics.trackEvent(ANALYTICS_EVENTS.ONBOARDING_CONTACT_SETUP_STARTED);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back Button */}
      <View style={{ position: 'absolute', top: safeTopPadding, left: 0, right: 0, zIndex: 10 }}>
        <OnboardingBackButton />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: safeTopPadding,
          paddingBottom: 24
        }}
      >
        <View style={{ marginBottom: 20, marginTop: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[TYPOGRAPHY_STYLES.h2, { color: '#111827', flex: 1 }]}>
              Add your <Text style={{ color: '#f97316' }}>accountability</Text> buddy
            </Text>
            <Tooltip
              text="Choose someone who will motivate you - a coach, friend, or family member who cares about your goals."
              style={{ marginLeft: 8 }}
            />
          </View>
          <Text style={[TYPOGRAPHY_STYLES.body1, { color: '#6b7280', marginBottom: 16 }]}>
            Who should we notify when you're slacking?
          </Text>

          {/* Timing Information */}
          <View style={{
            backgroundColor: '#f0fdf4',
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: '#bbf7d0',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>📅</Text>
            <Text style={[TYPOGRAPHY_STYLES.body2Medium, {
              color: '#15803d',
              flex: 1
            }]}>
              Emails sent Sunday evening if you miss your weekly goal
            </Text>
          </View>
        </View>
        
        {error && (
          <View style={{
            marginBottom: 16,
            padding: 14,
            backgroundColor: '#fef2f2',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#fecaca',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 16, marginRight: 10 }}>⚠️</Text>
            <Text style={[TYPOGRAPHY_STYLES.body2Medium, { color: '#dc2626', flex: 1 }]}>{error}</Text>
          </View>
        )}

        {/* Input Fields */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[TYPOGRAPHY_STYLES.body2Medium, { color: '#374151', marginBottom: 8 }]}>
            Buddy's Details
          </Text>
          <Input
            placeholder="Name"
            value={newContact.name}
            onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            style={{
              marginBottom: 12,
              borderRadius: 12,
              height: 52,
              fontSize: 16,
              borderWidth: 1,
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
              borderRadius: 12,
              height: 52,
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
            }}
          />
        </View>

        {/* Selected Role Display */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[TYPOGRAPHY_STYLES.body2, { color: '#6b7280' }]}>
              Selected role:{' '}
            </Text>
            <View style={{
              backgroundColor: '#fff7ed',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#fed7aa'
            }}>
              <Text style={[TYPOGRAPHY_STYLES.body2Medium, { color: '#ea580c' }]}>
                {newContact.role}
              </Text>
            </View>
          </View>

          {/* Message Preview */}
          <View style={{
            backgroundColor: '#fffbeb',
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: '#fde68a',
            flexDirection: 'row',
            alignItems: 'flex-start'
          }}>
            <Text style={{ fontSize: 16, marginRight: 10, marginTop: 1 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={[TYPOGRAPHY_STYLES.caption1Medium, { color: '#92400e', marginBottom: 4 }]}>
                Sample message they'll receive:
              </Text>
              <Text style={[TYPOGRAPHY_STYLES.body2, { color: '#78350f', lineHeight: 20 }]}>
                "Hey! {user?.first_name || user?.name || user?.email?.split('@')[0] || 'Your friend'} missed their goal. Time for motivation!"
              </Text>
            </View>
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
            <Text style={[TYPOGRAPHY_STYLES.h5, { color: '#111827', marginBottom: 16 }]}>
              Added Contacts ({contacts.length}/5)
            </Text>
            {contacts.map((contact, index) => (
              <View key={contact.id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2
              }}>
                {/* Contact Avatar */}
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#fff7ed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  borderWidth: 2,
                  borderColor: '#fed7aa'
                }}>
                  <Text style={{ fontSize: 18 }}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[TYPOGRAPHY_STYLES.body1Medium, { color: '#111827', marginBottom: 2 }]}>
                    {contact.name}
                  </Text>
                  <Text style={[TYPOGRAPHY_STYLES.body2, { color: '#6b7280', marginBottom: 2 }]}>
                    {contact.email}
                  </Text>
                  <View style={{
                    backgroundColor: '#fff7ed',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={[TYPOGRAPHY_STYLES.caption1Medium, { color: '#ea580c' }]}>
                      {contact.role}
                    </Text>
                  </View>
                </View>
                <Button
                  onPress={() => handleRemoveContact(contact.id!)}
                  size="sm"
                  title="Remove"
                  style={{
                    backgroundColor: '#fee2e2',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#fecaca'
                  }}
                  textStyle={{ color: '#dc2626' }}
                />
              </View>
            ))}

            {contacts.length < 5 && (
              <View style={{
                padding: 14,
                backgroundColor: '#f0f9ff',
                borderRadius: 12,
                marginTop: 8,
                borderWidth: 1,
                borderColor: '#bae6fd',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ fontSize: 14, marginRight: 8 }}>➕</Text>
                <Text style={[TYPOGRAPHY_STYLES.body2Medium, { color: '#0369a1' }]}>
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
