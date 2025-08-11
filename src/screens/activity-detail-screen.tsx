import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import StravaAuthService from '@/services/strava-auth';
import { StravaActivity } from '@/hooks/useStravaData';
import { RouteVisualization } from '@/components/RouteVisualization';

type RootStackParamList = {
  Dashboard: undefined;
  ActivityDetail: { activityId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>;

export function ActivityDetailScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const insets = useSafeAreaInsets();
  const [activity, setActivity] = useState<StravaActivity | null>(null);
  const [detailedActivity, setDetailedActivity] = useState<any>(null);
  const [routeStreams, setRouteStreams] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const stravaAuth = StravaAuthService.getInstance();

  useEffect(() => {
    fetchActivityDetails();
  }, [activityId]);

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get detailed activity from Strava API
      const detailed = await stravaAuth.getActivityById(parseInt(activityId));
      setDetailedActivity(detailed);
      
      // Also get basic activity info (already cached)
      const activities = await stravaAuth.getActivities(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), undefined, 100);
      const basicActivity = activities.find(a => a.id.toString() === activityId);
      setActivity(basicActivity || null);

      // Fetch route streams if the activity has GPS data
      if (detailed && detailed.start_latlng) {
        try {
          const streams = await stravaAuth.getActivityStreams(parseInt(activityId), ['latlng', 'distance', 'altitude']);
          setRouteStreams(streams);
        } catch (streamsError) {
          console.warn('Failed to fetch route streams:', streamsError);
          // Don't fail the whole request if streams fail
        }
      }

    } catch (err) {
      console.error('Error fetching activity details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activity details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (metersPerSecond: number) => {
    const milesPerHour = (metersPerSecond * 3600) / 1609.34;
    const minutesPerMile = 60 / milesPerHour;
    const minutes = Math.floor(minutesPerMile);
    const seconds = Math.round((minutesPerMile - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
  };

  const formatDistance = (meters: number) => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  };

  const formatElevation = (meters: number) => {
    const feet = meters * 3.28084;
    return `${feet.toFixed(0)} ft`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'Run':
      case 'VirtualRun':
        return '🏃‍♂️';
      case 'Ride':
      case 'VirtualRide':
        return '🚴‍♂️';
      case 'Swim':
        return '🏊‍♂️';
      case 'Walk':
      case 'Hike':
        return '🚶‍♂️';
      case 'Workout':
        return '💪';
      case 'WeightTraining':
        return '🏋️‍♂️';
      case 'Yoga':
        return '🧘‍♂️';
      case 'Crossfit':
        return '🔥';
      default:
        return '🏃‍♂️';
    }
  };

  const openInStrava = () => {
    const url = `https://www.strava.com/activities/${activityId}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 24 + insets.top }}>
        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ 
                backgroundColor: '#f3f4f6',
                borderRadius: 20, 
                width: 40, 
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}
            >
              <Text style={{ fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              Activity Details
            </Text>
          </View>
          <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 50 }}>
            Loading activity details...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 24 + insets.top }}>
        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ 
                backgroundColor: '#f3f4f6',
                borderRadius: 20, 
                width: 40, 
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}
            >
              <Text style={{ fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              Activity Details
            </Text>
          </View>
          <Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 50 }}>
            Error: {error}
          </Text>
        </View>
      </View>
    );
  }

  const currentActivity = detailedActivity || activity;
  
  if (!currentActivity) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 24 + insets.top }}>
        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ 
                backgroundColor: '#f3f4f6',
                borderRadius: 20, 
                width: 40, 
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}
            >
              <Text style={{ fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              Activity Details
            </Text>
          </View>
          <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 50 }}>
            Activity not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ padding: 24, paddingTop: 24 + insets.top }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ 
              backgroundColor: '#f3f4f6',
              borderRadius: 20, 
              width: 40, 
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              Activity Details
            </Text>
          </View>
          <TouchableOpacity
            onPress={openInStrava}
            style={{ 
              backgroundColor: '#fc5200',
              borderRadius: 20, 
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginLeft: 8
            }}
          >
            <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '600' }}>
              View in Strava
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activity Header */}
        <View style={{ 
          backgroundColor: '#f9fafb',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>
            {getActivityIcon(currentActivity.type || currentActivity.sport_type)}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 4 }}>
            {currentActivity.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
            {formatDate(currentActivity.start_date_local || currentActivity.start_date)}
          </Text>
        </View>

        {/* Key Stats */}
        <View style={{ 
          flexDirection: 'row', 
          gap: 12, 
          marginBottom: 24 
        }}>
          <View style={{
            flex: 1,
            backgroundColor: '#f0fdf4',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#bbf7d0',
            minWidth: 0,
          }}>
            <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '600', marginBottom: 4 }}>
              DISTANCE
            </Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
              {formatDistance(currentActivity.distance)}
            </Text>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: '#f0f9ff',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#bae6fd',
            minWidth: 0,
          }}>
            <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '600', marginBottom: 4 }}>
              TIME
            </Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
              {formatDuration(currentActivity.moving_time || currentActivity.elapsed_time)}
            </Text>
          </View>

          <View style={{
            flex: 1.2,
            backgroundColor: '#fef3c7',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#fed7aa',
            minWidth: 0,
          }}>
            <Text style={{ fontSize: 12, color: '#d97706', fontWeight: '600', marginBottom: 4 }}>
              PACE
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
              {currentActivity.distance > 0 ? formatPace(currentActivity.distance / (currentActivity.moving_time || currentActivity.elapsed_time)) : '--'}
            </Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
            Performance Stats
          </Text>
          
          <View style={{ gap: 12 }}>
            {/* Elevation */}
            {currentActivity.total_elevation_gain > 0 && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>⛰️</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Elevation Gain
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {formatElevation(currentActivity.total_elevation_gain)}
                </Text>
              </View>
            )}

            {/* Calories */}
            {currentActivity.calories && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🔥</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Calories Burned
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {currentActivity.calories} cal
                </Text>
              </View>
            )}

            {/* Average Speed */}
            {currentActivity.average_speed && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>📈</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Average Speed
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {((currentActivity.average_speed * 3600) / 1609.34).toFixed(1)} mph
                </Text>
              </View>
            )}

            {/* Max Speed */}
            {currentActivity.max_speed && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>⚡</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Max Speed
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {((currentActivity.max_speed * 3600) / 1609.34).toFixed(1)} mph
                </Text>
              </View>
            )}

            {/* Average Watts (Power) */}
            {currentActivity.average_watts && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fffbeb',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#fed7aa',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>⚡</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Average Power
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round(currentActivity.average_watts)} W
                </Text>
              </View>
            )}

            {/* Max Watts (Power) */}
            {currentActivity.max_watts && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fffbeb',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#fed7aa',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🚀</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Max Power
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round(currentActivity.max_watts)} W
                </Text>
              </View>
            )}

            {/* Heart Rate */}
            {currentActivity.average_heartrate && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fef2f2',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#fecaca',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>❤️</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Avg Heart Rate
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round(currentActivity.average_heartrate)} bpm
                </Text>
              </View>
            )}

            {/* Max Heart Rate */}
            {currentActivity.max_heartrate && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fef2f2',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#fecaca',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>💓</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Max Heart Rate
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round(currentActivity.max_heartrate)} bpm
                </Text>
              </View>
            )}

            {/* Cadence */}
            {currentActivity.average_cadence && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f0f9ff',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: '#bae6fd',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🎯</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Average Cadence
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round(currentActivity.average_cadence)} spm
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Additional Activity Info */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
            Activity Details
          </Text>
          
          <View style={{ gap: 12 }}>
            {/* Device Name */}
            {currentActivity.device_name && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>📱</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Device
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {currentActivity.device_name}
                </Text>
              </View>
            )}

            {/* Start Latlng */}
            {currentActivity.start_latlng && currentActivity.start_latlng.length === 2 && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>📍</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Start Location
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>
                  {currentActivity.start_latlng[0].toFixed(4)}, {currentActivity.start_latlng[1].toFixed(4)}
                </Text>
              </View>
            )}

            {/* Temperature */}
            {currentActivity.average_temp && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>🌡️</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Average Temperature
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round((currentActivity.average_temp * 9/5) + 32)}°F
                </Text>
              </View>
            )}

            {/* Perceived Exertion */}
            {currentActivity.perceived_exertion && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>💯</Text>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                    Perceived Exertion
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {currentActivity.perceived_exertion}/10
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Social Stats */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
            Social
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{
              flex: 1,
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>👍</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 2 }}>
                {currentActivity.kudos_count || 0}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Kudos</Text>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🏆</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 2 }}>
                {currentActivity.achievement_count || 0}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Route Visualization */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
            Route
          </Text>
          
          <RouteVisualization 
            latlng={routeStreams?.latlng?.data} 
            width={300} 
            height={200} 
          />
        </View>
      </View>
    </ScrollView>
  );
}