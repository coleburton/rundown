import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { IconComponent } from './ui/IconComponent';

interface SubscriptionCancelledModalProps {
  visible: boolean;
  onClose: () => void;
  onResubscribe: () => void;
}

export function SubscriptionCancelledModal({ 
  visible, 
  onClose, 
  onResubscribe 
}: SubscriptionCancelledModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}>
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 340,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 20,
        }}>
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent
              library="Lucide"
              name="X"
              size={18}
              color="#6b7280"
            />
          </TouchableOpacity>

          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#fef3c7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <IconComponent
                library="Lucide"
                name="CreditCard"
                size={28}
                color="#f59e0b"
              />
            </View>
            
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 8,
            }}>
              You're No Longer Subscribed
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 22,
            }}>
              Your subscription has been cancelled. Here's what you're missing:
            </Text>
          </View>

          {/* Missing features list */}
          <View style={{ marginBottom: 32 }}>
            {[
              { icon: 'MessageSquare', text: 'Accountability messages from your contacts' },
              { icon: 'TrendingUp', text: 'Detailed progress tracking and insights' },
              { icon: 'Target', text: 'Advanced goal setting and reminders' },
              { icon: 'Users', text: 'Multiple accountability partners' },
            ].map((feature, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#fef2f2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <IconComponent
                    library="Lucide"
                    name={feature.icon as any}
                    size={12}
                    color="#dc2626"
                  />
                </View>
                <Text style={{
                  flex: 1,
                  fontSize: 14,
                  color: '#374151',
                  lineHeight: 20,
                }}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={onResubscribe}
              style={{
                backgroundColor: '#10b981',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                Reactivate Subscription
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#6b7280',
              }}>
                Continue Without Subscription
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}