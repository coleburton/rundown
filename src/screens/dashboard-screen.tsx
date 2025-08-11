import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth-context';
import { useStravaData } from '@/hooks/useStravaData';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatActivityDate, getWeekDateRange, isValidDate } from '@/lib/utils';
import { calculateGoalProgress, getGoalDisplayText, getMotivationalMessage } from '@/lib/goalUtils';
import Svg, { Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

type RootStackParamList = {
  Welcome: undefined;
  Dashboard: undefined;
  Settings: undefined;
  ActivityDetail: { activityId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// SVG-based progress ring component
const ProgressRing = ({ progress, goal, isOnTrack, isBehind, goalType, goalDisplay }: { 
  progress: number; 
  goal: number; 
  isOnTrack: boolean; 
  isBehind: boolean; 
  goalType: string;
  goalDisplay: { unit: string; emoji: string; name: string };
}) => {
  // Cap the progress percentage at 100% when progress exceeds goal
  const progressPercentage = Math.min((progress / goal) * 100, 100);
  const size = 192;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  
  const progressColor = isOnTrack ? '#10b981' : isBehind ? '#f59e0b' : '#14b8a6';
  
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
          
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
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
          {isOnTrack && (
            <Text style={{ fontSize: 32, marginTop: 4 }}>🔥</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// Weekly Goal History component
const WeeklyGoalHistory = ({ activities, goal, selectedWeekOffset, onWeekSelect }: { activities: any[], goal: number, selectedWeekOffset: number, onWeekSelect: (weekOffset: number) => void }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  // Calculate weekly goal achievement for more weeks (12 weeks to show more history)
  const getWeeklyGoalAchievement = () => {
    const now = new Date();
    const weeks = [];
    
    // Generate data for the last 12 weeks
    for (let i = 0; i < 12; i++) {
      // Calculate week start (Monday) for i weeks ago
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (7 * i));
      weekStart.setHours(0, 0, 0, 0);
      
      // Calculate week end (Sunday)  
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Count activities in this week
      const weeklyRuns = activities.filter(
        (activity) => {
          const activityDate = new Date(activity.date);
          return activityDate >= weekStart && activityDate <= weekEnd;
        }
      );
      
      // Determine if goal was met
      const status = weeklyRuns.length >= goal ? 'met' : weeklyRuns.length > 0 ? 'partial' : 'missed';
      
      weeks.push({
        weekStart,
        weekEnd,
        activityCount: weeklyRuns.length,
        status
      });
    }
    
    // Reverse so most recent week is on the right
    return weeks.reverse();
  };
  
  const weeklyAchievements = getWeeklyGoalAchievement();
  
  // Auto-scroll to selected week
  useEffect(() => {
    if (scrollViewRef.current && selectedWeekOffset > 4) {
      const blockWidth = 44; // 28px width + 16px margins
      const scrollToX = Math.max(0, (selectedWeekOffset - 4) * blockWidth);
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
          {weeklyAchievements.map((week, index) => {
            // Determine color based on status
            const blockColor = 
              week.status === 'met' ? '#10b981' :  // Green for met
              week.status === 'partial' ? '#f59e0b' : // Orange for partial
              '#e5e7eb'; // Gray for missed
            
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
          })}
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

export function DashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuthContext();
  const insets = useSafeAreaInsets();
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.
  
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
    isAuthenticated,
    getAthlete,
  } = useStravaData();

  // Convert Strava activities to the format expected by existing components
  const activities = getRecentRuns(50).map(run => ({
    id: run.id,
    date: run.date,
    distance: run.distance * 1609.34, // Convert miles back to meters for compatibility
    duration: run.duration * 60, // Convert minutes back to seconds
    type: 'Run'
  }));

  console.log('Dashboard render:', {
    activitiesCount: activities.length,
    loading,
    error,
    user: user?.id
  });

  // Calculate progress for the selected week
  const getProgressForSelectedWeek = () => {
    if (selectedWeekOffset === 0) {
      // Current week - use the existing hook
      return getWeeklyProgress(user?.goal_per_week || 3);
    } else {
      // Previous week - calculate manually
      const now = new Date();
      const startOfSelectedWeek = new Date(now);
      startOfSelectedWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (selectedWeekOffset * 7));
      startOfSelectedWeek.setHours(0, 0, 0, 0);
      
      const endOfSelectedWeek = new Date(startOfSelectedWeek);
      endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
      endOfSelectedWeek.setHours(23, 59, 59, 999);
      
      const recentRuns = getRecentRuns(100);
      const selectedWeekRuns = recentRuns.filter(run => {
        const runDate = new Date(run.date);
        return runDate >= startOfSelectedWeek && runDate <= endOfSelectedWeek;
      });
      
      return {
        progress: selectedWeekRuns.length,
        goal: user?.goal_per_week || 3
      };
    }
  };
  
  const { progress, goal } = getProgressForSelectedWeek();
  const daysLeft = selectedWeekOffset === 0 ? getDaysLeft() : 0; // Only show days left for current week
  const goalType = 'runs'; // Default to runs for now
  
  console.log('Dashboard render with Strava data:', {
    activitiesCount: activities.length,
    progress,
    goal,
    loading,
    error,
    isAuthenticated: isAuthenticated()
  });
  const goalDisplay = getGoalDisplayText(goalType);

  const isOnTrack = progress >= goal;
  const isBehind = daysLeft <= 2 && progress < goal;

  // Calculate total weekly distance for selected week
  const getWeeklyDistanceForSelectedWeek = () => {
    const now = new Date();
    const startOfSelectedWeek = new Date(now);
    startOfSelectedWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (selectedWeekOffset * 7));
    startOfSelectedWeek.setHours(0, 0, 0, 0);
    
    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
    endOfSelectedWeek.setHours(23, 59, 59, 999);

    const recentRuns = getRecentRuns(100);
    const weeklyRuns = recentRuns.filter(run => {
      const runDate = new Date(run.date);
      return runDate >= startOfSelectedWeek && runDate <= endOfSelectedWeek;
    });

    const totalMiles = weeklyRuns.reduce((sum, run) => sum + run.distance, 0);
    return totalMiles.toFixed(1);
  };
  
  // Get activities for the selected week
  const getActivitiesForSelectedWeek = () => {
    const now = new Date();
    const startOfSelectedWeek = new Date(now);
    startOfSelectedWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (selectedWeekOffset * 7));
    startOfSelectedWeek.setHours(0, 0, 0, 0);
    
    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
    endOfSelectedWeek.setHours(23, 59, 59, 999);

    const recentActivities = getRecentActivities(100);
    return recentActivities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= startOfSelectedWeek && activityDate <= endOfSelectedWeek;
    }).slice(0, 10); // Limit to 10 most recent activities from that week
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

  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getMotivationalMessages = (scenario: 'goal_met' | 'current_with_activity' | 'current_no_activity' | 'past_partial' | 'past_none', progress: number, goal: number, goalDisplay: any) => {
    const remaining = goal - progress;
    
    switch (scenario) {
      case 'goal_met':
        return {
          titles: ['Nailed it! 🎯', 'Crushed it! 💪', 'Goal smashed! 🔥', 'Victory! 🏆', 'Boom! Done! 🚀'],
          messages: [
            'Goal crushed! Your accountability buddy was proud.',
            'Absolutely nailed it this week. Chef\'s kiss.',
            'Goal demolished! The couch is jealous.',
            'Mission accomplished. Your future self thanks you.',
            'Perfectly executed. Mom would be proud.'
          ]
        };
      
      case 'current_with_activity':
        return {
          titles: ['You\'re cooking! 🔥', 'On fire! 💪', 'Rolling! 🚀', 'Keep going! 💯', 'Momentum! ⚡'],
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
          titles: ['Time to start! 👟', 'Let\'s go! 🏃‍♂️', 'Week\'s waiting! ⏰', 'Ready to run? 🎯', 'Lace up! 💪'],
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
          titles: ['Close call! 😬', 'Almost! 😅', 'So close! 😭', 'Nearly there! 😤', 'Ouch! 😩'],
          messages: [
            `Missed by ${remaining}. Your mom remembers.`,
            `${remaining} short. The couch celebrated.`,
            `Almost had it! Missed by ${remaining}.`,
            `${remaining} away from glory. Next time!`,
            `Close but no cigar. Off by ${remaining}.`
          ]
        };
      
      case 'past_none':
        return {
          titles: ['Ghost week 👻', 'Invisible week 🫥', 'Couch week 🛋️', 'Mystery week 🕵️', 'Vanishing act 💨'],
          messages: [
            'Zero runs. The couch remembers.',
            'Completely MIA. Your mom noticed.',
            'Full ghost mode. Netflix won that week.',
            'Radio silence. Your shoes got dusty.',
            'Total no-show. Excuses threw a party.'
          ]
        };
      
      default:
        return {
          titles: ['Keep going! 💪'],
          messages: ['You\'ve got this!']
        };
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ padding: 24, paddingTop: 24 + insets.top }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              Hey {getAthlete()?.firstname || user?.name?.split(' ')[0] || 'Runner'} 👋
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
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
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ 
              backgroundColor: '#f3f4f6',
              borderRadius: 20, 
              width: 40, 
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 16
            }}
          >
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Ring */}
        <ProgressRing 
          progress={progress} 
          goal={goal} 
          isOnTrack={isOnTrack} 
          isBehind={isBehind} 
          goalType={goalType}
          goalDisplay={goalDisplay}
        />

        {/* Status Message */}
        <View style={{
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          textAlign: 'center',
          backgroundColor: (() => {
            if (selectedWeekOffset > 0) {
              return progress >= goal ? '#f0fdf4' : '#fff7ed';
            } else {
              return progress >= goal ? '#f0fdf4' : progress > 0 ? '#f0fdfa' : '#f0fdfa';
            }
          })(),
          borderWidth: 1,
          borderColor: (() => {
            if (selectedWeekOffset > 0) {
              return progress >= goal ? '#bbf7d0' : '#fed7aa';
            } else {
              return progress >= goal ? '#bbf7d0' : progress > 0 ? '#a7f3d0' : '#a7f3d0';
            }
          })(),
        }}>
          {(() => {
            const goalDisplay = getGoalDisplayText(goalType);
            let scenario: 'goal_met' | 'current_with_activity' | 'current_no_activity' | 'past_partial' | 'past_none';
            let colorScheme: { title: string; message: string; bg: string; border: string };

            // Determine scenario and colors
            if (selectedWeekOffset > 0) {
              // Past week scenarios
              if (progress >= goal) {
                scenario = 'goal_met';
                colorScheme = { title: '#166534', message: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
              } else if (progress > 0) {
                scenario = 'past_partial';
                colorScheme = { title: '#9a3412', message: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
              } else {
                scenario = 'past_none';
                colorScheme = { title: '#9a3412', message: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
              }
            } else {
              // Current week scenarios
              if (progress >= goal) {
                scenario = 'goal_met';
                colorScheme = { title: '#166534', message: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
              } else if (progress > 0) {
                scenario = 'current_with_activity';
                colorScheme = { title: '#134e4a', message: '#0f766e', bg: '#f0fdfa', border: '#a7f3d0' };
              } else {
                scenario = 'current_no_activity';
                colorScheme = { title: '#134e4a', message: '#0f766e', bg: '#f0fdfa', border: '#a7f3d0' };
              }
            }

            const messages = getMotivationalMessages(scenario, progress, goal, goalDisplay);
            const randomTitle = getRandomMessage(messages.titles);
            const randomMessage = getRandomMessage(messages.messages);

            return (
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center',
                  color: colorScheme.title,
                }}>
                  {randomTitle}
                </Text>
                <Text style={{
                  fontSize: 14,
                  textAlign: 'center',
                  color: colorScheme.message,
                }}>
                  {randomMessage}
                </Text>
              </>
            );
          })()}
        </View>

        {/* Weekly Goal History - Add this new component */}
        <WeeklyGoalHistory 
          activities={activities} 
          goal={goal} 
          selectedWeekOffset={selectedWeekOffset} 
          onWeekSelect={setSelectedWeekOffset}
        />

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
              {getWeeklyDistanceForSelectedWeek()}
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

          {!isAuthenticated() ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>
              Connect to Strava to see your activities! 🏃‍♂️
            </Text>
          ) : loading ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>
              Loading your Strava activities...
            </Text>
          ) : error ? (
            <Text style={{ color: '#ef4444', textAlign: 'center', padding: 16 }}>
              Failed to load activities: {error}
            </Text>
          ) : getActivitiesForSelectedWeek().length === 0 ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>
              {selectedWeekOffset === 0 ? 'No activities found. Time to get moving! 💪' : 'No activities found for this week.'}
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {getActivitiesForSelectedWeek().map((activity, index) => (
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
                    <Text style={{ fontSize: 16 }}>
                      {getActivityIcon(activity.type)}
                    </Text>
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
                      {activity.distance > 0 && ` • ${activity.distance}mi`}
                      {(activity.type === 'Run' || activity.type === 'VirtualRun') && activity.pace && ` • ${activity.pace}`}
                    </Text>
                  </View>
                  
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#6b7280',
                    minWidth: 30,
                    textAlign: 'right' 
                  }}>
                    {activity.duration}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Motivational Footer */}
        <View style={{ padding: 16 }}>
          <Text style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            {isBehind ? "Don't make us text your mom... 📱" : 'Keep crushing those goals! 🎯'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
} 