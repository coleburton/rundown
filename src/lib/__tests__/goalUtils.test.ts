import {
  calculateGoalProgress,
  calculateGoalProgressWithHistory,
  getGoalDisplayText,
  getMotivationalMessage,
  type User as GoalUser
} from '@/lib/goalUtils';
import { supabase } from '@/lib/supabase';
import type { GoalType } from '@/components/EnhancedGoalPicker';

jest.mock('@/lib/supabase');

const baseDate = new Date('2024-06-03T00:00:00Z'); // Monday

const sampleActivities = [
  { id: '1', type: 'Run', distance: 1609.34, duration: 3600, date: '2024-06-03T10:00:00Z' },
  { id: '2', type: 'VirtualRun', distance: 3218.68, duration: 4000, date: '2024-06-04T10:00:00Z' },
  { id: '3', type: 'Ride', distance: 8046.72, duration: 5400, date: '2024-06-05T10:00:00Z' },
];

describe('goalUtils', () => {
  test('calculateGoalProgress counts by goal type', () => {
    const baseUser: GoalUser = {
      goal_type: 'total_activities',
      goal_value: 3
    };

    expect(calculateGoalProgress(baseUser, sampleActivities, baseDate)).toEqual({
      progress: 3,
      goal: 3,
      goalType: 'total_activities'
    });

    expect(
      calculateGoalProgress(
        { goal_type: 'total_runs', goal_value: 3 },
        sampleActivities,
        baseDate
      )
    ).toMatchObject({
      progress: 2,
      goal: 3
    });

    const milesResult = calculateGoalProgress(
      { goal_type: 'total_miles_running', goal_value: 5 },
      sampleActivities,
      baseDate
    );
    expect(milesResult.progress).toBeCloseTo(3);

    expect(
      calculateGoalProgress(
        { goal_type: 'total_rides_biking', goal_value: 2 },
        sampleActivities,
        baseDate
      )
    ).toMatchObject({
      progress: 1,
      goal: 2
    });
  });

  test('getGoalDisplayText returns label metadata', () => {
    expect(getGoalDisplayText('total_runs')).toEqual({
      unit: 'runs',
      emoji: '🏃',
      name: 'Total Runs'
    });
  });

  test('getMotivationalMessage switches based on status', () => {
    expect(getMotivationalMessage(3, 3, 'total_runs', true, false).title).toContain('fitness');
    expect(getMotivationalMessage(1, 3, 'total_runs', false, true).message).toContain('more runs');
    expect(getMotivationalMessage(1, 3, 'total_runs', false, false).message).toContain('more runs');
  });

  test('calculateGoalProgressWithHistory uses RPC goal data', async () => {
    const rpcMock = supabase.rpc as jest.Mock;
    rpcMock.mockResolvedValueOnce({
      data: [{ goal_type: 'total_runs', goal_value: 5 }],
      error: null
    });

    const result = await calculateGoalProgressWithHistory('user-1', sampleActivities, baseDate);

    expect(rpcMock).toHaveBeenCalledWith('get_goal_for_week', {
      p_user_id: 'user-1',
      p_week_start: '2024-06-03'
    });
    expect(result.goalType).toBe('total_runs');
    expect(result.progress).toBe(2);
    expect(result.goal).toBe(5);
  });
});
