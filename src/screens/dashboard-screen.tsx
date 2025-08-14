import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth-context';
import { useStravaActivities } from '@/hooks/useStravaActivities';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { formatActivityDate, getWeekDateRange, isValidDate } from '@/lib/utils';
import { calculateGoalProgress, calculateGoalProgressWithHistory, getGoalDisplayText, getMotivationalMessage } from '@/lib/goalUtils';
import Svg, { Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  useAnimatedProps,
  runOnJS
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { VectorIcon } from '@/components/ui/IconComponent';

// Create animated Circle component for react-native-svg
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RootStackParamList = {
  Welcome: undefined;
  Dashboard: undefined;
  Settings: undefined;
  ActivityDetail: { activityId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// SVG-based progress ring component with animation
const ProgressRing = ({ progress, goal, isOnTrack, isBehind, goalType, goalDisplay, animationTrigger }: { 
  progress: number; 
  goal: number; 
  isOnTrack: boolean; 
  isBehind: boolean; 
  goalType: string;
  goalDisplay: { unit: string; emoji: string; name: string };
  animationTrigger?: number;
}) => {
  // Reanimated shared value for smooth animation
  const animatedProgress = useSharedValue(0);
  
  // Cap the progress percentage at 100% when progress exceeds goal
  const progressPercentage = Math.min((progress / goal) * 100, 100);
  const size = 192;
  const strokeWidth = 12;
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
    <View style={{ alignItems: 'center', marginBottom: 32 }}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress Circle - Animated */}
          <AnimatedCircle
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
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#111827' }}>
            {goalType.includes('miles') ? progress.toFixed(1) : progress}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            of {goalType.includes('miles') ? goal.toFixed(1) : goal} {goalDisplay.unit}
          </Text>
          <View style={{ height: 36, marginTop: 4, justifyContent: 'center', alignItems: 'center' }}>
            {isOnTrack && (
              <VectorIcon emoji="🔥" size={32} color="#f59e0b" />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// Weekly Goal History component
const WeeklyGoalHistory = ({ weeklyData, selectedWeekOffset, onWeekSelect }: { weeklyData: WeeklyData[], selectedWeekOffset: number, onWeekSelect: (weekOffset: number) => void }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
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
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
        Weekly Goal History
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
                <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
                  {weekOffset === 0 ? 'Now' : `${weekOffset}w`}
                </Text>
              </TouchableOpacity>
            );
          }) : (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Loading history...</Text>
            </View>
          )}
          </ScrollView>
        </View>
        
        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: '#6b7280' }}>Met Goal</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: '#6b7280' }}>Partial</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#e5e7eb', borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: '#6b7280' }}>Missed</Text>
          </View>
        </View>
        
        {/* Streak indicator */}
        {streak > 0 && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>
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
  const insets = useSafeAreaInsets();
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Trigger for progress ring animation when screen comes into focus
  const [animationTrigger, setAnimationTrigger] = useState(0);
  
  // Reset animation when screen comes into focus (user navigates back to dashboard)
  useFocusEffect(
    useCallback(() => {
      // Increment trigger to force re-animation when returning to screen
      setAnimationTrigger(prev => prev + 1);
    }, [])
  );
  
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
      // Fetch goal history for the user for the last 12 weeks
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(now.getDate() - (12 * 7));
      
      const { data: goalHistory, error: goalError } = await supabase
        .from('goal_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('effective_date', twelveWeeksAgo.toISOString().split('T')[0])
        .order('effective_date', { ascending: false });

      if (goalError) {
        console.error('Error fetching goal history:', goalError);
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
      const getGoalForWeek = (weekStart: Date) => {
        if (!goalHistory || goalHistory.length === 0) {
          // Fallback to current user settings
          return {
            goalType: user.goal_type || 'total_activities',
            goalValue: user.goal_value || user.goal_per_week || 3
          };
        }

        // Find the most recent goal that was effective before or on this week
        const weekDateString = weekStart.toISOString().split('T')[0];
        const applicableGoal = goalHistory.find(goal => goal.effective_date <= weekDateString);
        
        if (applicableGoal) {
          return {
            goalType: applicableGoal.goal_type,
            goalValue: applicableGoal.goal_value
          };
        }
        
        // Fallback to current user settings
        return {
          goalType: user.goal_type || 'total_activities',
          goalValue: user.goal_value || user.goal_per_week || 3
        };
      };

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
          goal: user?.goal_value || user?.goal_per_week || 3,
          goalType: user?.goal_type || 'total_activities',
          goalDisplay: getGoalDisplayText(user?.goal_type || 'total_activities'),
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
  }, [user?.id, stravaActivities]);

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
  }, [user?.id, stravaActivities.length, loading, weeklyData.length, isLoading]);

  // Also reload if user goal settings change
  useEffect(() => {
    if (weeklyData.length > 0 && user?.id) {
      console.log('User goal settings changed, reloading weekly data');
      setWeeklyData([]); // Clear data to trigger reload
    }
  }, [user?.goal_type, user?.goal_value, user?.goal_per_week]);

  // Get current week data from preloaded data
  const currentWeekData = weeklyData.find(week => week.weekOffset === selectedWeekOffset);
  
  // Fallback data if not loaded yet
  const fallbackData = {
    progress: 0,
    goal: 3,
    goalType: 'total_activities' as any,
    goalDisplay: getGoalDisplayText('total_activities'),
    isOnTrack: false,
    isBehind: false,
    motivationalMessage: { title: 'Loading...', message: 'Getting your data ready!' },
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
        distance: activity.distance.toFixed(1), // Already converted to miles in useStravaActivities hook
        duration: Math.round(activity.moving_time / 60), // Convert to minutes
        type: activity.type,
        name: activity.name || 'Activity',
        countsTowardGoal: checkActivityCountsTowardGoal({
          type: activity.type
        }, user?.goal_type || 'total_activities')
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

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
  const calculateSimpleProgress = () => {
    if (!user || loading || stravaActivities.length === 0) return 0;
    
    const goalType = user.goal_type || 'total_activities';
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

  const simpleProgress = calculateSimpleProgress();
  const simpleGoal = user?.goal_value || user?.goal_per_week || 6;
  const simpleWeeklyDistance = calculateSimpleWeeklyDistance();
  
  const simpleCurrentWeekData = {
    weekOffset: 0,
    weekStart: new Date(),
    weekEnd: new Date(),
    progress: simpleProgress,
    goal: simpleGoal,
    goalType: user?.goal_type || 'total_activities',
    goalDisplay: getGoalDisplayText(user?.goal_type || 'total_activities'),
    isOnTrack: simpleProgress >= simpleGoal,
    isBehind: false,
    motivationalMessage: {
      title: simpleProgress >= simpleGoal ? 'Nailed it! 🎯' : simpleProgress > 0 ? 'You\'re cooking! 🔥' : 'Hey there! 👋',
      message: simpleProgress >= simpleGoal ? 'Goal crushed! Your accountability buddy is proud.' : simpleProgress > 0 ? `${simpleGoal - simpleProgress} more to go! You've got this.` : 'Ready to get moving this week?'
    },
    activities: [],
    weeklyDistance: simpleWeeklyDistance,
    status: (simpleProgress >= simpleGoal ? 'met' : simpleProgress > 0 ? 'partial' : 'missed') as const
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ padding: 24, paddingTop: 24 + insets.top }}>
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                Hey, {user?.name?.split(' ')[0] || 'Runner'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ 
                backgroundColor: '#f3f4f6',
                borderRadius: 20, 
                width: 40, 
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -4
              }}
            >
              <VectorIcon emoji="⚙️" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedWeekOffset(Math.min(selectedWeekOffset + 1, 11))}
              disabled={selectedWeekOffset >= 11}
              style={{ 
                backgroundColor: selectedWeekOffset >= 11 ? '#f3f4f6' : '#e5e7eb',
                borderRadius: 16, 
                width: 32, 
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}
            >
              <Text style={{ 
                fontSize: 16, 
                color: selectedWeekOffset >= 11 ? '#9ca3af' : '#374151' 
              }}>
                ←
              </Text>
            </TouchableOpacity>
            
            <Text style={{ fontSize: 14, color: '#6b7280', flex: 1, textAlign: 'center' }}>
              Week of {getWeekDateRangeForOffset(selectedWeekOffset)}
            </Text>
            
            <TouchableOpacity
              onPress={() => setSelectedWeekOffset(Math.max(selectedWeekOffset - 1, 0))}
              disabled={selectedWeekOffset <= 0}
              style={{ 
                backgroundColor: selectedWeekOffset <= 0 ? '#f3f4f6' : '#e5e7eb',
                borderRadius: 16, 
                width: 32, 
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 12
              }}
            >
              <Text style={{ 
                fontSize: 16, 
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
        />

        {/* Status Message */}
        <View style={{
          borderRadius: 16,
          paddingHorizontal: 24,
          paddingVertical: 12, // Reduced from 16 to 12
          marginBottom: 24,
          height: 80, // Fixed height instead of minHeight
          justifyContent: 'center', // Center content vertically
          backgroundColor: (() => {
            if (selectedWeekOffset > 0) {
              return progress >= goal ? '#f0fdf4' : progress > 0 ? '#fff7ed' : '#f9fafb';
            } else {
              return progress >= goal ? '#f0fdf4' : progress > 0 ? '#f0fdfa' : '#f0fdfa';
            }
          })(),
          borderWidth: 1,
          borderColor: (() => {
            if (selectedWeekOffset > 0) {
              return progress >= goal ? '#bbf7d0' : progress > 0 ? '#fed7aa' : '#e5e7eb';
            } else {
              return progress >= goal ? '#bbf7d0' : progress > 0 ? '#a7f3d0' : '#a7f3d0';
            }
          })(),
        }}>
          {(() => {
            let colorScheme: { title: string; message: string };

            // Determine colors based on week type and progress
            if (selectedWeekOffset > 0) {
              // Past week scenarios
              if (progress >= goal) {
                colorScheme = { title: '#166534', message: '#16a34a' };
              } else if (progress > 0) {
                colorScheme = { title: '#9a3412', message: '#ea580c' };
              } else {
                colorScheme = { title: '#6b7280', message: '#9ca3af' };
              }
            } else {
              // Current week scenarios
              if (progress >= goal) {
                colorScheme = { title: '#166534', message: '#16a34a' };
              } else {
                colorScheme = { title: '#134e4a', message: '#0f766e' };
              }
            }

            return (
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center',
                  color: colorScheme.title,
                }}>
                  {motivationalMessage.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  textAlign: 'center',
                  color: colorScheme.message,
                }}>
                  {motivationalMessage.message}
                </Text>
              </>
            );
          })()}
        </View>

        {/* Weekly Goal History */}
        {shouldShowSimpleDashboard ? (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
              Weekly Goal History
            </Text>
            <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                Loading your activity history...
              </Text>
            </View>
          </View>
        ) : (
          <WeeklyGoalHistory 
            weeklyData={weeklyData}
            selectedWeekOffset={selectedWeekOffset} 
            onWeekSelect={setSelectedWeekOffset}
          />
        )}

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          <View style={{
            flex: 1,
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                📅 {selectedWeekOffset === 0 ? 'This Week' : `${selectedWeekOffset} week${selectedWeekOffset === 1 ? '' : 's'} ago`}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              {weeklyDistance.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>miles</Text>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>📈 Streak</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              {progress}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>days</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
            {selectedWeekOffset === 0 ? 'Recent Activity' : `Activities from ${selectedWeekOffset} week${selectedWeekOffset === 1 ? '' : 's'} ago`}
          </Text>

          {!user ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>
              Please sign in to see your activities! 🏃‍♂️
            </Text>
          ) : loading ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>
              Loading your Strava activities...
            </Text>
          ) : error ? (
            <Text style={{ color: '#ef4444', textAlign: 'center', padding: 16 }}>
              Failed to load activities: {error}
            </Text>
          ) : displayActivities.length === 0 ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>
              {selectedWeekOffset === 0 ? 'No activities found. Time to get moving! 💪' : 'No activities found for this week.'}
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {displayActivities.map((activity, index) => (
                <TouchableOpacity
                  key={activity.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: activity.countsTowardGoal ? '#f0fdf4' : '#f9fafb',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: activity.countsTowardGoal ? '#bbf7d0' : '#e5e7eb',
                  }}
                  onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    backgroundColor: activity.countsTowardGoal ? '#dcfce7' : '#f3f4f6',
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
                  
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text 
                        style={{ 
                          fontSize: 14, 
                          fontWeight: '500', 
                          color: '#111827',
                          flex: 1,
                          marginRight: 8 
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {activity.name}
                      </Text>
                      <View style={{
                        backgroundColor: activity.countsTowardGoal ? '#10b981' : '#9ca3af',
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}>
                        <Text style={{ fontSize: 9, color: '#ffffff', fontWeight: '600' }}>
                          {activity.countsTowardGoal ? 'GOAL' : 'OTHER'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6b7280', numberOfLines: 1 }}>
                      {formatActivityDate(activity.date)} • {getActivityDisplayName(activity.type)}
                      {activity.distance > 0 && ` • ${(activity.distance / 1609.34).toFixed(1)}mi`}
                      {(activity.type === 'Run' || activity.type === 'VirtualRun') && activity.pace && ` • ${activity.pace}`}
                    </Text>
                  </View>
                  
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#6b7280',
                    minWidth: 30,
                    textAlign: 'right' 
                  }}>
                    {Math.round(activity.duration / 60)}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Motivational Footer */}
        <View style={{ padding: 16 }}>
          <Text style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            {isBehind ? "Don't make us blow up your phone... 📱" : 'Keep crushing those goals! 🎯'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
} 