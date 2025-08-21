import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { VectorIcon, IconComponent } from '../components/ui/IconComponent';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TYPOGRAPHY_STYLES } from '../constants/Typography';
import { formatActivityDate } from '../lib/utils';

type Activity = Database['public']['Tables']['activities']['Row'];

type RootStackParamList = {
  Settings: undefined;
  ActivityHistory: undefined;
  ActivityDetail: { activityId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityHistory'>;

// Helper functions from dashboard
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

const getActivityDisplayName = (activityType: string) => {
  switch (activityType) {
    case 'VirtualRun':
      return 'Virtual Run';
    case 'VirtualRide':
      return 'Virtual Ride';
    case 'WeightTraining':
      return 'Weight Training';
    default:
      return activityType;
  }
};

// Helper function to determine if an activity counts toward the goal
const checkActivityCountsTowardGoal = (activity: Activity, goalType: string) => {
  const activityType = activity.type.toLowerCase();
  
  switch (goalType) {
    case 'total_activities':
      return true; // All activities count
      
    case 'total_runs':
      return activityType.includes('run');
      
    case 'total_miles_running':
      return activityType.includes('run');
      
    case 'total_rides_biking':
      return activityType.includes('ride') || activityType.includes('bike');
      
    case 'total_miles_biking':
      return activityType.includes('ride') || activityType.includes('bike');
      
    default:
      return true;
  }
};

export function ActivityHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('month');

  const fetchActivities = useCallback(async () => {
    if (!user) return;

    try {
      let startDate: Date;
      const now = new Date();

      switch (selectedPeriod) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'all':
        default:
          startDate = new Date(2020, 0, 1); // Far back date to get all activities
          break;
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date_local', startDate.toISOString())
        .order('start_date_local', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  }, [fetchActivities]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    const miles = meters * 0.000621371;
    return miles.toFixed(1);
  };

  const getActivityStats = () => {
    const totalActivities = activities.length;
    const totalDistance = activities.reduce((sum, activity) => sum + (activity.distance || 0), 0);
    const totalTime = activities.reduce((sum, activity) => sum + (activity.moving_time || 0), 0);
    const goalActivities = activities.filter(activity => 
      checkActivityCountsTowardGoal(activity, user?.goal_type || 'total_activities')
    ).length;

    return {
      totalActivities,
      totalDistance: formatDistance(totalDistance),
      totalTime: formatDuration(totalTime),
      goalActivities
    };
  };

  const stats = getActivityStats();

  const periodLabels = {
    week: 'Last 7 Days',
    month: 'Last 30 Days', 
    quarter: 'Last 3 Months',
    all: 'All Time'
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
            Activity History
          </ThemedText>
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading activities...</ThemedText>
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
            Activity History
          </ThemedText>
        </View>

        {/* Period Selector */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 8 }}>
            Time Period
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map((period) => {
              const isSelected = period === selectedPeriod;
              return (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedPeriod(period)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginHorizontal: 4,
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#f97316' : '#f3f4f6',
                    borderWidth: 1,
                    borderColor: isSelected ? '#f97316' : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isSelected ? '#ffffff' : '#374151',
                  }}>
                    {periodLabels[period]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Stats Cards */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
            {periodLabels[selectedPeriod]} Summary
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{
              flex: 1,
              backgroundColor: '#f0fdf4',
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#10b981'
            }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>
                {stats.totalActivities}
              </Text>
              <Text style={{ fontSize: 12, color: '#065f46', fontWeight: '500' }}>
                Total Activities
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
                {stats.goalActivities}
              </Text>
              <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '500' }}>
                Goal Activities
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{
              flex: 1,
              backgroundColor: '#f0f9ff',
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#3b82f6'
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1d4ed8' }}>
                {stats.totalDistance}
              </Text>
              <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '500' }}>
                Miles
              </Text>
            </View>
            
            <View style={{
              flex: 1,
              backgroundColor: '#fdf2f8',
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#ec4899'
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#be185d' }}>
                {stats.totalTime}
              </Text>
              <Text style={{ fontSize: 12, color: '#be185d', fontWeight: '500' }}>
                Total Time
              </Text>
            </View>
          </View>
        </View>

        {/* Activities List */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
            Activities ({activities.length})
          </Text>
          
          {activities.length === 0 ? (
            <View style={{
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              padding: 24,
              alignItems: 'center'
            }}>
              <IconComponent
                library="Lucide"
                name="Activity"
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
                No activities found
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#9ca3af',
                textAlign: 'center',
                lineHeight: 20
              }}>
                {selectedPeriod === 'all' 
                  ? 'Connect your Strava account to see your activities here.'
                  : `No activities found for ${periodLabels[selectedPeriod].toLowerCase()}.`
                }
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {activities.map((activity) => {
                const countsTowardGoal = checkActivityCountsTowardGoal(activity, user?.goal_type || 'total_activities');
                
                return (
                  <TouchableOpacity
                    key={activity.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: countsTowardGoal ? '#f0fdf4' : '#f9fafb',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: countsTowardGoal ? '#bbf7d0' : '#e5e7eb',
                    }}
                    onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.strava_activity_id.toString() })}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 32,
                      height: 32,
                      backgroundColor: countsTowardGoal ? '#dcfce7' : '#f3f4f6',
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <VectorIcon 
                        emoji={getActivityIconConfig(activity.type).emoji} 
                        size={16} 
                        color="#6b7280" 
                      />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '600', 
                        color: '#111827',
                        marginBottom: 2
                      }}>
                        {activity.name}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={{ fontSize: 14, color: '#6b7280' }}>
                          {getActivityDisplayName(activity.type)}
                        </Text>
                        
                        <Text style={{ fontSize: 14, color: '#6b7280' }}>
                          {formatDistance(activity.distance || 0)} mi
                        </Text>
                        
                        <Text style={{ fontSize: 14, color: '#6b7280' }}>
                          {formatDuration(activity.moving_time || 0)}
                        </Text>
                      </View>
                      
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {formatActivityDate(activity.start_date_local)}
                      </Text>
                    </View>
                    
                    {countsTowardGoal && (
                      <View style={{
                        backgroundColor: '#dcfce7',
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}>
                        <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: '500' }}>
                          GOAL
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Strava Attribution */}
        {activities.length > 0 && (
          <View style={{ 
            backgroundColor: '#f8f9fa',
            borderRadius: 6,
            padding: 8,
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <Text style={{ 
              fontSize: 10, 
              color: '#6b7280',
              textAlign: 'center' 
            }}>
              Powered by Strava
            </Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
} 