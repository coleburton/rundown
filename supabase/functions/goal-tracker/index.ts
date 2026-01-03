import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface Goal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  target_unit: string;
  activity_types: string[];
  time_period: string;
  start_date?: string;
  end_date?: string;
}

interface Activity {
  id: string;
  user_id: string;
  type: string;
  start_date: string;
  distance: number;
  moving_time: number;
}

export async function handleRequest(req: Request): Promise<Response> {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'update_all';
    const userId = url.searchParams.get('user_id');

    if (req.method === 'POST') {
      if (action === 'update_all') {
        return await updateAllUserProgress(supabase);
      }
      if (action === 'update_user' && userId) {
        const result = await updateUserProgress(supabase, userId);
        return new Response(JSON.stringify(result), { status: 200 });
      }
      return invalidActionResponse();
    }

    if (req.method === 'GET' && action === 'check_missed' && userId) {
      return await checkMissedGoals(supabase, userId);
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Error in goal-tracker:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 }
    );
  }
}

if (import.meta.main) {
  serve(handleRequest);
}

function invalidActionResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Invalid action or missing user_id' }),
    { status: 400 }
  );
}

async function updateAllUserProgress(supabase: any): Promise<Response> {
  const { data: users, error: usersError } = await supabase
    .from('user_goals')
    .select('user_id')
    .eq('is_active', true)
    .distinct();

  if (usersError) throw usersError;

  const results = [];
  for (const user of users) {
    try {
      await updateUserProgress(supabase, user.user_id);
      results.push({ user_id: user.user_id, status: 'success' });
    } catch (error) {
      console.error(`Error updating progress for user ${user.user_id}:`, error);
      results.push({
        user_id: user.user_id,
        status: 'error',
        error: (error as Error).message
      });
    }
  }

  return new Response(
    JSON.stringify({ updated_users: results.length, results }),
    { status: 200 }
  );
}

async function updateUserProgress(supabase: any, userId: string) {
  const { data: goals, error: goalsError } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (goalsError) throw goalsError;

  const updatedGoals: string[] = [];

  for (const goal of goals) {
    try {
      const periods = generatePeriods(goal);
      for (const period of periods) {
        const progress = await calculateGoalProgress(supabase, goal, period);
        const { error: progressError } = await supabase
          .from('goal_progress')
          .upsert(
            {
              goal_id: goal.id,
              user_id: userId,
              period_start: period.start,
              period_end: period.end,
              current_value: progress.current,
              target_value: progress.target,
              last_updated: new Date().toISOString()
            },
            { onConflict: 'goal_id,period_start' }
          );

        if (progressError) {
          console.error(
            `Progress update error for goal ${goal.id}:`,
            progressError
          );
        }
      }
      updatedGoals.push(goal.id);
    } catch (error) {
      console.error(`Error updating goal ${goal.id}:`, error);
    }
  }

  return { updated_goals: updatedGoals };
}

export function generatePeriods(goal: Goal) {
  const now = new Date();
  const periods: { start: string; end: string }[] = [];

  switch (goal.time_period) {
    case 'weekly': {
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      periods.push({
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
      });
      break;
    }
    case 'monthly': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periods.push({
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0]
      });
      break;
    }
    case 'daily': {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      periods.push({
        start: today.toISOString().split('T')[0],
        end: todayEnd.toISOString().split('T')[0]
      });
      break;
    }
    case 'custom':
      if (goal.start_date && goal.end_date) {
        periods.push({ start: goal.start_date, end: goal.end_date });
      }
      break;
  }

  return periods;
}

export async function calculateGoalProgress(
  supabase: any,
  goal: Goal,
  period: { start: string; end: string }
) {
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', goal.user_id)
    .in('type', goal.activity_types)
    .gte('start_date', period.start)
    .lte('start_date', `${period.end}T23:59:59`);

  if (activitiesError) throw activitiesError;

  let currentValue = 0;

  switch (goal.goal_type) {
    case 'weekly_runs':
    case 'monthly_runs':
      currentValue = activities.length;
      break;
    case 'weekly_distance':
    case 'monthly_distance':
      currentValue = activities.reduce((sum: number, activity: Activity) => {
        const distanceInUnit =
          goal.target_unit === 'miles'
            ? activity.distance / 1609.34
            : activity.distance / 1000;
        return sum + distanceInUnit;
      }, 0);
      break;
    case 'streak_days': {
      const uniqueDays = new Set(
        activities.map((activity: Activity) =>
          activity.start_date.split('T')[0]
        )
      );
      currentValue = calculateStreak(Array.from(uniqueDays).sort());
      break;
    }
    case 'custom':
      if (goal.target_unit === 'runs') {
        currentValue = activities.length;
      } else if (
        goal.target_unit === 'miles' ||
        goal.target_unit === 'kilometers'
      ) {
        currentValue = activities.reduce((sum: number, activity: Activity) => {
          const distanceInUnit =
            goal.target_unit === 'miles'
              ? activity.distance / 1609.34
              : activity.distance / 1000;
          return sum + distanceInUnit;
        }, 0);
      } else if (goal.target_unit === 'minutes') {
        currentValue = activities.reduce((sum: number, activity: Activity) => {
          return sum + activity.moving_time / 60;
        }, 0);
      }
      break;
  }

  return {
    current: Math.round(currentValue * 100) / 100,
    target: goal.target_value
  };
}

function calculateStreak(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;

  let currentStreak = 1;
  let maxStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]);
    const currDate = new Date(sortedDays[i]);
    const dayDiff =
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export async function checkMissedGoals(supabase: any, userId: string) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const { data: progress, error: progressError } = await supabase
    .from('goal_progress')
    .select('*, user_goals!inner(*)')
    .eq('user_id', userId)
    .eq('user_goals.is_active', true)
    .lte('period_end', today);

  if (progressError) throw progressError;

  const missedGoals = progress.filter(
    (p: any) => !p.is_achieved && new Date(p.period_end) < now
  );

  const upcomingDeadlines = progress.filter((p: any) => {
    const deadline = new Date(p.period_end);
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return !p.is_achieved && daysUntilDeadline <= 2 && daysUntilDeadline > 0;
  });

  return new Response(
    JSON.stringify({
      missed_goals: missedGoals,
      upcoming_deadlines: upcomingDeadlines,
      should_notify: missedGoals.length > 0 || upcomingDeadlines.length > 0
    }),
    { status: 200 }
  );
}
