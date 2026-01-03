import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { IconComponent } from '../components/ui/IconComponent';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';

type Message = Database['public']['Tables']['messages']['Row'];
type QueuedMessage = Database['public']['Tables']['message_queue']['Row'];
type Contact = Database['public']['Tables']['contacts']['Row'];

type ContactPreview = Pick<Contact, 'id' | 'name' | 'email' | 'relationship'>;

type MessageWithContact = Message & {
  contacts: ContactPreview;
};

type QueuedMessageWithContact = QueuedMessage & {
  contacts: ContactPreview;
};

type RootStackParamList = {
  Settings: undefined;
  MessageHistory: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MessageHistory'>;

export function MessageHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [sentMessages, setSentMessages] = useState<MessageWithContact[]>([]);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessageWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch sent messages
      const { data: sentData, error: sentError } = await supabase
        .from('messages')
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            relationship
          )
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (sentError) throw sentError;

      // Fetch queued messages
      const { data: queuedData, error: queuedError } = await supabase
        .from('message_queue')
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            relationship
          )
        `)
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (queuedError) throw queuedError;

      setSentMessages(sentData || []);
      setQueuedMessages(queuedData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  }, [fetchMessages]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleDateString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'queued': return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return 'CheckCircle';
      case 'pending': return 'Clock';
      case 'failed': return 'XCircle';
      case 'queued': return 'Calendar';
      case 'processing': return 'RefreshCw';
      case 'cancelled': return 'Ban';
      default: return 'Circle';
    }
  };

  const renderMessageCard = (
    message: MessageWithContact | QueuedMessageWithContact, 
    isQueued: boolean = false
  ) => {
    const contact = message.contacts;

    const queuedMessage = message as QueuedMessageWithContact;
    const sentMessage = message as MessageWithContact;
    const scheduledFor = queuedMessage.scheduled_for;
    const sentAt = sentMessage.sent_at;
    const attempts = queuedMessage.attempts ?? 0;
    const maxAttempts = queuedMessage.max_attempts ?? 0;

    return (
    <View
      key={message.id}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(message.status || 'pending'),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
            {contact?.name || 'Contact'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            {contact?.relationship || 'Contact'} • {contact?.email || 'No email'}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconComponent
            library="Lucide"
            name={getStatusIcon(message.status || 'pending')}
            size={16}
            color={getStatusColor(message.status || 'pending')}
          />
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '500', 
            color: getStatusColor(message.status || 'pending'),
            marginLeft: 4,
            textTransform: 'capitalize'
          }}>
            {message.status}
          </Text>
        </View>
      </View>

      {/* Message Text */}
      <View style={{
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8
      }}>
        <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>
          {message.message_text}
        </Text>
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>
          {isQueued 
            ? scheduledFor ? `Scheduled for ${formatDate(scheduledFor)}` : 'Not scheduled'
            : sentAt ? `Sent ${formatDate(sentAt)}` : 'Pending'
          }
        </Text>
        
        {isQueued && attempts > 0 && (
          <Text style={{ fontSize: 12, color: '#f59e0b' }}>
            Attempt {attempts}/{maxAttempts}
          </Text>
        )}
      </View>
    </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginBottom: 20,
          paddingHorizontal: 20,
          paddingTop: 20
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ 
              padding: 8, 
              marginRight: 12,
              borderRadius: 8,
              backgroundColor: '#f3f4f6'
            }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <ThemedText style={[TYPOGRAPHY_STYLES.h3, { fontWeight: '600' }]}>
            Message History
          </ThemedText>
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading messages...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
              backgroundColor: '#f3f4f6'
            }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <ThemedText style={[TYPOGRAPHY_STYLES.h3, { fontWeight: '600' }]}>
            Message History
          </ThemedText>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{
            flex: 1,
            backgroundColor: '#f0fdf4',
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#10b981'
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>
              {sentMessages.filter(m => m.status === 'sent').length}
            </Text>
            <Text style={{ fontSize: 12, color: '#065f46', fontWeight: '500' }}>
              Messages Sent
            </Text>
          </View>
          
          <View style={{
            flex: 1,
            backgroundColor: '#fef3e2',
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#f59e0b'
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d97706' }}>
              {queuedMessages.filter(m => ['queued', 'processing'].includes(m.status || '')).length}
            </Text>
            <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '500' }}>
              Scheduled
            </Text>
          </View>
        </View>

        {/* Queued Messages Section */}
        {queuedMessages.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <ThemedText style={[TYPOGRAPHY_STYLES.h5, { marginBottom: 12 }]}>
              Scheduled Messages ({queuedMessages.length})
            </ThemedText>
            {queuedMessages.map(message => renderMessageCard(message, true))}
          </View>
        )}

        {/* Sent Messages Section */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={[TYPOGRAPHY_STYLES.h5, { marginBottom: 12 }]}>
            Message History ({sentMessages.length})
          </ThemedText>
          
          {sentMessages.length === 0 ? (
            <View style={{
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 24,
              alignItems: 'center'
            }}>
              <IconComponent
                library="Lucide"
                name="MessageCircle"
                size={48}
                color="#9ca3af"
              />
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#6b7280', 
                marginTop: 12,
                marginBottom: 4 
              }}>
                No messages sent yet
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#9ca3af',
                textAlign: 'center',
                lineHeight: 20
              }}>
                Your accountability messages will appear here once they're sent to your contacts.
              </Text>
            </View>
          ) : (
            sentMessages.map(message => renderMessageCard(message))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
