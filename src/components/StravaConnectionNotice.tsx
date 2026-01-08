import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconComponent } from './ui/IconComponent';

interface StravaConnectionNoticeProps {
  onReconnect: () => void;
  onDismiss: () => void;
  reason?: string;
}

export function StravaConnectionNotice({
  onReconnect,
  onDismiss,
  reason
}: StravaConnectionNoticeProps) {
  const getMessage = () => {
    if (reason === 'token_refresh_failed') {
      return 'Your Strava connection expired. Reconnect to continue tracking.';
    }
    if (reason === 'user_action') {
      return 'Strava is disconnected. Connect to track your activities.';
    }
    return 'Strava connection needed to track your activities.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <IconComponent
            library="Lucide"
            name="AlertCircle"
            size={20}
            color="#f59e0b"
          />
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Strava Not Connected</Text>
          <Text style={styles.message}>{getMessage()}</Text>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={onReconnect}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Connect Strava</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDismiss}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffbeb', // amber-50
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fef3c7', // amber-100
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7', // amber-100
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    color: '#92400e', // amber-900
    marginBottom: 4,
  },
  message: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#78350f', // amber-950
    lineHeight: 18,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#f59e0b', // amber-500
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
  },
  primaryButtonText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fef3c7', // amber-100
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: '#78350f', // amber-950
  },
});
