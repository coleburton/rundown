import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Button } from '@/components/ui/button';
import { useMockAuth } from '@/hooks/useMockAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { ONBOARDING_BUTTON_STYLE, ONBOARDING_CONTAINER_STYLE } from '@/constants/OnboardingStyles';
import { TYPOGRAPHY_STYLES } from '@/constants/Typography';

type RootStackParamList = {
  ValuePreview: undefined;
  FitnessAppConnect: undefined;
  ContactSetup: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'FitnessAppConnect'>;

interface FitnessApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  popular: boolean;
}

const FITNESS_APPS: FitnessApp[] = [
  {
    id: 'strava',
    name: 'Strava',
    icon: '🏃‍♂️',
    description: 'Running & cycling platform',
    popular: false
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    icon: '⌚',
    description: 'Garmin device integration',
    popular: false
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: '📱',
    description: 'Activity tracking platform',
    popular: false
  },
  {
    id: 'apple_health',
    name: 'Apple Health',
    icon: '🍎',
    description: 'iOS health integration',
    popular: false
  }
];

export function FitnessAppConnectScreen({ navigation }: Props) {
  const { connectStrava } = useMockAuth();
  const insets = useSafeAreaInsets();
  const [selectedApp, setSelectedApp] = useState<string>('strava');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      
      if (selectedApp === 'strava') {
        await connectStrava();
      }
      
      navigation.navigate('ContactSetup');
    } catch (error) {
      console.error('Failed to connect fitness app:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://rundown.app/privacy');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <OnboardingStepper currentStep={6} />
      
      {/* Back Button */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
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
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 16 }}>
          <Text style={[TYPOGRAPHY_STYLES.h2, { 
            color: '#111827', 
            textAlign: 'center',
            marginBottom: 12
          }]}>
            Connect your <Text style={{ color: '#f97316' }}>fitness app</Text>
          </Text>
          <Text style={[TYPOGRAPHY_STYLES.body2, { 
            color: '#6b7280',
            textAlign: 'center',
            maxWidth: 280
          }]}>
            We'll check goal completion using your activity data. No additional tracking.
          </Text>
        </View>

        {/* Privacy Assurance */}
        <View style={{
          backgroundColor: '#f8fafc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1
        }}>
          <Text style={[TYPOGRAPHY_STYLES.caption1Medium, {
            color: '#475569',
            marginBottom: 6,
            textAlign: 'center'
          }]}>
            Privacy & Data Usage
          </Text>
          <Text style={[TYPOGRAPHY_STYLES.caption1, {
            color: '#64748b',
            marginBottom: 3
          }]}>
            • Read-only access to workout completion data
          </Text>
          <Text style={[TYPOGRAPHY_STYLES.caption1, {
            color: '#64748b',
            marginBottom: 3
          }]}>
            • No data sharing with external parties
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#64748b',
            lineHeight: 18,
            marginBottom: 6
          }}>
            • Disconnect anytime in account settings
          </Text>
          <TouchableOpacity onPress={openPrivacyPolicy}>
            <Text style={{
              fontSize: 12,
              color: '#6366f1',
              textAlign: 'center',
              textDecorationLine: 'underline'
            }}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fitness App Selection */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[TYPOGRAPHY_STYLES.body1Medium, {
            color: '#111827',
            marginBottom: 12
          }]}>
            Select platform:
          </Text>
          
          {FITNESS_APPS.map((app) => (
            <TouchableOpacity
              key={app.id}
              onPress={() => setSelectedApp(app.id)}
              style={{
                backgroundColor: selectedApp === app.id ? '#fef7ed' : '#ffffff',
                borderWidth: 1,
                borderColor: selectedApp === app.id ? '#f97316' : '#e5e7eb',
                borderRadius: 6,
                padding: 14,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
              }}
            >
              {/* App Icon */}
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                backgroundColor: selectedApp === app.id ? '#f97316' : '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 20 }}>{app.icon}</Text>
              </View>

              {/* App Info */}
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: 1
                }}>
                  {app.name}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: '#64748b'
                }}>
                  {app.description}
                </Text>
              </View>

              {/* Radio Button */}
              <View style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 2,
                borderColor: selectedApp === app.id ? '#f97316' : '#94a3b8',
                backgroundColor: selectedApp === app.id ? '#f97316' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {selectedApp === app.id && (
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#ffffff'
                  }} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Authorization Info */}
        <View style={{
          backgroundColor: '#fefbf8',
          borderRadius: 6,
          padding: 14,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#f3e8d0'
        }}>
          <Text style={{
            fontSize: 13,
            color: '#a16207',
            lineHeight: 18
          }}>
            You'll be redirected to {FITNESS_APPS.find(app => app.id === selectedApp)?.name || 'your fitness app'} for secure authorization. This provides read-only access to verify workout completion.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Button at bottom */}
      <View style={[ONBOARDING_CONTAINER_STYLE, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Button
          onPress={handleConnect}
          size="lg"
          title={isConnecting ? "Connecting..." : `Connect ${FITNESS_APPS.find(app => app.id === selectedApp)?.name || 'App'}`}
          disabled={isConnecting}
          style={{
            backgroundColor: isConnecting ? '#94a3b8' : '#f97316',
            borderRadius: 6,
            paddingVertical: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2
          }}
        />
      </View>
    </View>
  );
}