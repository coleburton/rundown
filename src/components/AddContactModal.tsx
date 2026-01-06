import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert
} from 'react-native';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ContactRolePicker } from './ContactRolePicker';
import { formatEmail, isValidEmail } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onContactAdded: () => void;
}

type Contact = {
  name: string;
  email: string;
  relationship: string;
};

export function AddContactModal({ visible, onClose, onContactAdded }: AddContactModalProps) {
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact>({
    name: '',
    email: '',
    relationship: 'Coach'
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = contact.name.trim() && isValidEmail(contact.email);

  // Clear error when form inputs change
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [contact.name, contact.email, contact.relationship]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setContact({ name: '', email: '', relationship: 'Coach' });
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleRoleSelect = (role: string) => {
    setContact({ ...contact, relationship: role });
  };

  const handleAddContact = async () => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Basic validation
      if (!contact.name.trim()) {
        setError('Please enter a name');
        return;
      }

      if (!isValidEmail(contact.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Check for duplicate emails
      const emailLower = contact.email.toLowerCase();
      const { data: existingContacts, error: fetchError } = await supabase
        .from('contacts')
        .select('email')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const isDuplicate = existingContacts?.some(c =>
        c.email.toLowerCase() === emailLower
      );

      if (isDuplicate) {
        setError('This email address has already been added');
        return;
      }

      // Check contact limit (max 5 contacts)
      if (existingContacts && existingContacts.length >= 5) {
        setError('You can only add up to 5 contacts');
        return;
      }

      // Add contact to database
      const { data: insertedContact, error: insertError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: contact.name.trim(),
          email: formatEmail(contact.email),
          relationship: contact.relationship,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      let inviteError: string | null = null;
      if (insertedContact) {
        try {
          await supabase.functions.invoke('buddy-management', {
            body: {
              action: 'invite',
              contact_id: insertedContact.id
            }
          });
        } catch (err) {
          console.error('Error sending buddy invite:', err);
          inviteError = 'Contact added but we could not send their welcome email. You can resend from Settings later.';
        }
      }

      // Success! Close modal and refresh parent
      Alert.alert('Success', inviteError ?? 'Contact added successfully!');
      onContactAdded();
      onClose();

    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Failed to add contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#ffffff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb'
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 16, color: '#6b7280', fontFamily: 'DMSans-Medium' }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontFamily: 'DMSans-Bold', color: '#111827' }}>
            Add Contact
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          <Text style={{
            fontSize: 26,
            fontFamily: 'DMSans-Bold',
            color: '#111827',
            marginBottom: 8,
            letterSpacing: -0.5
          }}>
            Add Accountability Contact
          </Text>
          <Text style={{
            fontSize: 16,
            fontFamily: 'DMSans-Regular',
            color: '#6b7280',
            marginBottom: 24,
            lineHeight: 24
          }}>
            Who should we notify when you're off track?
          </Text>

          {error && (
            <View style={{
              marginBottom: 16,
              padding: 14,
              backgroundColor: '#fef2f2',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#fecaca'
            }}>
              <Text style={{
                color: '#dc2626',
                fontSize: 14,
                fontFamily: 'DMSans-Medium',
                lineHeight: 20
              }}>
                {error}
              </Text>
            </View>
          )}

          {/* Input Fields */}
          <View style={{ marginBottom: 24 }}>
            <Input
              placeholder="Name"
              value={contact.name}
              onChangeText={(text) => setContact({ ...contact, name: text })}
              style={{ 
                marginBottom: 16, 
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
              value={contact.email}
              onChangeText={(text) => {
                const formatted = formatEmail(text);
                setContact({ ...contact, email: formatted });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              style={{
                borderRadius: 12, 
                height: 52, 
                fontSize: 16,
                borderColor: '#e5e7eb',
                backgroundColor: '#ffffff',
                paddingHorizontal: 16,
              }}
            />
          </View>

          {/* Role Picker */}
          <ContactRolePicker
            onSelect={handleRoleSelect}
            initialValue={contact.relationship}
            style={{ marginBottom: 24 }}
          />

          {/* Message Preview - Redesigned */}
          <View style={{
            backgroundColor: '#fff7ed',
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: '#fed7aa',
            marginTop: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#ffedd5',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2
              }}>
                <Text style={{ fontSize: 20 }}>💬</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 13,
                  color: '#9a3412',
                  fontFamily: 'DMSans-Bold',
                  marginBottom: 6,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase'
                }}>
                  Example Message
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: '#7c2d12',
                  fontFamily: 'DMSans-Regular',
                  lineHeight: 22
                }}>
                  "Hey! {user?.first_name || user?.name || user?.email?.split('@')[0] || 'Your friend'} missed their weekly fitness goal. Time for some motivation! 💪"
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={{
          padding: 20,
          paddingBottom: 34,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff'
        }}>
          <Button
            onPress={handleAddContact}
            size="lg"
            title={isSubmitting ? "Adding..." : "Add Contact"}
            disabled={!isValid || isSubmitting}
            style={{
              backgroundColor: isValid && !isSubmitting ? '#f97316' : '#e5e7eb',
              borderRadius: 14,
              paddingVertical: 18,
            }}
            textStyle={{
              fontFamily: 'DMSans-Bold',
              fontSize: 16,
              letterSpacing: 0.3
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
