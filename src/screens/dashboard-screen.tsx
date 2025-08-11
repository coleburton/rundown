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
  
  // Get runs for the selected week
  const getRunsForSelectedWeek = () => {
    const now = new Date();
    const startOfSelectedWeek = new Date(now);
    startOfSelectedWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1) - (selectedWeekOffset * 7));
    startOfSelectedWeek.setHours(0, 0, 0, 0);
    
    const endOfSelectedWeek = new Date(startOfSelectedWeek);
    endOfSelectedWeek.setDate(startOfSelectedWeek.getDate() + 6);
    endOfSelectedWeek.setHours(23, 59, 59, 999);

    const recentRuns = getRecentRuns(100);
    return recentRuns.filter(run => {
      const runDate = new Date(run.date);
      return runDate >= startOfSelectedWeek && runDate <= endOfSelectedWeek;
    }).slice(0, 5); // Limit to 5 most recent runs from that week
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
          backgroundColor: isOnTrack ? '#f0fdf4' : isBehind ? '#fff7ed' : '#f0fdfa',
          borderWidth: 1,
          borderColor: isOnTrack ? '#bbf7d0' : isBehind ? '#fed7aa' : '#a7f3d0',
        }}>
          {(() => {
            // Create custom motivational message for past weeks
            if (selectedWeekOffset > 0) {
              const goalDisplay = getGoalDisplayText(goalType);
              if (progress >= goal) {
                return (
                  <>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginBottom: 8,
                      textAlign: 'center',
                      color: '#166534',
                    }}>
                      Nailed it! 🎯
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      textAlign: 'center',
                      color: '#16a34a',
                    }}>
                      Goal crushed that week! Your accountability buddy was proud.
                    </Text>
                  </>
                );
              } else if (progress > 0) {
                const remaining = goal - progress;
                return (
                  <>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginBottom: 8,
                      textAlign: 'center',
                      color: '#9a3412',
                    }}>
                      Close, but no cigar 😬
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      textAlign: 'center',
                      color: '#ea580c',
                    }}>
                      Missed by {remaining.toFixed(goalType.includes('miles') ? 1 : 0)} {goalDisplay.unit}. Your mom remembers.
                    </Text>
                  </>
                );
              } else {
                return (
                  <>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginBottom: 8,
                      textAlign: 'center',
                      color: '#9a3412',
                    }}>
                      Ghost week 👻
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      textAlign: 'center',
                      color: '#ea580c',
                    }}>
                      Zero {goalDisplay.unit} that week. The couch remembers everything.
                    </Text>
                  </>
                );
              }
            }

            // Use existing logic for current week
            const motivational = getMotivationalMessage(progress, goal, goalType, isOnTrack, isBehind);
            return (
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 8,
                  textAlign: 'center',
                  color: isOnTrack ? '#166534' : isBehind ? '#9a3412' : '#134e4a',
                }}>
                  {motivational.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  textAlign: 'center',
                  color: isOnTrack ? '#16a34a' : isBehind ? '#ea580c' : '#0f766e',
                }}>
                  {motivational.message}
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

        {/* Recent Runs */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
            {selectedWeekOffset === 0 ? 'Recent Runs' : `Runs from ${selectedWeekOffset} week${selectedWeekOffset === 1 ? '' : 's'} ago`}
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
          ) : getRunsForSelectedWeek().length === 0 ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>
              {selectedWeekOffset === 0 ? 'No runs found. Time to lace up! 👟' : 'No runs found for this week.'}
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {getRunsForSelectedWeek().map((run, index) => (
                <View
                  key={run.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f9fafb',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 8,
                      height: 8,
                      backgroundColor: index % 2 === 0 ? '#10b981' : '#14b8a6',
                      borderRadius: 4,
                      marginRight: 12,
                    }} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                        {run.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>
                        {formatActivityDate(run.date)} • {run.distance} miles • {run.pace} min/mi
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>
                    {run.duration}m
                  </Text>
                </View>
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