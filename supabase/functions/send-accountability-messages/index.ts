import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Twilio } from 'https://esm.sh/twilio@4.19.0';

type MessageStyle = 'supportive' | 'snarky' | 'chaotic' | 'competitive' | 'achievement';
type MessageType = 'missed-goal' | 'weekly-summary';
type GoalType = 'runs' | 'miles' | 'activities' | 'bike_activities' | 'bike_miles';

interface MessageBank {
  [key in MessageStyle]: {
    [key in MessageType]: string[];
  };
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

const twilio = new Twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);

const MESSAGE_TEMPLATES: MessageBank = {
  supportive: {
    'missed-goal': [
      "Hey! Looks like {user} missed their run today. Maybe send them some encouragement?",
      "Just checking in - {user} could use a little motivation to hit their running goals. 🏃‍♂️",
      "{user} is falling behind on their runs this week. A little support goes a long way! ❤️",
      "Your friend {user} missed their workout today. Sometimes we all need a gentle nudge! 💪",
      "Heads up - {user} skipped their run. Maybe check in and see how they're doing?",
      "Hey there! {user} could use some encouragement to get back on track with their goals. 🌟",
      "{user} missed today's run - perhaps they need to hear from a supportive friend like you!",
      "Friendly reminder: {user} didn't make it out for their run today. Your encouragement means everything! 💙",
      "Just a heads up that {user} is behind on their weekly goal. A kind word could make all the difference!",
      "Your running buddy {user} could use some positive vibes - they missed today's workout. 🤗"
    ],
    'weekly-summary': [
      "Great effort this week! {user} completed {runsCompleted} out of {runGoal} planned runs. 🎉",
      "Weekly update: {user} did {runsCompleted}/{runGoal} runs. Every step counts! 🏃‍♂️",
      "Another week of progress! {user} finished {runsCompleted} runs. Keep that momentum going! ⭐",
      "{user} had {runsCompleted} runs this week (goal was {runGoal}). Progress is progress! 💪",
      "Week recap: {user} got {runsCompleted} runs in. Proud of their dedication! 🌟",
      "This week {user} completed {runsCompleted} out of {runGoal} runs. Building those healthy habits! 💚",
      "Weekly check-in: {user} managed {runsCompleted} runs. Consistency is key! 👏",
      "{user}'s week: {runsCompleted}/{runGoal} runs completed. Each workout is a victory! 🏆"
    ],
    'congratulatory': [
      "Amazing news! {user} crushed their weekly running goal with {runsCompleted} runs! 🎉",
      "Celebrate time! {user} exceeded their goal and completed {runsCompleted} runs this week! 🏆",
      "Your friend {user} is on fire - they completed all {runsCompleted} planned runs! 💪",
      "Success story alert! {user} hit their weekly target with {runsCompleted} runs! 🌟",
      "Incredible work! {user} stayed committed and finished all {runsCompleted} runs this week! 👏",
      "Victory lap time! {user} achieved their goal of {runsCompleted} runs! 🥇",
      "Proud moment: {user} completed their full weekly goal of {runsCompleted} runs! ❤️"
    ],
    'motivational': [
      "Sending positive energy {user}'s way - you've got this! 💪",
      "Reminder that {user} is stronger than any excuse. Keep going! 🌟",
      "Every champion has doubts. {user} just needs to push through! 🏆",
      "The hardest part is starting. {user} can do this! 🚀",
      "Progress isn't always linear. {user} is doing great! 💙",
      "{user}'s journey is unique and valuable. Keep supporting them! 🤗",
      "Small steps lead to big changes. {user} is on the right path! ⭐"
    ],
    'check-in': [
      "How's {user} feeling about their fitness journey lately? 💭",
      "Maybe check in with {user} about their running goals this week? 🤔",
      "Good time to see how {user} is doing with their fitness routine! 💪",
      "{user} might appreciate knowing you're thinking about their health goals! ❤️",
      "Consider reaching out to {user} about their wellness journey! 🌟",
      "Might be nice to ask {user} how their training is going! 🏃‍♂️",
      "Perfect time to show {user} you care about their fitness goals! 💙"
    ]
  },
  snarky: {
    'missed-goal': [
      "Your running buddy {user} is making excuses again. Time for some tough love!",
      "Alert: {user} chose Netflix over running. Again. 🛋️",
      "Hey, {user} is being a couch potato. Send help (or shame). 😏",
      "{user} needs a reality check on their 'active lifestyle' claims. 🙄",
      "Plot twist: The couch isn't actually a training device! {user} needs to hear this. 📺",
      "Breaking news: {user} found another excuse to skip their run. Shocking! 📰",
      "{user}'s running shoes called. They're feeling neglected. 👟",
      "Your friend {user} is winning at everything except... running. Maybe mention that? 🏆",
      "Status update: {user} is really good at planning runs they don't do. 📅",
      "{user} has mastered the art of workout procrastination. Time for intervention! ⏰"
    ],
    'weekly-summary': [
      "{user} completed {runsCompleted}/{runGoal} runs. Math is hard, right? 🤔",
      "Weekly report: {user} did {runsCompleted} runs. The goal was {runGoal}. Close enough? 😏",
      "Congrats to {user} on {runsCompleted} runs! Only {remainingRuns} short of their goal. No pressure! 😏",
      "{user} managed {runsCompleted} out of {runGoal} runs. I've seen snails move more consistently. 🐌",
      "This week {user} ran {runsCompleted} times. Their ambitious goal? {runGoal}. Dream big! ✨",
      "{user}'s weekly score: {runsCompleted}/{runGoal}. Participation trophy incoming! 🏅",
      "Update on {user}: {runsCompleted} runs completed. Someone's really taking their time with those goals! 🕐",
      "{user} got {runsCompleted} runs done this week. The bar wasn't even that high! 📊"
    ],
    'congratulatory': [
      "Hold the phone! {user} actually did it - {runsCompleted} runs this week! 📱",
      "Miracle alert: {user} completed all {runsCompleted} runs! Mark your calendars! 📅",
      "Breaking: {user} proved they can actually stick to a plan for once! {runsCompleted} runs! 🗞️",
      "Plot twist: {user} exceeded expectations and hit {runsCompleted} runs! Character development! 📚",
      "Shocking turn of events - {user} followed through on {runsCompleted} runs! 😱",
      "Well, well, well... {user} actually completed {runsCompleted} runs. Color me impressed! 🎨",
      "Achievement unlocked: {user} did {runsCompleted} runs without making excuses! 🔓"
    ],
    'motivational': [
      "Time for {user} to prove they're not all talk. You know what to do! 💪",
      "Apparently {user} needs someone to remind them how awesome they are. Your turn! ⭐",
      "{user} is capable of amazing things. Even if they don't always show it! 🚀",
      "Hey, someone needs to tell {user} that potential doesn't count if it's unused! 🔋",
      "Your friend {user} is better than their excuses. Make sure they know! 🎯",
      "{user} just needs a reminder that they're not a quitter. Hint hint! 👀",
      "Time to remind {user} that they're stronger than their Netflix addiction! 📺"
    ],
    'check-in': [
      "Might be time to ask {user} how those 'fitness goals' are going... 🤨",
      "Perfect opportunity to check if {user} is still pretending to be a runner! 🏃‍♂️",
      "Good time to see if {user} remembers they have running shoes! 👟",
      "Maybe ask {user} if they've seen their gym membership lately? 💳",
      "Consider checking in on {user}'s relationship with their couch. It might be too serious! 🛋️",
      "Time to see if {user} still claims to be 'getting back into running'! 📈",
      "Perfect moment to ask {user} about their workout schedule. What workout schedule? 📝"
    ]
  },
  chaotic: {
    'missed-goal': [
      "🚨 EMERGENCY ALERT 🚨 {user}'s running shoes are staging a protest! They demand justice! 👟✊",
      "ATTENTION HUMAN! {user}'s legs have filed a complaint about underutilization! Respond IMMEDIATELY! 🦿",
      "🦄 PLOT TWIST! The running gods are watching {user} and they're... confused? VERY CONFUSED! 🌈",
      "BREAKING: Local couch reports suspicious {user}-shaped indentation! Investigation needed! 🕵️",
      "🌪️ CHAOS ALERT! {user}'s fitness tracker is crying! LITERALLY CRYING! 😭",
      "RED ALERT! {user} has activated ultimate couch mode! All hands on deck! 🚢",
      "🎪 STEP RIGHT UP! Witness the amazing disappearing runner {user}! Where did they go?! 🎭",
      "NEWSFLASH: Scientists baffled by {user}'s ability to avoid exercise! More at 11! 📺",
      "🚨 CODE RED! {user}'s running motivation has left the building! Elvis-level departure! 🕺",
      "URGENT: {user}'s workout clothes are filing for abandonment! Legal action pending! ⚖️"
    ],
    'weekly-summary': [
      "🎭 WEEKLY CHAOS REPORT! {user} completed {runsCompleted}/{runGoal} runs! WHAT EVEN IS REALITY?! 🎪",
      "🌪️ BREAKING: Local runner {user} did {runsCompleted} runs! Scientists baffled! More at 11! 📺",
      "🎪 STEP RIGHT UP! See the amazing {user} who ran {runsCompleted} times! Was the goal {runGoal}? WHO KNOWS! 🎪",
      "🚀 SPACE UPDATE: {user} completed {runsCompleted} runs this week! Houston, we have... confusion! 👨‍🚀",
      "⚡ LIGHTNING ROUND! {user}: {runsCompleted} runs! Target: {runGoal}! Math: IRRELEVANT! 🧮",
      "🎯 BULLSEYE... ISH! {user} hit {runsCompleted}/{runGoal}! Close enough for horseshoes! 🐴",
      "🎪 CIRCUS REPORT: {user} performed {runsCompleted} running acts! Crowd wanted {runGoal}! 🤹‍♀️",
      "🌊 TSUNAMI OF UPDATES! {user} ran {runsCompleted} times! The ocean called, they're proud! 🌊"
    ],
    'congratulatory': [
      "🎉 HOLY GUACAMOLE! {user} actually did {runsCompleted} runs! THE UNIVERSE IS ALIGNED! 🌌",
      "🚨 MIRACLE ALERT! {user} completed ALL {runsCompleted} runs! Pigs are flying! Check the sky! 🐷✈️",
      "🏆 CHAMPIONSHIP LEVEL CHAOS! {user} conquered {runsCompleted} runs! Victory dance required! 💃",
      "🎪 LADIES AND GENTLEMEN! Presenting the INCREDIBLE {user} with {runsCompleted} runs! 🎭",
      "🌟 SUPERNOVA ACHIEVEMENT! {user} blazed through {runsCompleted} runs! Stars are jealous! ⭐",
      "🎊 CONFETTI EXPLOSION! {user} dominated with {runsCompleted} runs! Cleanup aisle everywhere! 🧹",
      "🚀 ROCKET SHIP SUCCESS! {user} launched {runsCompleted} runs into orbit! NASA is calling! 📞",
      "🎵 SYMPHONY OF VICTORY! {user} orchestrated {runsCompleted} perfect runs! Beethoven is weeping! 🎼"
    ],
    'motivational': [
      "🔥 FIRE UP THE ENGINES! {user} needs MAXIMUM POWER! You're the fuel! ⛽",
      "🌪️ TORNADO OF ENCOURAGEMENT NEEDED! {user} requires CATEGORY 5 support! 💨",
      "⚡ LIGHTNING BOLT MOTIVATION! Strike {user} with ELECTRIC ENERGY! ZAP! ⚡",
      "🚀 ROCKET FUEL REQUIRED! {user} needs BLAST OFF energy! COUNTDOWN INITIATED! 3...2...1! 🚀",
      "🎪 CIRCUS LEVEL HYPE NEEDED! {user} deserves STANDING OVATION energy! 👏",
      "🌊 TSUNAMI OF SUPPORT! Flood {user} with OCEANIC encouragement! 🌊",
      "🎯 BULLSEYE MOTIVATION! Target {user} with PRECISION encouragement! Direct hit! 🎯"
    ],
    'check-in': [
      "🔍 INVESTIGATION TIME! What's the status on Operation {user} Fitness?! 🕵️",
      "📡 SATELLITE UPDATE NEEDED! How's {user} doing in the fitness universe?! 🛰️",
      "🎪 CIRCUS CHECK-IN! Is {user} still performing in the fitness ring?! 🎪",
      "🚨 STATUS REPORT REQUIRED! Agent {user}'s fitness mission - success or chaos?! 📋",
      "🌪️ WEATHER UPDATE! What's the forecast for {user}'s workout storm?! ⛈️",
      "🎮 GAME STATUS! How's player {user} doing in Fitness Quest 3000?! 🕹️",
      "📺 NEWS FLASH NEEDED! This is your correspondent asking about {user}! 📰"
    ]
  },
  competitive: {
    'missed-goal': [
      "{user} skipped their run today. Think they can handle a challenge to get back on track?",
      "Your running partner {user} is falling behind. Time to throw down the gauntlet! 🥊",
      "{user} missed today's workout. Challenge them to prove they're not giving up! 💪",
      "Opportunity alert: {user} skipped their run. Perfect time to motivate with some competition! 🏆",
      "{user} is letting their goals slip. Think they're tough enough to bounce back? 🥅",
      "Your training buddy {user} bailed on today's run. Challenge their dedication! ⚡",
      "{user} chose comfort over commitment today. Time to question their champion mindset! 🏅",
      "Alert: {user} missed their run. Do they still have what it takes to reach their goals? 🎯",
      "{user} skipped today's session. Perfect opportunity to challenge their resolve! 💯",
      "Your competitor {user} is showing weakness. Time to push them back to excellence! 🚀"
    ],
    'weekly-summary': [
      "{user} completed {runsCompleted}/{runGoal} runs this week. Can they level up next week? 📈",
      "Weekly stats: {user} hit {runsCompleted} runs (goal: {runGoal}). Ready to raise the bar? 📊",
      "{user} managed {runsCompleted} out of {runGoal} runs. Time to challenge them for more! ⬆️",
      "Performance update: {user} did {runsCompleted} runs. Think they can beat that next week? 🏃‍♂️",
      "Scoreboard: {user} - {runsCompleted} runs. Can they dominate next week's challenge? 🏆",
      "This week's results: {user} completed {runsCompleted}/{runGoal}. Game on for next week! 🎮",
      "{user} finished with {runsCompleted} runs this week. Challenge them to go bigger! 💪",
      "Weekly performance: {user} logged {runsCompleted} runs. Time to up the ante? 🎯"
    ],
    'congratulatory': [
      "CHAMPION ALERT! {user} crushed it with {runsCompleted} runs! Pure domination! 🏆",
      "Victory achieved! {user} conquered their {runsCompleted} run goal like a true warrior! ⚔️",
      "{user} just proved they're unstoppable with {runsCompleted} runs! Elite performance! 💎",
      "WINNER! {user} demolished their weekly target with {runsCompleted} runs! 🥇",
      "Perfection! {user} executed {runsCompleted} flawless runs! Championship level! 👑",
      "Total dominance! {user} completed all {runsCompleted} runs like a true competitor! 💪",
      "VICTORY LAP! {user} achieved excellence with {runsCompleted} runs! Hall of fame material! 🏛️",
      "Peak performance! {user} delivered {runsCompleted} runs with champion precision! ⚡"
    ],
    'motivational': [
      "Time to remind {user} that champions are made in moments like these! 🏆",
      "{user} has warrior potential. Challenge them to unleash it! ⚔️",
      "Every champion faces setbacks. {user} needs to hear they can overcome this! 💪",
      "Push {user} to remember why they started - greatness doesn't come easy! 🚀",
      "Challenge {user} to prove their dedication is stronger than their excuses! 🎯",
      "Winners find a way. Remind {user} they have what it takes! 🥇",
      "Time to ignite {user}'s competitive fire - they're better than this! 🔥"
    ],
    'check-in': [
      "How's {user} performing in their fitness competition with themselves? 🏆",
      "Time to check if {user} is still playing to win or just playing around! 🎮",
      "Good moment to see if {user} is staying competitive with their goals! 💪",
      "Perfect time to gauge {user}'s championship commitment level! 👑",
      "How's {user} measuring up to their own fitness standards? 📊",
      "Time to see if {user} is maintaining their competitive edge! ⚡",
      "Check-in time: Is {user} still fighting for their fitness goals? 🥊"
    ]
  },
  achievement: {
    'missed-goal': [
      "{user} missed their run today and is 1 day behind their weekly goal. Help them get back on track?",
      "Progress update: {user} is off target by 1 run this week. They need support to reach their milestone! 📊",
      "{user} skipped today's run, putting their weekly achievement at risk. Time to help them refocus! 🎯",
      "Milestone alert: {user} is {remainingRuns} runs behind schedule. Encouragement needed! 📈",
      "{user}'s weekly goal is in jeopardy after missing today's run. Help them get back to their plan! 📋",
      "Achievement tracker: {user} is falling short of their weekly target. Support their comeback! 🔄",
      "Goal status: {user} missed a crucial run today. They need motivation to stay on track! ✅",
      "Progress report: {user} is behind schedule and needs help reaching this week's milestone! 📊",
      "Target missed: {user} skipped today's run. Help them realign with their achievement goals! 🎯",
      "{user} is off pace for their weekly objective. Perfect time to offer milestone support! 📈"
    ],
    'weekly-summary': [
      "Weekly progress: {user} completed {runsCompleted}/{runGoal} runs. They're {progressPercent}% to their goal! 📊",
      "Achievement report: {user} hit {runsCompleted} runs this week (target: {runGoal}). Great progress tracking! 📈",
      "Milestone update: {user} accomplished {runsCompleted} out of {runGoal} planned runs. Steady progress! ⭐",
      "Progress tracking: {user} completed {runsCompleted} runs, {remainingRuns} away from their weekly goal! 📋",
      "Goal status: {user} achieved {runsCompleted}/{runGoal} runs. Every completed run is a victory! 🎯",
      "Weekly metrics: {user} logged {runsCompleted} runs toward their {runGoal} target. Consistent effort! 📊",
      "Achievement summary: {user} finished {runsCompleted} runs this week. Building toward bigger goals! 🏗️",
      "Progress milestone: {user} completed {runsCompleted} runs. Each one brings them closer to success! 🚀"
    ],
    'congratulatory': [
      "MILESTONE ACHIEVED! {user} completed all {runsCompleted} runs! Perfect week execution! 🎯",
      "Goal conquered! {user} hit 100% of their target with {runsCompleted} runs! 📊",
      "Achievement unlocked! {user} successfully completed {runsCompleted} runs! 🏆",
      "Perfect execution! {user} achieved their weekly milestone of {runsCompleted} runs! ⭐",
      "Target reached! {user} completed {runsCompleted} runs with precision! Goal mastery! 🎯",
      "Milestone celebration! {user} accomplished their full {runsCompleted} run objective! 📈",
      "100% SUCCESS! {user} delivered on all {runsCompleted} planned runs! Excellence achieved! 💯",
      "Achievement confirmed! {user} reached their weekly goal of {runsCompleted} runs! 🏅"
    ],
    'motivational': [
      "Remind {user} that every step forward is progress toward their bigger goals! 📈",
      "{user} has already achieved so much. Help them see the finish line! 🏁",
      "Progress happens one run at a time. {user} just needs to focus on the next step! 👣",
      "Every goal reached starts with a single step. {user} can do this! 🎯",
      "Milestones are built from small wins. Encourage {user} to claim their next victory! 🏆",
      "{user}'s journey is about progress, not perfection. Support their next achievement! 📊",
      "Great achievements start with daily commitments. {user} has what it takes! ⭐"
    ],
    'check-in': [
      "How's {user} progressing toward their weekly running milestone? 📊",
      "Good time to check on {user}'s goal tracking and achievement progress! 📈",
      "Perfect moment to see how {user} is measuring up to their fitness objectives! 🎯",
      "Time to review {user}'s weekly progress and celebrate their achievements! 🏆",
      "How are {user}'s fitness milestones coming along this week? ⭐",
      "Check-in time: Is {user} on track for their weekly achievement goals? 📋",
      "Good opportunity to see where {user} stands with their running targets! 🚀"
    ]
  }
};

class MessageDeduplicator {
  private static sentMessages: Map<string, Set<string>> = new Map();

  public static canSendMessage(contactId: string, messageHash: string, timeWindowDays: number = 14): boolean {
    const key = `${contactId}_${timeWindowDays}d`;
    
    if (!this.sentMessages.has(key)) {
      this.sentMessages.set(key, new Set());
    }
    
    const contactHistory = this.sentMessages.get(key)!;
    
    if (contactHistory.has(messageHash)) {
      return false;
    }
    
    contactHistory.add(messageHash);
    return true;
  }

  public static hashMessage(message: string): string {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  public static getUniqueMessage(
    contactId: string, 
    style: MessageStyle, 
    type: MessageType, 
    maxAttempts: number = 10
  ): string {
    const templates = MESSAGE_TEMPLATES[style][type];
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const messageHash = this.hashMessage(template);
      
      if (this.canSendMessage(contactId, messageHash)) {
        return template;
      }
      attempts++;
    }
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

function formatGoalType(goalType: GoalType): string {
  switch (goalType) {
    case 'runs':
      return 'running';
    case 'miles':
      return 'mile';
    case 'activities':
      return 'activity';
    case 'bike_activities':
      return 'biking';
    case 'bike_miles':
      return 'bike mile';
    default:
      return goalType;
  }
}

function formatMessage(
  template: string, 
  userData: {
    user: string;
    completed?: number;
    goal?: number;
    remaining?: number;
    progressPercent?: number;
    goalType?: GoalType;
  }
): string {
  let message = template.replace('{user}', userData.user);
  
  if (userData.completed !== undefined) {
    message = message.replace('{completed}', userData.completed.toString());
  }
  
  if (userData.goal !== undefined) {
    message = message.replace('{goal}', userData.goal.toString());
  }
  
  if (userData.remaining !== undefined) {
    message = message.replace('{remaining}', userData.remaining.toString());
  }
  
  if (userData.progressPercent !== undefined) {
    message = message.replace('{progressPercent}', userData.progressPercent.toString());
  }
  
  if (userData.goalType) {
    const formattedGoalType = formatGoalType(userData.goalType);
    message = message.replace(/{goalType}/g, formattedGoalType);
  }
  
  return message;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users who need accountability messages
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        goal_per_week,
        goal_type,
        message_style,
        contacts (
          id,
          name,
          phone_number
        )
      `)
      .eq('send_day', new Date().toLocaleDateString('en-US', { weekday: 'long' }))
      .eq('send_time', new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));

    if (usersError) throw usersError;

    const messagePromises = users.flatMap(async (user) => {
      // Get this week's activity data based on goal type
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);

      let completed = 0;
      const goalType = user.goal_type as GoalType || 'runs';
      
      if (goalType === 'runs') {
        const { data: runs } = await supabase
          .from('run_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', monday.toISOString());
        completed = runs?.length || 0;
      } else if (goalType === 'miles') {
        const { data: runs } = await supabase
          .from('run_logs')
          .select('distance_miles')
          .eq('user_id', user.id)
          .gte('date', monday.toISOString());
        completed = runs?.reduce((sum, run) => sum + (run.distance_miles || 0), 0) || 0;
      } else if (goalType === 'activities') {
        const { data: activities } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', monday.toISOString());
        completed = activities?.length || 0;
      } else if (goalType === 'bike_activities') {
        const { data: bikeActivities } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('activity_type', 'bike')
          .gte('date', monday.toISOString());
        completed = bikeActivities?.length || 0;
      } else if (goalType === 'bike_miles') {
        const { data: bikeActivities } = await supabase
          .from('activity_logs')
          .select('distance_miles')
          .eq('user_id', user.id)
          .eq('activity_type', 'bike')
          .gte('date', monday.toISOString());
        completed = bikeActivities?.reduce((sum, activity) => sum + (activity.distance_miles || 0), 0) || 0;
      }

      const remaining = Math.max(0, user.goal_per_week - completed);
      const progressPercent = Math.round((completed / user.goal_per_week) * 100);
      
      // Only send messages if user didn't meet their goal
      if (completed >= user.goal_per_week) {
        return []; // Don't send messages when goals are met
      }
      
      // Determine message type based on progress
      const messageType: MessageType = completed === 0 ? 'missed-goal' : 'weekly-summary';

      // Send message to each contact
      return user.contacts.map(async (contact) => {
        // Get unique message to prevent duplicates
        const template = MessageDeduplicator.getUniqueMessage(
          contact.id, 
          user.message_style as MessageStyle, 
          messageType
        );
        
        const message = formatMessage(template, {
          user: user.name || 'your friend',
          completed,
          goal: user.goal_per_week,
          remaining,
          progressPercent,
          goalType
        });

        try {
          // Send message via Twilio
          await twilio.messages.create({
            body: message,
            to: contact.phone_number,
            from: TWILIO_PHONE_NUMBER,
          });

          // Log message in database
          await supabase.from('messages').insert({
            user_id: user.id,
            contact_id: contact.id,
            message_text: message,
            status: 'sent',
          });
        } catch (error) {
          console.error('Failed to send message:', error);

          // Log failed message
          await supabase.from('messages').insert({
            user_id: user.id,
            contact_id: contact.id,
            message_text: message,
            status: 'failed',
          });
        }
      });
    });

    await Promise.all(messagePromises.flat());

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}); 