import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ContactRolePicker } from '@/components/ContactRolePicker';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { formatPhoneNumber } from '@/lib/utils';

type RootStackParamList = {
  GoalSetup: undefined;
  ContactSetup: undefined;
  MessageStyle: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ContactSetup'>;

type Contact = {
  id?: string;
  name: string;
  phone: string;
  role?: string;
};

export function ContactSetupScreen({ navigation }: Props) {
  const { user } = useMockAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState<Contact>({ name: '', phone: '', role: 'Coach' });
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  // Check if form is valid
  const isValid = newContact.name.trim() && newContact.phone.trim().length >= 3;

  // Clear error when form inputs change
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [newContact.name, newContact.phone, newContact.role]);


  const handleAddContact = () => {
    console.log('Add Contact button pressed');
    
    try {
      // Basic validation
      if (!newContact.name.trim()) {
        setError('Please enter a name');
        return;
      }
      
      const cleaned = newContact.phone.replace(/\D/g, '');
      if (!cleaned || cleaned.length < 3) {
        setError('Please enter a valid phone number (at least 3 digits)');
        return;
      }
      
      // Create the contact object
      const contact = {
        id: Date.now().toString(),
        name: newContact.name.trim(),
        phone: formatPhoneNumber(newContact.phone),
        role: newContact.role || 'Coach'
      };
      
      // Add to contacts array
      const updatedContacts = [...contacts, contact];
      setContacts(updatedContacts);
      console.log('Contact added:', contact);
      console.log('Updated contacts:', updatedContacts);
      
      // Reset form
      setNewContact({ name: '', phone: '', role: 'Coach' });
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
      <OnboardingStepper currentStep={3} />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}
      >
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            Add your accountability buddy
          </Text>
          <Text style={{ fontSize: 18, color: '#6b7280' }}>
            Who should we text when you're slacking?
          </Text>
        </View>
        
        {error && (
          <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#fef2f2', borderRadius: 8 }}>
            <Text style={{ color: '#dc2626', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Input Fields */}
        <View style={{ marginBottom: 20 }}>
          <Input
            placeholder="Name"
            value={newContact.name}
            onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            style={{ 
              marginBottom: 16, 
              borderRadius: 12, 
              height: 56, 
              fontSize: 18,
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
            }}
          />
          <Input
            placeholder="Phone number"
            value={newContact.phone}
            onChangeText={(text) => {
              const formatted = formatPhoneNumber(text);
              setNewContact({ ...newContact, phone: formatted });
            }}
            keyboardType="phone-pad"
            style={{ 
              marginBottom: 16, 
              borderRadius: 12, 
              height: 56, 
              fontSize: 18,
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
            }}
          />
        </View>
        
        {/* Selected Role Display */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280' }}>
            Selected role: <Text style={{ color: '#f97316', fontWeight: '600' }}>{newContact.role}</Text>
          </Text>
        </View>
        
        {/* Role Picker */}
        <ContactRolePicker
          onSelect={handleRoleSelect}
          initialValue={newContact.role}
          style={{ marginBottom: 24 }}
        />
        
        {/* Action Buttons */}
        <View style={{ marginTop: 32 }}>
          {/* Continue Button - Only visible when contacts exist */}
          {contacts.length > 0 ? (
            <Button
              onPress={handleNext}
              size="lg"
              title="Continue →"
              style={ONBOARDING_BUTTON_STYLE}
            />
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
        </View>
        
        {/* Contact List - Hidden for cleaner design */}
        {contacts.length > 0 && (
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 }}>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
              ✓ Contact added successfully
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 