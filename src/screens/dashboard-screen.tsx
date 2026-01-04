// @ts-nocheck
import { DebugOnboardingPanel } from '@/components/DebugOnboardingPanel';
import { SubscriptionCancelledModal } from '@/components/SubscriptionCancelledModal';
import { IconComponent } from '@/components/ui/IconComponent';
import { useStravaActivities } from '@/hooks/useStravaActivities';
import { useUserGoals } from '@/hooks/useUserGoals';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { analytics, calculateDaysSinceSignup, getSessionId } from '@/lib/analytics/index';
import { useAuthContext } from '@/lib/auth-context';
import { isDebugMode } from '@/lib/debug-mode';
import { getGoalDisplayText } from '@/lib/goalUtils';
import { supabase } from '@/lib/supabase';
import { formatActivityDate } from '@/lib/utils';
import { revenueCat } from '@/services/RevenueCat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
	interpolate,
	useAnimatedProps,
	useSharedValue,
	withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

// Create animated Circle component for react-native-svg
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RootStackParamList = {
  Welcome: undefined;
  Dashboard: undefined;
  Settings: undefined;
  ActivityDetail: { activityId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type GoalHistoryRow = {
  id: string;
  user_id: string;
  goal_type: string;
  goal_value: number;
  effective_date: string;
};

// SVG-based progress ring component with animation
const ProgressRing = ({ progress, goal, isOnTrack, isBehind, goalType, goalDisplay, animationTrigger, daysLeft }: {
  progress: number;
  goal: number;
  isOnTrack: boolean;
  isBehind: boolean;
  goalType: string;
  goalDisplay: { unit: string; emoji: string; name: string };
  animationTrigger?: number;
  daysLeft?: number;
}) => {
  // Reanimated shared value for smooth animation
  const animatedProgress = useSharedValue(0);

  // Cap the progress percentage at 100% when progress exceeds goal
  const progressPercentage = Math.min((progress / goal) * 100, 100);
  const size = 240; // Larger, more dominant
  const strokeWidth = 14; // Thicker stroke
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progressColor = isOnTrack ? '#10b981' : isBehind ? '#f59e0b' : '#14b8a6';

  // Animate progress when component mounts or progress changes, or when animation is triggered
  useEffect(() => {
    // Reset to 0 first, then animate to target value for a smooth fill-up effect
    animatedProgress.value = 0;
    animatedProgress.value = withTiming(progressPercentage, {
      duration: 1200,
    });
  }, [progressPercentage, animatedProgress, animationTrigger]);

  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      animatedProgress.value,
      [0, 100],
      [circumference, 0]
    );

    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={{ alignItems: 'center', marginBottom: 48 }}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Circle */}
          <Circle
            key="background"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle - Animated */}
          <AnimatedCircle
            key="progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </Svg>

        {/* Center Content */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20
        }}>
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 64,
            letterSpacing: -2,
            color: '#111827',
            textAlign: 'center',
            lineHeight: 72
          }}>
            {goalType.includes('miles') ? progress.toFixed(1) : String(progress)}
          </Text>
          <Text style={{
            fontFamily: 'DMSans-Regular',
            fontSize: 14,
            color: '#6b7280',
            marginTop: 4,
            textAlign: 'center'
          }}>
            {`of ${goalType.includes('miles') ? goal.toFixed(1) : goal} ${goalDisplay.unit}`}
          </Text>
          <View style={{ height: 36, marginTop: 4, justifyContent: 'center', alignItems: 'center' }}>
            {isOnTrack && (
              <IconComponent
                library="Lucide"
                name="Flame"
                size={32}
                color="#f59e0b"
              />
            )}
          </View>
        </View>

        {/* Orbital info - days left badge */}
        {daysLeft !== undefined && daysLeft > 0 && (
          <View style={{
            position: 'absolute',
            top: 0,
            right: -40,
            backgroundColor: progress >= goal ? '#10b981' : '#f97316',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            transform: [{ rotate: '12deg' }]
          }}>
            <Text style={{
              fontFamily: 'DMSans-Medium',
              fontSize: 12,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {`${daysLeft}d left`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Weekly Goal History component
const WeeklyGoalHistory = ({ weeklyData, selectedWeekOffset, onWeekSelect }: { weeklyData: WeeklyData[], selectedWeekOffset: number, onWeekSelect: (weekOffset: number) => void }) => {
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  
  // Convert weeklyData to achievements format for display
  const weeklyAchievements = weeklyData.map(week => ({
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    activityCount: week.progress,
    goal: week.goal,
    status: week.status
  })).reverse(); // Reverse so most recent week is on the right
  
  // Auto-scroll to selected week
  useEffect(() => {
    if (scrollViewRef.current) {
      const blockWidth = 44; // 28px width + 16px margins
      const totalWeeks = 12;
      const selectedIndex = totalWeeks - 1 - selectedWeekOffset;
      
      // For current week (selectedWeekOffset = 0), scroll to show it on the right
      // For older weeks, center them in view
      let scrollToX = 0;
      
      if (selectedWeekOffset === 0) {
        // Scroll to show current week (rightmost) - scroll to end
        scrollToX = Math.max(0, (totalWeeks - 5) * blockWidth);
      } else if (selectedWeekOffset > 4) {
        // For older weeks, scroll to center them
        scrollToX = Math.max(0, (selectedIndex - 4) * blockWidth);
      } else {
        // For recent weeks, scroll to show current week is visible
        scrollToX = Math.max(0, (totalWeeks - 7) * blockWidth);
      }
      
      scrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
    }
  }, [selectedWeekOffset]);
  
  // Calculate current streak (consecutive weeks meeting goal)
  const calculateStreak = () => {
    let streak = 0;
    
    for (let i = 0; i < weeklyAchievements.length; i++) {
      if (weeklyAchievements[i].status === 'met') {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const streak = calculateStreak();
  
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{
        fontFamily: 'DMSans-Bold',
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: '#9ca3af',
        marginBottom: 16
      }}>
        12-Week History
      </Text>

      <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16 }}>
        {/* Weekly blocks - Horizontal ScrollView showing partial blocks at edges */}
        <View style={{ marginBottom: 16, overflow: 'hidden' }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 12, paddingRight: 8 }}
          >
          {weeklyAchievements.length > 0 ? weeklyAchievements.map((week, index) => {
            // Determine color based on status
            let blockColor = '#e5e7eb'; // Default gray for missed
            if (week.status === 'met') {
              blockColor = '#10b981'; // Green for met
            } else if (week.status === 'partial') {
              blockColor = '#f59e0b'; // Orange for partial
            }

            const isSelectedWeek = index === (weeklyAchievements.length - 1 - selectedWeekOffset);
            const weekOffset = weeklyAchievements.length - 1 - index;

            return (
              <TouchableOpacity
                key={index}
                style={{ alignItems: 'center', marginHorizontal: 8 }}
                onPress={() => onWeekSelect(weekOffset)}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: blockColor,
                    borderRadius: 6,
                    marginBottom: 6,
                    // Add a subtle border to the selected week
                    borderWidth: isSelectedWeek ? 2 : 0,
                    borderColor: isSelectedWeek ? '#111827' : 'transparent'
                  }}
                />
                <Text style={{
                  fontFamily: isSelectedWeek ? 'DMSans-Bold' : 'DMSans-Regular',
                  fontSize: 9,
                  color: isSelectedWeek ? '#111827' : '#9ca3af',
                  textAlign: 'center'
                }}>
                  {weekOffset === 0 ? 'Now' : `-${weekOffset}w`}
                </Text>
              </TouchableOpacity>
            );
          }) : (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Text style={{ fontFamily: 'DMSans-Regular', fontSize: 12, color: '#6b7280' }}>Loading history...</Text>
            </View>
          )}
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontFamily: 'DMSans-Regular', fontSize: 10, color: '#6b7280' }}>Met Goal</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontFamily: 'DMSans-Regular', fontSize: 10, color: '#6b7280' }}>Partial</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#e5e7eb', borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontFamily: 'DMSans-Regular', fontSize: 10, color: '#6b7280' }}>Missed</Text>
          </View>
        </View>

        {/* Streak indicator */}
        {streak > 0 && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{
              fontFamily: 'DMSans-Bold',
              fontSize: 12,
              color: '#10b981'
            }}>
              {streak === 1
                ? '1 week streak! Keep it up!'
                : `${streak} week streak! 🔥`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Interface for preloaded weekly data
interface WeeklyData {
  weekOffset: number;
  weekStart: Date;
  weekEnd: Date;
  progress: number;
  goal: number;
  goalType: string;
  goalDisplay: { unit: string; emoji: string; name: string };
  isOnTrack: boolean;
  isBehind: boolean;
  motivationalMessage: { title: string; message: string };
  activities: any[];
  weeklyDistance: number;
  status: 'met' | 'partial' | 'missed';
}

export function DashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuthContext();
  const { activeGoal, allGoals } = useUserGoals(user?.id);
  const insets = useSafeAreaInsets();
  const [goalHistory, setGoalHistory] = useState<GoalHistoryRow[]>([]);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [debugCancelledState, setDebugCancelledState] = useState(false);
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  
  // Trigger for progress ring animation when screen comes into focus
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Track scroll position to show/hide gradient overlay
  const [isScrolled, setIsScrolled] = useState(false);

  // Clear session flag on component mount (new session)
  useEffect(() => {
    const clearSessionFlag = async () => {
      await AsyncStorage.removeItem('hasShownCancelledModalThisSession');
    };
    clearSessionFlag();
  }, []);

  // Track first-time dashboard view (activation milestone)
  useEffect(() => {
    const trackFirstView = async () => {
      const hasViewed = await AsyncStorage.getItem('has_viewed_dashboard');
      if (!hasViewed && user?.created_at && analytics && typeof analytics.track === 'function') {
        analytics.track(ANALYTICS_EVENTS.ACTIVATION_FIRST_DASHBOARD_VIEWED, {
          days_since_signup: calculateDaysSinceSignup(user.created_at),
        });
        await AsyncStorage.setItem('has_viewed_dashboard', 'true');
      }
    };
    trackFirstView();
  }, [user]);

  // Reset animation when screen comes into focus (user navigates back to dashboard)
  useFocusEffect(
    useCallback(() => {
      // Increment trigger to force re-animation when returning to screen
      setAnimationTrigger(prev => prev + 1);

      // Check subscription status on focus
      checkSubscriptionStatus();

      // Track dashboard view
      const trackView = async () => {
        if (analytics && typeof analytics.track === 'function') {
          const sessionId = await getSessionId();
          analytics.track(ANALYTICS_EVENTS.DASHBOARD_VIEWED, {
            session_id: sessionId,
            screen_name: 'Dashboard',
          });

          // Update user property
          if (typeof analytics.setUserProperties === 'function') {
            analytics.setUserProperties({
              last_dashboard_view_date: new Date().toISOString(),
            });
          }
        }
      };
      trackView();
    }, [])
  );

  const {
    activities: stravaActivities,
    loading,
    error,
    refresh,
    getWeeklyProgress,
    getDaysLeft,
    getRecentRuns,
    getRecentActivities,
    doesActivityCountTowardGoal,
  } = useStravaActivities();

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const subscribed = await revenueCat.isUserSubscribed();
      const previouslySubscribed = isSubscribed;
      
      setIsSubscribed(subscribed);
      setHasCheckedSubscription(true);
      
      // Check if we've already shown the cancelled modal this session
      const hasShownModalThisSession = await AsyncStorage.getItem('hasShownCancelledModalThisSession');
      
      // Only show modal if:
      // 1. User is not subscribed, AND
      // 2. We haven't shown it this session, AND
      // 3. Either this is first check OR they were previously subscribed (status change)
      if (!subscribed && !hasShownModalThisSession && (!hasCheckedSubscription || previouslySubscribed)) {
        setShowCancelledModal(true);
        // Mark that we've shown the modal this session
        await AsyncStorage.setItem('hasShownCancelledModalThisSession', 'true');
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      // Default to subscribed on error
      setIsSubscribed(true);
      setHasCheckedSubscription(true);
    }
  }, [debugCancelledState, isSubscribed, hasCheckedSubscription]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Track refresh event (safe check for analytics)
    if (analytics && typeof analytics.track === 'function') {
      analytics.track(ANALYTICS_EVENTS.DASHBOARD_REFRESHED, {
        week_offset: selectedWeekOffset,
      });
    }

    try {
      // Refresh activities from Strava
      await refresh();
      // Clear weekly data to trigger reload
      setWeeklyData([]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, selectedWeekOffset]);

  // Helper function to get week date range for any week offset
  const getWeekDateRangeForOffset = (weekOffset: number) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (weekOffset * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `${formatDate(startOfWeek)}–${formatDate(endOfWeek)}`;
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const resolveGoalFromUserGoals = (weekStart: Date) => {
    if (!allGoals || allGoals.length === 0) {
      return null;
    }

    const sortedGoals = [...allGoals].sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return aDate - bDate;
    });

    const normalizedStarts = sortedGoals.map((goal) => getWeekStart(new Date(goal.created_at || 0)));
    const targetTime = weekStart.getTime();

    for (let i = sortedGoals.length - 1; i >= 0; i -= 1) {
      if (targetTime >= normalizedStarts[i].getTime()) {
        return {
          goalType: sortedGoals[i].goal_type,
          goalValue: Number(sortedGoals[i].target_value),
        };
      }
    }

    const firstGoal = sortedGoals[0];
    return {
      goalType: firstGoal.goal_type,
      goalValue: Number(firstGoal.target_value),
    };
  };

  const resolveGoalForWeek = useCallback(
    (weekStart: Date, historyOverride?: GoalHistoryRow[]) => {
      const sourceHistory = historyOverride ?? goalHistory;
      if (sourceHistory && sourceHistory.length > 0) {
        const targetTime = weekStart.getTime();
        const match = sourceHistory.find((goal) => {
          const effectiveTime = new Date(goal.effective_date).getTime();
          return effectiveTime <= targetTime;
        });

        if (match) {
          return {
            goalType: match.goal_type,
            goalValue: Number(match.goal_value),
          };
        }
      }

      const goalFromUserGoals = resolveGoalFromUserGoals(weekStart);
      if (goalFromUserGoals) {
        return goalFromUserGoals;
      }

      if (activeGoal) {
        return {
          goalType: activeGoal.goal_type,
          goalValue: Number(activeGoal.target_value),
        };
      }

      return {
        goalType: user?.goal_type || 'total_activities',
        goalValue: user?.goal_value || user?.goal_per_week || 3,
      };
    },
    [goalHistory, allGoals, activeGoal, user]
  );

  const getCurrentGoal = useCallback(() => {
    return resolveGoalForWeek(getWeekStart(new Date()));
  }, [resolveGoalForWeek]);

  // Preload all weekly data (12 weeks) - with goal history from database
  const preloadWeeklyData = useCallback(async () => {
    if (!user?.id || loading) {
      console.log('preloadWeeklyData - Skipping:', { userId: user?.id, loading });
      return;
    }
    
    console.log('preloadWeeklyData - Starting for user:', user.id);
    setIsLoading(true);
    const weeks: WeeklyData[] = [];
    const now = new Date();

    try {
      const { data: goalHistoryData, error: goalError } = await supabase
        .from('goal_history')
        .select('*')
        .eq('user_id', user.id)
        .order('effective_date', { ascending: false });

      if (goalError) {
        console.error('Error fetching goal history:', goalError);
      }
      if (goalHistoryData) {
        setGoalHistory(goalHistoryData);
      }
    
      // Convert Supabase activities to the format expected by existing components
      const activities = (stravaActivities || []).map(activity => ({
        id: activity.strava_activity_id.toString(),
        date: activity.start_date_local,
        distance: activity.distance, // Already in meters from Supabase
        duration: activity.moving_time, // Already in seconds from Supabase  
        type: activity.type,
        name: activity.name || 'Activity'
      }));

      console.log('preloadWeeklyData - Activities processed:', {
        originalCount: stravaActivities?.length || 0,
        processedCount: activities.length,
        sampleActivity: activities[0] || null
      });

      // Helper function to get goal for a specific week
      const getGoalForWeek = (weekStart: Date) =>
        resolveGoalForWeek(weekStart, goalHistoryData || []);

    for (let i = 0; i < 12; i++) {
      // Calculate week start (Monday) for i weeks ago
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (7 * i));
      weekStart.setHours(0, 0, 0, 0);
      
      // Calculate week end (Sunday)  
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Get activities for this week
      const weeklyActivities = activities.filter(
        (activity) => {
          const activityDate = new Date(activity.date);
          return activityDate >= weekStart && activityDate <= weekEnd;
        }
      );
      
      // Get goal settings for this specific week
      const { goalType, goalValue: weekGoal } = getGoalForWeek(weekStart);
      
      // Calculate progress directly without API calls
      let progress = 0;
      switch (goalType) {
        case 'total_activities':
          progress = weeklyActivities.length;
          break;
        case 'total_runs':
          progress = weeklyActivities.filter(a => a.type.toLowerCase().includes('run')).length;
          break;
        case 'total_miles_running':
          progress = weeklyActivities
            .filter(a => a.type.toLowerCase().includes('run'))
            .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);
          break;
        case 'total_rides_biking':
          progress = weeklyActivities.filter(a => 
            a.type.toLowerCase().includes('bike') || 
            a.type.toLowerCase().includes('cycling') ||
            a.type.toLowerCase().includes('ride')
          ).length;
          break;
        case 'total_miles_biking':
          progress = weeklyActivities
            .filter(a => 
              a.type.toLowerCase().includes('bike') || 
              a.type.toLowerCase().includes('cycling') ||
              a.type.toLowerCase().includes('ride')
            )
            .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);
          break;
        default:
          progress = weeklyActivities.length;
      }
      
      // Round progress for mile-based goals
      if (goalType === 'total_miles_running' || goalType === 'total_miles_biking') {
        progress = Math.round(progress * 10) / 10;
      }

      const goalDisplay = getGoalDisplayText(goalType);
      // Calculate days left for current week only
      const daysLeft = i === 0 ? (7 - now.getDay()) % 7 : 0;
      const isOnTrack = progress >= weekGoal;
      const isBehind = daysLeft <= 2 && progress < weekGoal;
      const status = progress >= weekGoal ? 'met' : progress > 0 ? 'partial' : 'missed';

      // Calculate weekly distance from the weekly activities we already have
      const weeklyDistance = weeklyActivities
        .filter(activity => activity.type.toLowerCase().includes('run'))
        .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);

      // Generate motivational message
      let scenario: 'goal_met' | 'current_with_activity' | 'current_no_activity' | 'past_partial' | 'past_none';
      if (i > 0) {
        // Past week scenarios
        if (progress >= weekGoal) {
          scenario = 'goal_met';
        } else if (progress > 0) {
          scenario = 'past_partial';
        } else {
          scenario = 'past_none';
        }
      } else {
        // Current week scenarios
        if (progress >= weekGoal) {
          scenario = 'goal_met';
        } else if (progress > 0) {
          scenario = 'current_with_activity';
        } else {
          scenario = 'current_no_activity';
        }
      }

      const messages = getMotivationalMessages(scenario, progress, weekGoal, goalDisplay);
      const messageSeed = `${user.id}-${i}-${scenario}-${progress}-${weekGoal}`;
      const motivationalMessage = {
        title: getStableMessage(messages.titles, messageSeed + '-title'),
        message: getStableMessage(messages.messages, messageSeed + '-message')
      };

      // Map activities for this week with goal counting info
      const activitiesForWeek = weeklyActivities.map(activity => ({
        ...activity,
        countsTowardGoal: checkActivityCountsTowardGoal(activity, goalType)
      })).slice(0, 10);

      weeks.push({
        weekOffset: i,
        weekStart,
        weekEnd,
        progress,
        goal: weekGoal,
        goalType,
        goalDisplay,
        isOnTrack,
        isBehind,
        motivationalMessage,
        activities: activitiesForWeek,
        weeklyDistance,
        status
      });
    }
    
    setWeeklyData(weeks);
    setIsLoading(false);
    } catch (error) {
      console.error('Error preloading weekly data:', error);
      // Set fallback data so the app doesn't hang
      const fallbackWeeks: WeeklyData[] = [];
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (7 * i));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        fallbackWeeks.push({
          weekOffset: i,
          weekStart,
          weekEnd,
          progress: 0,
          goal: getCurrentGoal().goalValue,
          goalType: getCurrentGoal().goalType,
          goalDisplay: getGoalDisplayText(getCurrentGoal().goalType),
          isOnTrack: false,
          isBehind: false,
          motivationalMessage: {
            title: 'Connection Issue 📶',
            message: 'Unable to load your data right now. Please check your connection.'
          },
          activities: [],
          weeklyDistance: 0,
          status: 'missed'
        });
      }
      setWeeklyData(fallbackWeeks);
      setIsLoading(false);
    }
  }, [user?.id, loading, stravaActivities, resolveGoalForWeek, getCurrentGoal]);

  // Trigger preloading when user logs in or activities change
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    console.log('useEffect trigger check:', {
      hasUserId: !!user?.id,
      loading,
      activitiesLength: stravaActivities.length,
      weeklyDataLength: weeklyData.length,
      isLoading,
      shouldTrigger: user?.id && !loading && !isLoading && weeklyData.length === 0 && stravaActivities.length > 0
    });
    
    // Only preload if we have user, activities are loaded, not currently loading, and no weekly data yet
    if (user?.id && !loading && !isLoading && weeklyData.length === 0 && stravaActivities.length > 0) {
      console.log('Starting to preload weekly data for user:', user.id);
      preloadWeeklyData();
      
      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('Preloading timed out after 3 seconds, using fallback data');
          setIsLoading(false);
        }
      }, 3000); // 3 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, stravaActivities.length, loading, weeklyData.length, isLoading, preloadWeeklyData]);

  // Also reload if user goal settings change
  useEffect(() => {
    if (weeklyData.length > 0 && user?.id) {
      console.log('User goal settings changed, reloading weekly data');
      setWeeklyData([]); // Clear data to trigger reload
    }
  }, [activeGoal, user]);

  // Get current week data from preloaded data
  const currentWeekData = weeklyData.find(week => week.weekOffset === selectedWeekOffset);
  
  // Check if user is truly new (no activities ever) vs just loading
  const isNewUser = !loading && stravaActivities.length === 0;
  
  // Fallback data if not loaded yet
  const fallbackData = {
    progress: 0,
    goal: 3,
    goalType: 'total_activities' as any,
    goalDisplay: getGoalDisplayText('total_activities'),
    isOnTrack: false,
    isBehind: false,
    motivationalMessage: isNewUser 
      ? { title: 'Welcome to Rundown!', message: 'Complete your first activity to start tracking your progress' }
      : { title: 'Loading...', message: 'Getting your data ready!' },
    activities: [],
    weeklyDistance: 0
  };

  // Get data for the selected week, with fallback
  const data = shouldShowSimpleDashboard ? simpleCurrentWeekData : (currentWeekData || fallbackData);
  const { 
    progress, 
    goal, 
    goalType, 
    goalDisplay, 
    isOnTrack, 
    isBehind, 
    motivationalMessage,
    activities: weekActivities,
    weeklyDistance 
  } = data;

  // For simple dashboard, use actual activities from the hook if available
  const displayActivities = shouldShowSimpleDashboard && !loading && stravaActivities.length > 0
    ? stravaActivities.slice(0, 10).map(activity => ({
        id: activity.strava_activity_id.toString(),
        date: activity.start_date_local,
        distance: activity.distance, // Keep as number in meters (will be converted in rendering)
        duration: activity.moving_time, // Keep in seconds for consistency with weekActivities
        type: activity.type,
        name: activity.name || 'Activity',
        countsTowardGoal: checkActivityCountsTowardGoal({
          type: activity.type
        }, getCurrentGoal().goalType)
      }))
    : weekActivities;

  const daysLeft = selectedWeekOffset === 0 ? getDaysLeft() : 0; // Only show days left for current week
  
  // Helper function to determine if an activity counts toward the goal
  const checkActivityCountsTowardGoal = (activity: any, goalType: string) => {
    const activityType = activity.type.toLowerCase();
    
    switch (goalType) {
      case 'total_activities':
        return true; // All activities count
        
      case 'total_runs':
        return activityType.includes('run');
        
      case 'total_miles_running':
        return activityType.includes('run');
        
      case 'total_rides_biking':
        return activityType.includes('bike') || 
               activityType.includes('cycling') || 
               (activityType.includes('ride') && !activityType.includes('run'));
        
      case 'total_miles_biking':
        return activityType.includes('bike') || 
               activityType.includes('cycling') || 
               (activityType.includes('ride') && !activityType.includes('run'));
        
      default:
        return true;
    }
  };

  // Helper functions for motivational messages  
  const getMotivationalMessages = (scenario: 'goal_met' | 'current_with_activity' | 'current_no_activity' | 'past_partial' | 'past_none', progress: number, goal: number, goalDisplay: any) => {
    const remaining = goal - progress;
    
    switch (scenario) {
      case 'goal_met':
        return {
          titles: ['Nailed it!', 'Crushed it!', 'Goal smashed!', 'Victory!', 'Boom! Done!'],
          messages: [
            'Goal crushed! Your accountability buddy was proud.',
            'Absolutely nailed it this week. Chef\'s kiss.',
            'Goal demolished! The couch is jealous.',
            'Mission accomplished. Your future self thanks you.',
            'Perfectly executed. You should be proud.'
          ]
        };
      
      case 'current_with_activity':
        return {
          titles: ['You\'re cooking!', 'On fire!', 'Rolling!', 'Keep going!', 'Momentum!'],
          messages: [
            `${remaining} more to go! You've got this.`,
            `${remaining} left. Finish strong this week!`,
            `Almost there! ${remaining} more runs.`,
            `${remaining} to go. The couch is getting nervous.`,
            `So close! Just ${remaining} more this week.`
          ]
        };
      
      case 'current_no_activity':
        return {
          titles: ['Time to start!', 'Let\'s go!', 'Week\'s waiting!', 'Ready to run?', 'Lace up!'],
          messages: [
            `${goal} runs this week. Let's make it happen!`,
            `${goal} to go! Perfect time to start.`,
            `Fresh week, ${goal} runs. You've got this!`,
            `${goal} runs ahead. The couch can wait.`,
            `Week just started. ${goal} runs to conquer!`
          ]
        };
      
      case 'past_partial':
        return {
          titles: ['Close call!', 'Almost!', 'So close!', 'Nearly there!', 'Ouch!'],
          messages: [
            `Missed by ${remaining}. They remember.`,
            `${remaining} short. The couch celebrated.`,
            `Almost had it! Missed by ${remaining}.`,
            `${remaining} away from glory. Next time!`,
            `Close but no cigar. Off by ${remaining}.`
          ]
        };
      
      case 'past_none':
        return {
          titles: ['Ghost week', 'Invisible week', 'Couch week', 'Mystery week', 'Vanishing act'],
          messages: [
            'Zero runs. The couch remembers.',
            'Completely MIA. They noticed.',
            'Full ghost mode. Netflix won that week.',
            'Radio silence. Your shoes got dusty.',
            'Total no-show. Excuses threw a party.'
          ]
        };
      
      default:
        return {
          titles: ['Keep going!'],
          messages: ['You\'ve got this!']
        };
    }
  };

  const getStableMessage = (messages: string[], seed: string) => {
    // Create a simple hash from the seed string for deterministic selection
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % messages.length;
    return messages[index];
  };

  // Handle week selection change with analytics
  const handleWeekChange = (newWeekOffset: number) => {
    const direction = newWeekOffset > selectedWeekOffset ? 'past' : 'future';

    // Track week change (safe check for analytics)
    if (analytics && typeof analytics.track === 'function') {
      analytics.track(ANALYTICS_EVENTS.DASHBOARD_WEEK_CHANGED, {
        week_offset: newWeekOffset,
        previous_week_offset: selectedWeekOffset,
        direction,
      });
    }

    setSelectedWeekOffset(newWeekOffset);
  };

  // Handle activity click with analytics
  const handleActivityClick = (activity: any) => {
    // Track activity click (safe check for analytics)
    if (analytics && typeof analytics.track === 'function') {
      analytics.track(ANALYTICS_EVENTS.DASHBOARD_ACTIVITY_CLICKED, {
        activity_id: activity.id,
        activity_type: activity.type,
        counts_toward_goal: activity.countsTowardGoal,
        week_offset: selectedWeekOffset,
      });
    }

    navigation.navigate('ActivityDetail', { activityId: activity.id });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Handle modal actions
  const handleCloseCancelledModal = () => {
    setShowCancelledModal(false);
  };

  const handleResubscribe = () => {
    setShowCancelledModal(false);
    navigation.navigate('Paywall' as any);
  };

  // Determine effective subscription status (including debug override)
  const effectiveIsSubscribed = isDebugMode() ? !debugCancelledState : isSubscribed;

  const formatDistance = (meters: number) => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} miles`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getActivityName = (type: string) => {
    const names = ['Morning Run', 'Evening Jog', 'Lunch Run', 'Quick Run', 'Training Run'];
    return names[Math.floor(Math.random() * names.length)];
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


  // Skip complex loading and use simple fallback if data isn't ready quickly
  const shouldShowSimpleDashboard = loading || weeklyData.length === 0;
  
  // Create simple current week data if preloading hasn't finished
  const calculateSimpleProgress = (goalType: string) => {
    if (!user || loading || stravaActivities.length === 0) return 0;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Filter activities for current week
    const thisWeekActivities = stravaActivities.filter(activity => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });
    
    switch (goalType) {
      case 'total_activities':
        return thisWeekActivities.length;
      case 'total_runs':
        return thisWeekActivities.filter(a => a.type.toLowerCase().includes('run')).length;
      case 'total_miles_running':
        return Math.round(thisWeekActivities
          .filter(a => a.type.toLowerCase().includes('run'))
          .reduce((sum, activity) => sum + activity.distance, 0) * 10) / 10; // stravaActivities already converted to miles
      case 'total_rides_biking':
        return thisWeekActivities.filter(a => 
          a.type.toLowerCase().includes('bike') || 
          a.type.toLowerCase().includes('cycling') ||
          a.type.toLowerCase().includes('ride')
        ).length;
      case 'total_miles_biking':
        return Math.round(thisWeekActivities
          .filter(a => 
            a.type.toLowerCase().includes('bike') || 
            a.type.toLowerCase().includes('cycling') ||
            a.type.toLowerCase().includes('ride')
          )
          .reduce((sum, activity) => sum + activity.distance, 0) * 10) / 10; // stravaActivities already converted to miles
      default:
        return thisWeekActivities.length;
    }
  };

  const calculateSimpleWeeklyDistance = () => {
    if (!user || loading || stravaActivities.length === 0) return 0;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Filter activities for current week and calculate total distance
    const thisWeekActivities = stravaActivities.filter(activity => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });
    
    return thisWeekActivities
      .filter(activity => activity.type.toLowerCase().includes('run'))
      .reduce((sum, activity) => sum + activity.distance, 0); // stravaActivities already converted to miles
  };

  const currentGoalSettings = getCurrentGoal();
  const simpleProgress = calculateSimpleProgress(currentGoalSettings.goalType);
  const simpleGoal = currentGoalSettings.goalValue;
  const simpleWeeklyDistance = calculateSimpleWeeklyDistance();
  
  const simpleCurrentWeekData = {
    weekOffset: 0,
    weekStart: new Date(),
    weekEnd: new Date(),
    progress: simpleProgress,
    goal: simpleGoal,
    goalType: currentGoalSettings.goalType,
    goalDisplay: getGoalDisplayText(currentGoalSettings.goalType),
    isOnTrack: simpleProgress >= simpleGoal,
    isBehind: false,
    motivationalMessage: {
      title: simpleProgress >= simpleGoal ? 'Nailed it!' : simpleProgress > 0 ? 'You\'re cooking!' : 'Hey there!',
      message: simpleProgress >= simpleGoal ? 'Goal crushed! Your accountability buddy is proud.' : simpleProgress > 0 ? `${simpleGoal - simpleProgress} more to go! You've got this.` : 'Ready to get moving this week?'
    },
    activities: [],
    weeklyDistance: simpleWeeklyDistance,
    status: (simpleProgress >= simpleGoal ? 'met' : simpleProgress > 0 ? 'partial' : 'missed') as const
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Fixed gradient overlay at top to prevent content overlap with status bar - only show when scrolled */}
      {isScrolled && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 80,
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          <LinearGradient
            colors={['#ffffff', 'rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0)']}
            locations={[0, 0.7, 1]}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          setIsScrolled(scrollY > 10);
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
      <View style={{ padding: 24, paddingTop: 24 + insets.top }}>
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          {/* Date info - small, tight */}
          <Text style={{
            fontFamily: 'DMSans-Regular',
            fontSize: 11,
            letterSpacing: 0.5,
            color: '#9ca3af',
            textTransform: 'uppercase',
            marginBottom: 6
          }}>
            {getWeekDateRangeForOffset(selectedWeekOffset)}
          </Text>

          {/* Name - bigger, bolder, friendlier */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{
              fontFamily: 'DMSans-Bold',
              fontSize: 28,
              lineHeight: 32,
              letterSpacing: -0.5,
              color: '#111827'
            }}>
              Hey, {user?.name?.split(' ')[0] || 'Runner'}
            </Text>

            {/* Settings - icon button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent
                library="Lucide"
                name="Settings"
                size={18}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* Goal - inline */}
          <Text style={{
            fontFamily: 'DMSans-Regular',
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 24
          }}>
            Goal: {goal} {goalDisplay.unit}/week
          </Text>

          {/* Week Navigation */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }}>
            <TouchableOpacity
              onPress={() => handleWeekChange(Math.min(selectedWeekOffset + 1, 11))}
              disabled={selectedWeekOffset >= 11}
              style={{
                width: 44,
                height: 44,
                backgroundColor: selectedWeekOffset >= 11 ? '#f3f4f6' : '#e5e7eb',
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                fontSize: 20,
                color: selectedWeekOffset >= 11 ? '#9ca3af' : '#374151'
              }}>
                ←
              </Text>
            </TouchableOpacity>

            {/* Current week indicator */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'DMSans-Bold',
                fontSize: 13,
                letterSpacing: 0.5,
                color: selectedWeekOffset === 0 ? '#10b981' : '#6b7280'
              }}>
                {selectedWeekOffset === 0
                  ? 'THIS WEEK'
                  : `${selectedWeekOffset} WEEK${selectedWeekOffset === 1 ? '' : 'S'} AGO`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleWeekChange(Math.max(selectedWeekOffset - 1, 0))}
              disabled={selectedWeekOffset <= 0}
              style={{
                width: 44,
                height: 44,
                backgroundColor: selectedWeekOffset <= 0 ? '#f3f4f6' : '#e5e7eb',
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                fontSize: 20,
                color: selectedWeekOffset <= 0 ? '#9ca3af' : '#374151'
              }}>
                →
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Progress Ring */}
        <ProgressRing
          progress={progress}
          goal={goal}
          isOnTrack={isOnTrack}
          isBehind={isBehind}
          goalType={goalType}
          goalDisplay={goalDisplay}
          animationTrigger={animationTrigger}
          daysLeft={selectedWeekOffset === 0 ? daysLeft : undefined}
        />

        {/* Status Message */}
        {!effectiveIsSubscribed ? (
          // Subscription reminder for cancelled users
          <TouchableOpacity 
            onPress={handleResubscribe}
            style={{
              borderRadius: 16,
              paddingHorizontal: 24,
              paddingVertical: 16,
              marginBottom: 24,
              backgroundColor: '#fef3c7',
              borderWidth: 2,
              borderColor: '#f59e0b',
              flexDirection: 'row',
              alignItems: 'center',
            }}
            activeOpacity={0.8}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f59e0b',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}>
              <IconComponent
                library="Lucide"
                name="CreditCard"
                size={20}
                color="#ffffff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#92400e',
                marginBottom: 4,
              }}>
                Your subscription is cancelled
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#a16207',
                lineHeight: 18,
              }}>
                Tap to resubscribe and get back to crushing your goals with accountability!
              </Text>
            </View>
            <IconComponent
              library="Lucide"
              name="ChevronRight"
              size={20}
              color="#a16207"
            />
          </TouchableOpacity>
        ) : (
          // Regular motivational message for subscribed users
          <View style={{
            backgroundColor: 'transparent',
            marginBottom: 32,
            paddingLeft: 8
          }}>
            <View style={{
              borderLeftWidth: 4,
              borderLeftColor: progress >= goal ? '#10b981' : '#f97316',
              paddingLeft: 16,
              paddingVertical: 8
            }}>
              <Text style={{
                fontFamily: 'DMSans-Bold',
                fontSize: 22,
                lineHeight: 28,
                color: '#111827',
                marginBottom: 4
              }}>
                {motivationalMessage.title}
              </Text>
              <Text style={{
                fontFamily: 'DMSans-Regular',
                fontSize: 15,
                lineHeight: 22,
                color: '#6b7280',
                maxWidth: '85%'
              }}>
                {motivationalMessage.message}
              </Text>
            </View>
          </View>
        )}

        {/* Weekly Goal History */}
        <View style={{ 
          position: 'relative',
        }}>
          {/* Content wrapper with conditional blur */}
          <View style={{
            ...((!effectiveIsSubscribed) && {
              opacity: 0.4,
            })
          }}>
            {shouldShowSimpleDashboard ? (
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontFamily: 'DMSans-Bold',
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: '#9ca3af',
                  marginBottom: 16
                }}>
                  12-Week History
                </Text>
                <View style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontFamily: 'DMSans-Regular',
                    fontSize: 14,
                    color: '#6b7280',
                    textAlign: 'center'
                  }}>
                    {isNewUser ? 'Activity history will appear here once you complete your first workout' : 'Loading your activity history...'}
                  </Text>
                  {isNewUser && (
                    <IconComponent
                      library="Lucide"
                      name="TrendingUp"
                      size={16}
                      color="#10b981"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </View>
              </View>
            ) : (
              <WeeklyGoalHistory
                weeklyData={weeklyData}
                selectedWeekOffset={selectedWeekOffset}
                onWeekSelect={handleWeekChange}
              />
            )}
          </View>
          
          {/* Blur overlay for cancelled subscriptions */}
          {!effectiveIsSubscribed && (
            <View style={{
              position: 'absolute',
              top: 44, // Below the title
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 24,
            }}>
              <IconComponent
                library="Lucide"
                name="Lock"
                size={24}
                color="#6b7280"
              />
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                textAlign: 'center',
                marginTop: 8,
                fontWeight: '500',
              }}>
                Unlock goal history with subscription
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          <View style={{
            flex: 1,
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 16,
          }}>
            <Text style={{
              fontFamily: 'DMSans-Regular',
              fontSize: 11,
              letterSpacing: 0.5,
              color: '#9ca3af',
              textTransform: 'uppercase',
              marginBottom: 8
            }}>
              {selectedWeekOffset === 0 ? 'This Week' : `${selectedWeekOffset}w ago`}
            </Text>
            <Text style={{
              fontFamily: 'DMSans-Bold',
              fontSize: 28,
              lineHeight: 32,
              color: '#111827',
              marginBottom: 2
            }}>
              {weeklyDistance.toFixed(1)}
            </Text>
            <Text style={{
              fontFamily: 'DMSans-Regular',
              fontSize: 12,
              color: '#6b7280'
            }}>
              miles
            </Text>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 16,
          }}>
            <Text style={{
              fontFamily: 'DMSans-Regular',
              fontSize: 11,
              letterSpacing: 0.5,
              color: '#9ca3af',
              textTransform: 'uppercase',
              marginBottom: 8
            }}>
              Progress
            </Text>
            <Text style={{
              fontFamily: 'DMSans-Bold',
              fontSize: 28,
              lineHeight: 32,
              color: '#111827',
              marginBottom: 2
            }}>
              {progress}
            </Text>
            <Text style={{
              fontFamily: 'DMSans-Regular',
              fontSize: 12,
              color: '#6b7280'
            }}>
              {goalDisplay.unit}
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{
          position: 'relative',
          marginBottom: 24
        }}>
          {/* Keep section title visible */}
          <Text style={{
            fontFamily: 'DMSans-Bold',
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#9ca3af',
            marginBottom: 16
          }}>
            {selectedWeekOffset === 0 ? 'Recent Activity' : `${selectedWeekOffset} Week${selectedWeekOffset === 1 ? '' : 's'} Ago`}
          </Text>

          {/* Content wrapper with conditional blur */}
          <View style={{
            ...((!effectiveIsSubscribed) && {
              opacity: 0.4,
            })
          }}>
            {!user ? (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <IconComponent
                  library="Lucide"
                  name="UserCheck"
                  size={20}
                  color="#3b82f6"
                />
                <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
                  Please sign in to see your activities!
                </Text>
              </View>
            ) : loading ? (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 8 }}>
                  {isNewUser ? 'Waiting for your first activity...' : 'Loading your Strava activities...'}
                </Text>
                {isNewUser && (
                  <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <IconComponent
                      library="Lucide"
                      name="Activity"
                      size={20}
                      color="#10b981"
                    />
                    <Text style={{ fontSize: 12, color: '#10b981', textAlign: 'center', marginTop: 4 }}>
                      Go for a run and check back!
                    </Text>
                  </View>
                )}
              </View>
            ) : error ? (
              <Text style={{ color: '#ef4444', textAlign: 'center', padding: 16 }}>
                Failed to load activities: {error}
              </Text>
            ) : displayActivities.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 8 }}>
                  {selectedWeekOffset === 0 ? 'No activities found. Time to get moving!' : 'No activities found for this week.'}
                </Text>
                {selectedWeekOffset === 0 && (
                  <IconComponent
                    library="Lucide"
                    name="Zap"
                    size={20}
                    color="#f59e0b"
                  />
                )}
              </View>
            ) : (
              <View style={{ gap: 2 }}>
                {displayActivities.map((activity, index) => (
                  <TouchableOpacity
                    key={activity.id}
                    onPress={() => handleActivityClick(activity)}
                    style={{
                      backgroundColor: activity.countsTowardGoal ? '#f0fdf4' : '#ffffff',
                      borderLeftWidth: 3,
                      borderLeftColor: activity.countsTowardGoal ? '#10b981' : 'transparent',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Emoji icon - bigger, no background circle */}
                    <Text style={{ fontSize: 24, marginRight: 12 }}>
                      {getActivityIconConfig(activity.type).emoji}
                    </Text>

                    {/* Info - tighter, more editorial */}
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: 'DMSans-Bold',
                        fontSize: 16,
                        color: '#111827',
                        marginBottom: 2
                      }} numberOfLines={1}>
                        {activity.name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={{
                          fontFamily: 'DMSans-Regular',
                          fontSize: 13,
                          color: '#6b7280'
                        }}>
                          {formatActivityDate(activity.date)}
                        </Text>
                        {(activity.distance || 0) > 0 && (
                          <>
                            <Text style={{ color: '#d1d5db' }}>•</Text>
                            <Text style={{
                              fontFamily: 'DMSans-Medium',
                              fontSize: 13,
                              color: '#6b7280'
                            }}>
                              {`${((activity.distance || 0) / 1609.34).toFixed(1)}mi`}
                            </Text>
                          </>
                        )}
                        <Text style={{ color: '#d1d5db' }}>•</Text>
                        <Text style={{
                          fontFamily: 'DMSans-Regular',
                          fontSize: 13,
                          color: '#9ca3af'
                        }}>
                          {`${Math.round((activity.duration || 0) / 60)}m`}
                        </Text>
                      </View>
                    </View>

                    {/* Goal indicator - minimal dot */}
                    {activity.countsTowardGoal && (
                      <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#10b981'
                      }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {/* Blur overlay for cancelled subscriptions */}
          {!effectiveIsSubscribed && (
            <View style={{
              position: 'absolute',
              top: 48, // Below the title
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 24,
            }}>
              <IconComponent
                library="Lucide"
                name="Lock"
                size={24}
                color="#6b7280"
              />
              <Text style={{
                fontSize: 14,
                color: '#6b7280',
                textAlign: 'center',
                marginTop: 8,
                fontWeight: '500',
              }}>
                Unlock activity details with subscription
              </Text>
            </View>
          )}
        </View>

        {/* Strava Attribution - Only show if user has activities */}
        {user && displayActivities.length > 0 && (
          <View style={{ 
            backgroundColor: '#f8f9fa',
            borderRadius: 6,
            padding: 8,
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <Text style={{
              fontFamily: 'DMSans-Regular',
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Powered by Strava
            </Text>
          </View>
        )}

        {/* Motivational Footer */}
        <View style={{ padding: 16, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <IconComponent
              library="Lucide"
              name={isBehind ? "Smartphone" : "Target"}
              size={14}
              color={isBehind ? "#ef4444" : "#10b981"}
            />
            <Text style={{ fontFamily: 'DMSans-Regular', textAlign: 'center', fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>
              {isBehind ? "Don't make us blow up your phone..." : 'Keep crushing those goals!'}
            </Text>
          </View>
        </View>

        {/* Debug Panel at bottom */}
        <View style={{ marginTop: 40, paddingBottom: 20 }}>
          <DebugOnboardingPanel
            debugCancelledState={debugCancelledState}
            onToggleCancelledState={setDebugCancelledState}
          />
        </View>
      </View>
      </ScrollView>
      
      {/* Subscription Cancelled Modal */}
      <SubscriptionCancelledModal
        visible={showCancelledModal}
        onClose={handleCloseCancelledModal}
        onResubscribe={handleResubscribe}
      />
    </View>
  );
} 
