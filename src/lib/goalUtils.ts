import { GoalType } from '../components/EnhancedGoalPicker';

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
    return { progress: 0, goal: 3, goalType: 'runs' };
  }

  const goalType = user.goal_type || 'runs';
  const goalValue = user.goal_value || user.goal_per_week || 3;
  
  // Filter activities for the current week
  const weeklyActivities = activities.filter(
    (activity) => new Date(activity.date) >= weekStart
  );

  let progress = 0;

  switch (goalType) {
    case 'runs':
      // Count running activities
      progress = weeklyActivities.filter(a => 
        a.type.toLowerCase().includes('run')
      ).length;
      break;
      
    case 'run_miles':
      // Sum miles from running activities
      progress = weeklyActivities
        .filter(a => a.type.toLowerCase().includes('run'))
        .reduce((sum, activity) => sum + (activity.distance / 1609.34), 0);
      break;
      
    case 'activities':
      // Count all activities
      progress = weeklyActivities.length;
      break;
      
    case 'bike_rides':
      // Count bike/cycling activities
      progress = weeklyActivities.filter(a => 
        a.type.toLowerCase().includes('bike') || 
        a.type.toLowerCase().includes('cycling') ||
        a.type.toLowerCase().includes('ride')
      ).length;
      break;
      
    case 'bike_miles':
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
  if (goalType === 'run_miles' || goalType === 'bike_miles') {
    progress = Math.round(progress * 10) / 10;
  }

  return { progress, goal: goalValue, goalType };
}

export function getGoalDisplayText(goalType: GoalType): { unit: string; emoji: string; name: string } {
  switch (goalType) {
    case 'runs':
      return { unit: 'runs', emoji: '🏃‍♂️', name: 'Runs' };
    case 'run_miles':
      return { unit: 'miles run', emoji: '📏', name: 'Running Miles' };
    case 'activities':
      return { unit: 'activities', emoji: '🏋️‍♀️', name: 'Activities' };
    case 'bike_rides':
      return { unit: 'rides', emoji: '🚴‍♂️', name: 'Bike Rides' };
    case 'bike_miles':
      return { unit: 'miles cycled', emoji: '🚵‍♀️', name: 'Cycling Miles' };
    default:
      return { unit: 'runs', emoji: '🏃‍♂️', name: 'Runs' };
  }
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
      title: 'Look at you, fitness machine! 💪',
      message: `Goal crushed! Your accountability buddy is proud of your ${name.toLowerCase()} progress.`
    };
  }
  
  if (isBehind) {
    const remaining = goal - progress;
    const unit = getGoalDisplayText(goalType).unit;
    return {
      title: "Uhhh, Sunday's coming fast... ⏰",
      message: `${remaining.toFixed(goalType.includes('miles') ? 1 : 0)} more ${unit} needed. Your mom is watching.`
    };
  }
  
  const remaining = goal - progress;
  const unit = getGoalDisplayText(goalType).unit;
  return {
    title: "You're doing great! Keep it up! 💪",
    message: `${remaining.toFixed(goalType.includes('miles') ? 1 : 0)} more ${unit} to go!`
  };
}