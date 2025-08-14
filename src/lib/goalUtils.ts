import { GoalType } from '../components/EnhancedGoalPicker';
import { supabase } from './supabase';

export interface User {
  goal_type?: GoalType;
  goal_value?: number;
  goal_per_week?: number;
}

export interface Activity {
  id: string;
  type: string;
  distance: number;
  duration: number;
  date: string;
}

export function calculateGoalProgress(
  user: User | null,
  activities: Activity[],
  weekStart: Date
): { progress: number; goal: number; goalType: GoalType } {
  if (!user) {
    return { progress: 0, goal: 3, goalType: 'total_activities' };
  }

  const goalType = user.goal_type || 'total_activities';
  const goalValue = user.goal_value || user.goal_per_week || 3;
  
  // Filter activities for the current week
  const weeklyActivities = activities.filter(
    (activity) => new Date(activity.date) >= weekStart
  );

  let progress = 0;

  switch (goalType) {
    case 'total_activities':
      // Count all activities (including hikes, walks, etc.)
      progress = weeklyActivities.length;
      break;
      
    case 'total_runs':
      // Count running activities
      progress = weeklyActivities.filter(a => 
        a.type.toLowerCase().includes('run')
      ).length;
      break;
      
    case 'total_miles_running':
      // Sum miles from running activities
      progress = weeklyActivities
        .filter(a => a.type.toLowerCase().includes('run'))
        .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);
      break;
      
    case 'total_rides_biking':
      // Count bike/cycling activities
      progress = weeklyActivities.filter(a => 
        a.type.toLowerCase().includes('bike') || 
        a.type.toLowerCase().includes('cycling') ||
        a.type.toLowerCase().includes('ride')
      ).length;
      break;
      
    case 'total_miles_biking':
      // Sum miles from bike/cycling activities
      progress = weeklyActivities
        .filter(a => 
          a.type.toLowerCase().includes('bike') || 
          a.type.toLowerCase().includes('cycling') ||
          a.type.toLowerCase().includes('ride')
        )
        .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);
      break;
  }

  // Round progress for mile-based goals
  if (goalType === 'total_miles_running' || goalType === 'total_miles_biking') {
    progress = Math.round(progress * 10) / 10;
  }

  return { progress, goal: goalValue, goalType };
}

export function getGoalDisplayText(goalType: GoalType): { unit: string; emoji: string; name: string } {
  switch (goalType) {
    case 'total_activities':
      return { unit: 'activities', emoji: '🎯', name: 'Total Activities' };
    case 'total_runs':
      return { unit: 'runs', emoji: '🏃', name: 'Total Runs' };
    case 'total_miles_running':
      return { unit: 'miles', emoji: '🏃‍♂️', name: 'Running Miles' };
    case 'total_rides_biking':
      return { unit: 'rides', emoji: '🚴', name: 'Total Rides' };
    case 'total_miles_biking':
      return { unit: 'miles', emoji: '🚴‍♂️', name: 'Cycling Miles' };
    default:
      return { unit: 'activities', emoji: '🎯', name: 'Total Activities' };
  }
}

// Get the goal that was active for a specific week
export async function getGoalForWeek(
  userId: string,
  weekStart: Date
): Promise<{ goal_type: GoalType; goal_value: number }> {
  try {
    const { data, error } = await supabase.rpc('get_goal_for_week', {
      p_user_id: userId,
      p_week_start: weekStart.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
    });

    if (error) {
      console.error('Error getting goal for week:', error);
      // Fallback to default goal
      return { goal_type: 'total_activities', goal_value: 3 };
    }

    if (data && data.length > 0) {
      return {
        goal_type: data[0].goal_type as GoalType,
        goal_value: data[0].goal_value
      };
    }

    // Fallback to default if no data
    return { goal_type: 'total_activities', goal_value: 3 };
  } catch (error) {
    console.error('Error in getGoalForWeek:', error);
    return { goal_type: 'total_activities', goal_value: 3 };
  }
}

// Calculate goal progress using historical goals for specific weeks
export async function calculateGoalProgressWithHistory(
  userId: string,
  activities: Activity[],
  weekStart: Date
): Promise<{ progress: number; goal: number; goalType: GoalType }> {
  // Get the goal that was active for this specific week
  const { goal_type: goalType, goal_value: goalValue } = await getGoalForWeek(userId, weekStart);
  
  // Filter activities for the current week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const weeklyActivities = activities.filter(
    (activity) => {
      const activityDate = new Date(activity.date);
      return activityDate >= weekStart && activityDate <= weekEnd;
    }
  );

  let progress = 0;

  switch (goalType) {
    case 'total_activities':
      // Count all activities (including hikes, walks, etc.)
      progress = weeklyActivities.length;
      break;
      
    case 'total_runs':
      // Count running activities
      progress = weeklyActivities.filter(a => 
        a.type.toLowerCase().includes('run')
      ).length;
      break;
      
    case 'total_miles_running':
      // Sum miles from running activities
      progress = weeklyActivities
        .filter(a => a.type.toLowerCase().includes('run'))
        .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);
      break;
      
    case 'total_rides_biking':
      // Count bike/cycling activities
      progress = weeklyActivities.filter(a => 
        a.type.toLowerCase().includes('bike') || 
        a.type.toLowerCase().includes('cycling') ||
        a.type.toLowerCase().includes('ride')
      ).length;
      break;
      
    case 'total_miles_biking':
      // Sum miles from bike/cycling activities
      progress = weeklyActivities
        .filter(a => 
          a.type.toLowerCase().includes('bike') || 
          a.type.toLowerCase().includes('cycling') ||
          a.type.toLowerCase().includes('ride')
        )
        .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);
      break;
  }

  // Round progress for mile-based goals
  if (goalType === 'total_miles_running' || goalType === 'total_miles_biking') {
    progress = Math.round(progress * 10) / 10;
  }

  return { progress, goal: goalValue, goalType };
}

export function getMotivationalMessage(
  progress: number, 
  goal: number, 
  goalType: GoalType,
  isOnTrack: boolean,
  isBehind: boolean
): { title: string; message: string } {
  const { name } = getGoalDisplayText(goalType);
  
  if (isOnTrack) {
    return {
      title: 'Look at you, fitness machine!',
      message: `Goal crushed! Your accountability buddy is proud of your ${name.toLowerCase()} progress.`
    };
  }
  
  if (isBehind) {
    const remaining = goal - progress;
    const unit = getGoalDisplayText(goalType).unit;
    return {
      title: "Uhhh, Sunday's coming fast...",
      message: `${remaining.toFixed(goalType.includes('miles') ? 1 : 0)} more ${unit} needed. Someone's watching.`
    };
  }
  
  const remaining = goal - progress;
  const unit = getGoalDisplayText(goalType).unit;
  return {
    title: "You're doing great! Keep it up!",
    message: `${remaining.toFixed(goalType.includes('miles') ? 1 : 0)} more ${unit} to go!`
  };
}