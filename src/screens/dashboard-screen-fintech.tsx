// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay
} from 'react-native-reanimated';

import { useAuthContext } from '@/lib/auth-context';
import { useStravaActivities } from '@/hooks/useStravaActivities';
import { VectorIcon } from '@/components/ui/IconComponent';
import { DebugOnboardingPanel } from '@/components/DebugOnboardingPanel';
import { calculateGoalProgress, getGoalDisplayText } from '@/lib/goalUtils';
import { formatActivityDate } from '@/lib/utils';

type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  ActivityDetail: { activityId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

interface Activity {
  id: string;
  name: string;
  type: string;
  start_date: string;
  distance?: number;
  moving_time?: number;
}

const getActivityIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'run':
    case 'running':
      return 'activity';
    case 'ride':
    case 'cycling':
      return 'bike';
    case 'walk':
    case 'walking':
      return 'map-pin';
    case 'swim':
    case 'swimming':
      return 'droplets';
    case 'workout':
    case 'gym':
      return 'dumbbell';
    default:
      return 'zap';
  }
};

const getActivityColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'run':
    case 'running':
      return '#f97316';
    case 'ride':
    case 'cycling':
      return '#3b82f6';
    case 'walk':
    case 'walking':
      return '#22c55e';
    case 'swim':
    case 'swimming':
      return '#06b6d4';
    case 'workout':
    case 'gym':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
};

export function FintechDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const { activities: stravaActivities, loading } = useStravaActivities();
  const [expandedHistory, setExpandedHistory] = useState(false);

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);
  const cardScale = useSharedValue(0.95);

  // Calculate current week's progress
  const currentWeekActivities = stravaActivities.filter(activity => {
    const activityDate = new Date(activity.start_date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return activityDate >= startOfWeek;
  });

  const progress = calculateGoalProgress(currentWeekActivities, user);
  const goalDisplay = getGoalDisplayText(user);
  
  // Get week number
  const getWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  // Entrance animations
  useEffect(() => {
    fadeIn.value = withDelay(100, withTiming(1, { duration: 800 }));
    slideUp.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    cardScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 120 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [
      { translateY: slideUp.value },
      { scale: cardScale.value }
    ],
  }));

  // Get recent activities (limit based on expanded state)
  const displayedActivities = expandedHistory 
    ? stravaActivities.slice(0, 10)
    : stravaActivities.slice(0, 3);

  const handleActivityPress = (activityId: string) => {
    navigation.navigate('ActivityDetail', { activityId });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (activityDate.getTime() === today.getTime()) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (activityDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      return formatActivityDate(dateString);
    }
  };

  return (
    <View style={styles.container}>
      <DebugOnboardingPanel />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Animated.View style={[styles.content, containerStyle, { paddingTop: insets.top + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Profile</Text>
          </View>

          {/* Hero Goal Progress Card */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#8b5cf6', '#3b82f6', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              {/* Decorative elements */}
              <View style={styles.decorativeShape1} />
              <View style={styles.decorativeShape2} />
              
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Goal Progress</Text>
                <Text style={styles.cardValue}>
                  {progress.current}/{progress.goal} {goalDisplay.unit}
                </Text>
                <Text style={styles.weekNumber}>Week {getWeekNumber()}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Recent Activities Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              <TouchableOpacity>
                <VectorIcon name="info" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading activities...</Text>
                </View>
              ) : displayedActivities.length > 0 ? (
                displayedActivities.map((activity, index) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.activityItem,
                      index === displayedActivities.length - 1 && styles.lastActivityItem
                    ]}
                    onPress={() => handleActivityPress(activity.id)}
                  >
                    <View style={[
                      styles.activityIcon,
                      { backgroundColor: getActivityColor(activity.type) + '20' }
                    ]}>
                      <VectorIcon 
                        name={getActivityIcon(activity.type)} 
                        size={20} 
                        color={getActivityColor(activity.type)} 
                      />
                    </View>
                    
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{activity.name}</Text>
                      <Text style={styles.activityTime}>{formatTime(activity.start_date)}</Text>
                    </View>
                    
                    <Text style={styles.activityBadge}>+ 1 Activity</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <VectorIcon name="activity" size={48} color="#e5e7eb" />
                  <Text style={styles.emptyStateText}>No activities yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Start tracking your workouts to see them here
                  </Text>
                </View>
              )}

              {stravaActivities.length > 3 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setExpandedHistory(!expandedHistory)}
                >
                  <Text style={styles.showMoreText}>
                    {expandedHistory ? 'Show less' : 'Show me more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Accountability Partner Section */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.partnerHeader}>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>
                    {user?.contact_name || 'Not Set'}
                  </Text>
                  <Text style={styles.partnerRole}>Accountability Partner</Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <VectorIcon name="edit-2" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              {user?.contact_phone && (
                <View style={styles.partnerContact}>
                  <Text style={styles.contactLabel}>Phone number</Text>
                  <Text style={styles.contactValue}>{user.contact_phone}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  heroCard: {
    marginBottom: 32,
  },
  gradientCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeShape1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: -40,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  weekNumber: {
    position: 'absolute',
    bottom: -8,
    right: 0,
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  showMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6366f1',
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  partnerRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    padding: 4,
  },
  partnerContact: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
