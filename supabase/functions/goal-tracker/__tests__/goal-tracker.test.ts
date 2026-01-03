import {
  assertEquals,
  assertExists
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  generatePeriods,
  calculateGoalProgress,
  checkMissedGoals
} from '../index.ts';

function createMockSupabase(options: {
  activities?: any[];
  progress?: any[];
} = {}) {
  const { activities = [], progress = [] } = options;

  return {
    from(table: string) {
      if (table === 'activities') {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                gte: () => ({
                  lte: () =>
                    Promise.resolve({
                      data: activities,
                      error: null
                    })
                })
              })
            })
          })
        };
      }

      if (table === 'goal_progress') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                lte: () =>
                  Promise.resolve({
                    data: progress,
                    error: null
                  })
              })
            })
          })
        };
      }

      throw new Error(`Unhandled table ${table}`);
    }
  };
}

Deno.test('generatePeriods builds expected windows', () => {
  const weekly = generatePeriods({
    id: '1',
    user_id: 'user',
    goal_type: 'weekly_runs',
    target_value: 3,
    target_unit: 'runs',
    activity_types: ['Run'],
    time_period: 'weekly'
  });
  assertEquals(weekly.length, 1);
  assertExists(weekly[0].start);
});

Deno.test('calculateGoalProgress aggregates activities', async () => {
  const supabase = createMockSupabase({
    activities: [
      { distance: 1609.34, start_date: '2024-06-03', moving_time: 600 },
      { distance: 1609.34, start_date: '2024-06-04', moving_time: 700 }
    ]
  });

  const goal = {
    id: 'goal',
    user_id: 'user',
    goal_type: 'weekly_distance',
    target_value: 10,
    target_unit: 'miles',
    activity_types: ['Run'],
    time_period: 'weekly'
  };

  const progress = await calculateGoalProgress(supabase, goal, {
    start: '2024-06-03',
    end: '2024-06-09'
  });

  assertEquals(progress.target, 10);
  assertEquals(progress.current, 2);
});

Deno.test('checkMissedGoals returns notification payload', async () => {
  const supabase = createMockSupabase({
    progress: [
      {
        is_achieved: false,
        period_end: new Date(Date.now() - 3 * 864e5).toISOString(),
        user_goals: { id: 'goal' }
      }
    ]
  });

  const response = await checkMissedGoals(supabase, 'user');
  const body = await response.json();
  assertEquals(body.should_notify, true);
  assertEquals(body.missed_goals.length, 1);
});
