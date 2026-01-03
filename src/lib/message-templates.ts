export type MessageStyle = 'supportive' | 'snarky' | 'chaotic' | 'competitive' | 'achievement';
export type MessageType = 'missed-goal' | 'weekly-summary';
export type GoalType = 'runs' | 'miles' | 'activities' | 'bike_activities' | 'bike_miles';

type MessageBank = Record<MessageStyle, Record<MessageType, string[]>>;

export const MESSAGE_TEMPLATES: MessageBank = {
  supportive: {
    'missed-goal': [
      "Hey! Looks like {user} didn't quite hit their weekly {goalType} goal. Maybe send them some encouragement?",
      "Just checking in - {user} could use a little motivation to stay on track with their {goalType} goals.",
      "{user} is behind on their weekly {goalType} goal. A little support goes a long way!",
      "Your friend {user} fell short of their weekly {goalType} target. Sometimes we all need a gentle nudge!",
      "Heads up - {user} didn't reach their weekly {goalType} goal. Maybe check in and see how they're doing?",
      "Hey there! {user} could use some encouragement to get back on track with their {goalType} goals.",
      "{user} missed their weekly {goalType} target - perhaps they need to hear from a supportive friend like you!",
      "Friendly reminder: {user} didn't hit their {goalType} goal this week. Your encouragement means everything!",
      "Just a heads up that {user} is behind on their weekly {goalType} goal. A kind word could make all the difference!",
      "Your workout buddy {user} could use some positive vibes after not quite reaching their weekly {goalType} target."
    ],
    'weekly-summary': [
      "Weekly update: {user} completed {completed} out of {goal} {goalType}. They could use some encouragement.",
      "This week {user} did {completed}/{goal} {goalType}. Maybe reach out and offer some support?",
      "Progress report: {user} finished with {completed} {goalType} this week, aiming for {goal}. They'd appreciate hearing from you.",
      "{user} had {completed} {goalType} this week with a goal of {goal}. Consider sending them some motivation.",
      "Week recap: {user} got {completed} {goalType} in, targeting {goal}. A supportive message could help.",
      "Weekly check: {user} completed {completed} out of {goal} planned {goalType}. They could use encouragement.",
      "Update on {user}: {completed}/{goal} {goalType} completed. Perfect time to offer some support.",
      "This week's summary: {user} managed {completed} {goalType} toward their {goal} goal. They'd value your encouragement."
    ]
  },
  snarky: {
    'missed-goal': [
      "Your workout buddy {user} is making excuses again with their {goalType} goal. Time for some tough love!",
      "Alert: {user} chose Netflix over {goalType} this week. Again.",
      "Hey, {user} is being a couch potato with their {goalType} this week. Send help (or shame).",
      "{user} needs a reality check on their 'active lifestyle' claims about {goalType}.",
      "Plot twist: The couch isn't actually helping with {goalType} goals! {user} needs to hear this.",
      "Breaking news: {user} found more excuses than {goalType} this week. Shocking!",
      "{user}'s workout gear is calling. It's feeling neglected from all those missed {goalType}.",
      "Your friend {user} is winning at everything except... {goalType}. Maybe mention that?",
      "Status update: {user} is really good at planning {goalType} they don't actually do.",
      "{user} has mastered the art of {goalType} procrastination. Time for intervention!"
    ],
    'weekly-summary': [
      "Weekly report: {user} did {completed} {goalType} out of {goal}. Math is hard, right?",
      "This week's results: {user} completed {completed}/{goal} {goalType}. Close enough?",
      "Congrats to {user} on {completed} {goalType}! Only {remaining} short of their {goal} goal. No pressure!",
      "{user} managed {completed} out of {goal} {goalType}. I've seen snails move more consistently.",
      "This week {user} got {completed} {goalType}. Their ambitious goal? {goal}. Dream big!",
      "{user}'s weekly score: {completed}/{goal} {goalType}. Participation trophy incoming!",
      "Update on {user}: {completed} {goalType} completed. Someone's really taking their time with those goals!",
      "{user} achieved {completed} {goalType} this week. The bar wasn't even that high at {goal}!"
    ]
  },
  chaotic: {
    'missed-goal': [
      "ATTENTION HUMAN! {user}'s {goalType} have filed a complaint about underutilization this week!",
      "PLOT TWIST! The fitness gods are watching {user}'s {goalType} and they're... confused? VERY CONFUSED!",
      "BREAKING: Local couch reports suspicious {user}-shaped indentation! {goalType} investigation needed!",
      "CHAOS REPORT! {user}'s fitness tracker is having an existential crisis about those {goalType}!",
      "NEWSFLASH: {user} has activated ultimate couch mode this week! {goalType} emergency protocol initiated!",
      "STEP RIGHT UP! Witness the amazing disappearing {goalType} enthusiast {user}! Where did they go?!",
      "SCIENCE UPDATE: Researchers baffled by {user}'s ability to avoid {goalType} this week!",
      "DRAMATIC ANNOUNCEMENT! {user}'s {goalType} motivation has left the building!",
      "CHAOS THEORY: {user}'s workout gear is staging a peaceful protest about missed {goalType}!",
      "WEATHER REPORT: High chance of couch storms affecting {user}'s {goalType} area this week!"
    ],
    'weekly-summary': [
      "WEEKLY CHAOS REPORT! {user} completed {completed}/{goal} {goalType}! WHAT EVEN IS REALITY?!",
      "BREAKING NEWS: Local athlete {user} did {completed} {goalType}! Scientists are taking notes!",
      "STEP RIGHT UP! See the amazing {user} who got {completed} {goalType}! Goal was {goal}! MATH IS WILD!",
      "SPACE UPDATE: {user} completed {completed} {goalType} this week! Houston, we have... confusion!",
      "LIGHTNING ROUND RESULTS! {user}: {completed} {goalType}! Target: {goal}! Logic: OPTIONAL!",
      "BULLSEYE-ISH! {user} hit {completed}/{goal} {goalType}! Close enough for horseshoes!",
      "CIRCUS PERFORMANCE REVIEW: {user} performed {completed} {goalType} acts! Audience wanted {goal}!",
      "WAVES OF UPDATES! {user} achieved {completed} {goalType}! The ocean called, they're intrigued!"
    ]
  },
  competitive: {
    'missed-goal': [
      "{user} didn't hit their weekly {goalType} goal. Think they can handle a challenge to get back on track?",
      "Your training partner {user} is falling behind this week with {goalType}. Time to throw down the gauntlet!",
      "{user} missed their weekly {goalType} target. Challenge them to prove they're not giving up!",
      "Opportunity alert: {user} fell short with {goalType} this week. Perfect time to motivate with some competition!",
      "{user} is letting their {goalType} goals slip. Think they're tough enough to bounce back?",
      "Your workout buddy {user} didn't reach their weekly {goalType} target. Challenge their dedication!",
      "{user} chose comfort over commitment with {goalType} this week. Time to question their champion mindset!",
      "Alert: {user} missed their weekly {goalType} goal. Do they still have what it takes?",
      "{user} came up short with {goalType} this week. Perfect opportunity to challenge their resolve!",
      "Your competitor {user} is showing weakness with {goalType}. Time to push them back to excellence!"
    ],
    'weekly-summary': [
      "{user} completed {completed}/{goal} {goalType} this week. Can they level up next week?",
      "Weekly stats: {user} hit {completed} {goalType} (goal: {goal}). Ready to raise the bar?",
      "{user} managed {completed} out of {goal} {goalType}. Time to challenge them for more!",
      "Performance update: {user} did {completed} {goalType}. Think they can beat that next week?",
      "Scoreboard: {user} - {completed} {goalType}. Can they dominate next week's challenge?",
      "This week's results: {user} completed {completed}/{goal} {goalType}. Game on for next week!",
      "{user} finished with {completed} {goalType} this week. Challenge them to go bigger!",
      "Weekly performance: {user} logged {completed} {goalType}. Time to up the ante?"
    ]
  },
  achievement: {
    'missed-goal': [
      "{user} didn't reach their weekly {goalType} goal and is behind schedule. Help them get back on track?",
      "Progress update: {user} is off target with {goalType} this week. They need support to reach their milestone!",
      "{user} fell short of their weekly {goalType} achievement target. Time to help them refocus!",
      "Milestone alert: {user} is {remaining} {goalType} behind schedule. Encouragement needed!",
      "{user}'s weekly {goalType} goal is in jeopardy. Help them get back to their plan!",
      "Achievement tracker: {user} is falling short of their weekly {goalType} target. Support their comeback!",
      "Goal status: {user} missed their weekly {goalType} target. They need motivation to stay on track!",
      "Progress report: {user} is behind schedule with {goalType} and needs help reaching this week's milestone!",
      "Target missed: {user} didn't hit their weekly {goalType} goal. Help them realign with their objectives!",
      "{user} is off pace for their weekly {goalType} objective. Perfect time to offer milestone support!"
    ],
    'weekly-summary': [
      "Weekly progress: {user} completed {completed}/{goal} {goalType}. They're {progressPercent}% to their goal!",
      "Achievement report: {user} hit {completed} {goalType} this week (target: {goal}). Progress tracking shows they need support.",
      "Milestone update: {user} accomplished {completed} out of {goal} planned {goalType}. Steady progress toward their target.",
      "Progress tracking: {user} completed {completed} {goalType}, {remaining} away from their weekly goal!",
      "Goal status: {user} achieved {completed}/{goal} {goalType}. They could use encouragement to reach their target.",
      "Weekly metrics: {user} logged {completed} {goalType} toward their {goal} target. They need support to close the gap.",
      "Achievement summary: {user} finished {completed} {goalType} this week. Building toward their bigger goal of {goal}.",
      "Progress milestone: {user} completed {completed} {goalType}. Each one brings them closer to their {goal} target."
    ]
  }
};

export class MessageDeduplicator {
  private static sentMessages: Map<string, Set<string>> = new Map();

  public static canSendMessage(contactId: string, messageHash: string, timeWindowDays: number = 14): boolean {
    const key = `${contactId}_${timeWindowDays}d`;
    
    if (!this.sentMessages.has(key)) {
      this.sentMessages.set(key, new Set());
    }
    
    const contactHistory = this.sentMessages.get(key)!;
    
    if (contactHistory.has(messageHash)) {
      return false; // Duplicate found
    }
    
    contactHistory.add(messageHash);
    return true; // Safe to send
  }

  public static hashMessage(message: string): string {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
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
    
    // If we can't find a unique message, return a random one anyway
    return templates[Math.floor(Math.random() * templates.length)];
  }

  public static clearOldHistory(olderThanDays: number = 30): void {
    this.sentMessages.clear();
  }
}

/**
 * Helper function to format goal type for display
 */
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

/**
 * Helper function to get a formatted message with user data
 */
export function formatMessage(
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
