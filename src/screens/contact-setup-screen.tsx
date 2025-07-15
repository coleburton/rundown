import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ContactRolePicker } from '@/components/ContactRolePicker';

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

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // If it's a full 10-digit number, format it
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    // Otherwise, just return the cleaned version
    return cleaned;
  };

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
      <OnboardingStepper currentStep={1} />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            Add your accountability buddy
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280' }}>
            Who should we text when you're slacking?
          </Text>
        </View>
        
        {error && (
          <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#fef2f2', borderRadius: 8 }}>
            <Text style={{ color: '#dc2626', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Input Fields */}
        <View style={{ marginBottom: 16 }}>
          <Input
            placeholder="123"
            value={newContact.name}
            onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            style={{ 
              marginBottom: 12, 
              borderRadius: 12, 
              height: 50, 
              fontSize: 16,
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
            }}
          />
          <Input
            placeholder="23441"
            value={newContact.phone}
            onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
            keyboardType="phone-pad"
            style={{ 
              marginBottom: 12, 
              borderRadius: 12, 
              height: 50, 
              fontSize: 16,
              borderColor: '#e5e7eb',
              backgroundColor: '#ffffff',
            }}
          />
        </View>
        
        {/* Selected Role Display */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280', marginBottom: 4 }}>
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
        <View style={{ flexDirection: 'column', gap: 16 }}>
          {/* Add Contact Button - Main CTA */}
          <Button
            onPress={handleAddContact}
            title="Add Contact"
            disabled={!isValid}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 16,
              backgroundColor: isValid ? '#f97316' : '#e5e7eb',
            }}
            textStyle={{
              fontSize: 18,
              fontWeight: '600',
            }}
          />
          
          {/* Continue Button - Only visible when contacts exist */}
          {contacts.length > 0 && (
            <Button
              onPress={handleNext}
              title="Continue"
              style={{
                width: '100%',
                height: 56,
                borderRadius: 16,
                backgroundColor: '#f3f4f6',
              }}
              textStyle={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
              }}
            />
          )}
        </View>
        
        {/* Contact List */}
        {contacts.length > 0 && (
          <View style={{ marginTop: 32, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
              Your Contacts ({contacts.length})
            </Text>
            {contacts.map((contact) => (
              <View key={contact.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '500', color: '#111827' }}>
                    {contact.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>
                    {contact.phone}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#f97316' }}>
                    {contact.role}
                  </Text>
                </View>
                <Button
                  onPress={() => handleRemoveContact(contact.id!)}
                  variant="ghost"
                  title="Remove"
                  style={{ paddingHorizontal: 8 }}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 