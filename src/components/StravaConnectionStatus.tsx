import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ServiceLogo } from './ServiceLogo';
import StravaAuthService from '@/services/strava-auth';

interface StravaConnectionStatusProps {
  onConnectionChange?: (connected: boolean) => void;
  style?: any;
}

export function StravaConnectionStatus({ onConnectionChange, style }: StravaConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [athleteInfo, setAthleteInfo] = useState<any>(null);
  const stravaAuth = StravaAuthService.getInstance();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const connected = stravaAuth.isAuthenticated();
      setIsConnected(connected);
      
      if (connected) {
        const athlete = stravaAuth.getAthlete();
        setAthleteInfo(athlete);
      }
      
      onConnectionChange?.(connected);
    } catch (error) {
      console.error('Error checking Strava connection:', error);
    }
  };

  const handleConnect = async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      const result = await stravaAuth.authenticate();
      
      if (result.type === 'success' && result.tokens) {
        const backendSuccess = await stravaAuth.sendTokensToBackend(result.tokens);
        
        if (backendSuccess) {
          setIsConnected(true);
          setAthleteInfo(result.tokens.athlete);
          onConnectionChange?.(true);
        } else {
          Alert.alert('Error', 'Failed to save authentication data');
        }
      } else if (result.type === 'cancel') {
        // User cancelled, no need to show error
      } else {
        Alert.alert('Connection Failed', result.error || 'Failed to connect to Strava');
      }
    } catch (error) {
      console.error('Strava connection error:', error);
      Alert.alert('Error', 'Failed to connect to Strava');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Strava',
      'Are you sure you want to disconnect from Strava? This will stop activity tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await stravaAuth.clearTokens();
              setIsConnected(false);
              setAthleteInfo(null);
              onConnectionChange?.(false);
            } catch (error) {
              console.error('Error disconnecting:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[{
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: isConnected ? '#10b981' : '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          backgroundColor: '#f1f5f9',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <ServiceLogo service="strava" size={24} />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#111827',
            marginBottom: 2
          }}>
            Strava
          </Text>
          
          {isConnected && athleteInfo ? (
            <Text style={{
              fontSize: 13,
              color: '#10b981',
              fontWeight: '500'
            }}>
              Connected as {athleteInfo.firstname} {athleteInfo.lastname}
            </Text>
          ) : (
            <Text style={{
              fontSize: 13,
              color: '#6b7280'
            }}>
              {isConnecting ? 'Connecting...' : 'Not connected'}
            </Text>
          )}
        </View>
        
        <View style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: isConnected ? '#10b981' : '#d1d5db'
        }} />
      </View>
      
      <TouchableOpacity
        onPress={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        style={{
          backgroundColor: isConnected ? '#fee2e2' : '#f97316',
          borderRadius: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: isConnected ? '#dc2626' : '#ffffff'
        }}>
          {isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect' : 'Connect')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}