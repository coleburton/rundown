import { HeaderBlurOverlay } from '@/components/HeaderBlurOverlay';
import { RouteVisualization } from '@/components/RouteVisualization';
import { VectorIcon } from '@/components/ui/IconComponent';
import { Activity, useStravaActivities } from '@/hooks/useStravaActivities';
import StravaAuthService from '@/services/strava-auth';
import { decodePolyline } from '@/utils/polyline';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type ScrollEvent = { nativeEvent: { contentOffset: { y: number } } };
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RootStackParamList = {
  Dashboard: undefined;
  ActivityDetail: { activityId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>;

export function ActivityDetailScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const insets = useSafeAreaInsets();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [detailedActivity, setDetailedActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { activities } = useStravaActivities();
  const stravaAuth = StravaAuthService.getInstance();

  useEffect(() => {
    fetchActivityDetails();
  }, [activityId, activities]);

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find the activity in our Supabase activities
      const foundActivity = activities.find(a => a.strava_activity_id.toString() === activityId);
      
      if (foundActivity) {
        setActivity(foundActivity);
        setDetailedActivity(foundActivity);
        
        // NOTE: Additional Strava API calls disabled - all data comes from Supabase sync
        // Route visualization would require an edge function to proxy Strava API requests
        // For now, we just use the data already synced to the database

        // TODO: If route visualization is needed, create an edge function to fetch streams
        // using the server-side tokens stored in the database
      } else {
        setError('Activity not found');
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

  const getActivityIconConfig = (activityType: string) => {
    switch (activityType) {
      case 'Run':
      case 'VirtualRun':
        return { emoji: '🏃‍♂️' as const };
      case 'Ride':
      case 'VirtualRide':
        return { emoji: '🚴‍♂️' as const };
      case 'Swim':
        return { emoji: '🏊‍♂️' as const };
      case 'Walk':
      case 'Hike':
        return { emoji: '🚶‍♂️' as const };
      case 'Workout':
        return { emoji: '💪' as const };
      case 'WeightTraining':
        return { emoji: '🏋️‍♂️' as const };
      case 'Yoga':
        return { emoji: '🧘‍♂️' as const };
      case 'Crossfit':
        return { emoji: '🔥' as const };
      default:
        return { emoji: '🏃‍♂️' as const };
    }
  };

  const openInStrava = () => {
    const url = `https://www.strava.com/activities/${activityId}`;
    Linking.openURL(url);
  };

  const currentActivity = detailedActivity || activity;

  const routeLatLng = useMemo(() => {
    if (!currentActivity) {
      return null;
    }

    interface StravaMapData {
      summary_polyline?: string | null;
      polyline?: string | null;
    }

    const getPolylineFromActivity = (): string | null => {
      const mapData = (currentActivity as any)?.map as StravaMapData | undefined;
      if (mapData?.summary_polyline) {
        return mapData.summary_polyline;
      }

      const rawData = currentActivity.raw_data as { map?: StravaMapData } | null;
      if (rawData?.map?.summary_polyline) {
        return rawData.map.summary_polyline;
      }

      if (rawData?.map?.polyline) {
        return rawData.map.polyline;
      }

      return null;
    };

    const summaryPolyline = getPolylineFromActivity();

    if (summaryPolyline) {
      try {
        const decoded = decodePolyline(summaryPolyline);
        if (decoded.length >= 2) {
          return decoded;
        }
      } catch (polylineError) {
        console.error('Failed to decode activity polyline', polylineError);
      }
    }

    const isLatLngTuple = (value: any): value is [number, number] =>
      Array.isArray(value) &&
      value.length === 2 &&
      typeof value[0] === 'number' &&
      typeof value[1] === 'number';

    const fallbackPoints: [number, number][] = [];

    const startLatLng = (currentActivity as any)?.start_latlng;
    if (isLatLngTuple(startLatLng)) {
      fallbackPoints.push(startLatLng);
    }

    const endLatLng = (currentActivity as any)?.end_latlng;
    if (isLatLngTuple(endLatLng)) {
      fallbackPoints.push(endLatLng);
    }

    if (fallbackPoints.length >= 2) {
      return fallbackPoints;
    }

    return null;
  }, [currentActivity]);

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
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <HeaderBlurOverlay
        visible={isScrolled}
        height={insets.top + 80}
      />
      <ScrollView
        style={{ flex: 1 }}
        onScroll={(event: ScrollEvent) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          setIsScrolled(scrollY > 10);
        }}
        scrollEventThrottle={16}
      >
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
              borderRadius: 6, 
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginLeft: 8
            }}
          >
            <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: 'bold', textDecorationLine: 'underline' }}>
              View on Strava
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
          <VectorIcon 
            emoji={getActivityIconConfig(currentActivity.type || currentActivity.sport_type).emoji} 
            size={48} 
            color="#111827" 
            style={{ marginBottom: 8 }}
          />
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
              {(currentActivity.distance || 0) > 0 ? formatPace((currentActivity.distance || 0) / ((currentActivity.moving_time || currentActivity.elapsed_time) || 1)) : '--'}
            </Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 }}>
            Performance Stats
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Elevation */}
            {!!(currentActivity.total_elevation_gain && currentActivity.total_elevation_gain > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="⛰️" size={20} color="#111827" style={{ marginRight: 0 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', paddingLeft: 12 }}>
                    Elevation Gain
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {formatElevation(currentActivity.total_elevation_gain)}
                </Text>
              </View>
            )}

            {/* Calories */}
            {!!(currentActivity.calories && currentActivity.calories > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="🔥" size={20} color="#111827" style={{ marginRight: 12 }} />
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
            {!!(currentActivity.average_speed && currentActivity.average_speed > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="📈" size={20} color="#111827" style={{ marginRight: 0 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', paddingLeft: 12 }}>
                    Average Speed
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {((currentActivity.average_speed * 3600) / 1609.34).toFixed(1)} mph
                </Text>
              </View>
            )}

            {/* Max Speed */}
            {!!(currentActivity.max_speed && currentActivity.max_speed > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="⚡" size={20} color="#111827" style={{ marginRight: 0 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', paddingLeft: 12 }}>
                    Max Speed
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {((currentActivity.max_speed * 3600) / 1609.34).toFixed(1)} mph
                </Text>
              </View>
            )}

            {/* Average Watts (Power) */}
            {!!(currentActivity.average_watts && currentActivity.average_watts > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fffbeb',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#fed7aa',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="⚡" size={20} color="#111827" style={{ marginRight: 12 }} />
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
            {!!(currentActivity.max_watts && currentActivity.max_watts > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fffbeb',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#fed7aa',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="🚀" size={20} color="#111827" style={{ marginRight: 12 }} />
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
            {!!(currentActivity.average_heartrate && currentActivity.average_heartrate > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fef2f2',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#fecaca',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="❤️" size={20} color="#111827" style={{ marginRight: 0 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', paddingLeft: 12 }}>
                    Avg Heart Rate
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round(currentActivity.average_heartrate)} bpm
                </Text>
              </View>
            )}

            {/* Max Heart Rate */}
            {!!(currentActivity.max_heartrate && currentActivity.max_heartrate > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fef2f2',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#fecaca',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="💓" size={20} color="#111827" style={{ marginRight: 0 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', paddingLeft: 12 }}>
                    Max Heart Rate
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                  {Math.round(currentActivity.max_heartrate)} bpm
                </Text>
              </View>
            )}

            {/* Cadence */}
            {!!(currentActivity.average_cadence && currentActivity.average_cadence > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f0f9ff',
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: '#bae6fd',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="🎯" size={20} color="#111827" style={{ marginRight: 12 }} />
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
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 }}>
            Activity Details
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Device Name */}
            {!!(currentActivity.device_name) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="📱" size={20} color="#111827" style={{ marginRight: 12 }} />
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
            {!!(currentActivity.start_latlng && Array.isArray(currentActivity.start_latlng) && currentActivity.start_latlng.length === 2 && typeof currentActivity.start_latlng[0] === 'number' && typeof currentActivity.start_latlng[1] === 'number') && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="📍" size={20} color="#111827" style={{ marginRight: 12 }} />
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
            {!!(currentActivity.average_temp && typeof currentActivity.average_temp === 'number') && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="🌡️" size={20} color="#111827" style={{ marginRight: 12 }} />
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
            {!!(currentActivity.perceived_exertion && currentActivity.perceived_exertion > 0) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VectorIcon emoji="💯" size={20} color="#111827" style={{ marginRight: 12 }} />
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
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 }}>
            Social
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{
              flex: 1,
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
            }}>
              <VectorIcon emoji="👍" size={24} color="#111827" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                {currentActivity.kudos_count || 0}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Kudos</Text>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
            }}>
              <VectorIcon emoji="🏆" size={24} color="#111827" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                {currentActivity.achievement_count || 0}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Route Visualization */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 }}>
            Route
          </Text>
          
          <RouteVisualization 
            latlng={routeLatLng || undefined} 
            width={300} 
            height={200} 
          />
        </View>

        {/* Strava Attribution */}
        <View style={{ 
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          padding: 12,
          marginBottom: 40,
          alignItems: 'center'
        }}>
          <Text style={{ 
            fontSize: 11, 
            color: '#6b7280',
            textAlign: 'center' 
          }}>
            Powered by Strava
          </Text>
        </View>
      </View>
    </ScrollView>
  </View>
  );
}
