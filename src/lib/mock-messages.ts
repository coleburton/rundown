import { AccountabilityMessage } from '../types/mock';
import { storage } from './storage';

// Message templates for different styles
const MESSAGE_TEMPLATES = {
  supportive: {
    'missed-goal': [
      "Hey! Just checking in - noticed you're a bit behind on your running goal this week. You've got this! 💪",
      "Remember why you started! There's still time to hit your running goal this week. You can do it! 🏃‍♂️",
      "Small steps lead to big achievements! Let's get back on track with those runs. 🌟",
    ],
    'weekly-summary': [
      "Great effort this week! You completed {runsCompleted} out of {runGoal} planned runs. Keep pushing! 🎉",
      "Weekly running update: {runsCompleted}/{runGoal} runs done! Every step counts! 🏃‍♂️",
      "Another week of progress! {runsCompleted} runs completed. Keep that momentum going! ⭐",
    ],
  },
  snarky: {
    'missed-goal': [
      "Your running shoes called. They're feeling neglected. 👟",
      "Plot twist: The couch isn't actually a training device! Time to get moving! 🛋️",
      "Breaking news: Running goals don't achieve themselves! What's the holdup? 📰",
    ],
    'weekly-summary': [
      "{runsCompleted}/{runGoal} runs? I've seen snails move more... but hey, at least you're trying! 🐌",
      "Weekly report: {runsCompleted} runs done. The goal was {runGoal}. Math is hard, right? 🤔",
      "Congrats on {runsCompleted} runs! Only {remainingRuns} short of your goal. No pressure! 😏",
    ],
  },
  chaotic: {
    'missed-goal': [
      "EMERGENCY ALERT: Your running shoes are staging a protest! 🚨 THEY DEMAND JUSTICE! 👟✊",
      "🦄 PLOT TWIST! The running gods are watching and they're... confused? VERY CONFUSED! 🌈",
      "ATTENTION HUMAN! Your legs have filed a complaint about underutilization! 🦿 RESPOND IMMEDIATELY!",
    ],
    'weekly-summary': [
      "🎭 WEEKLY CHAOS REPORT 🎪 Runs completed: {runsCompleted} 🎯 Goal: {runGoal} 🎪 WHAT EVEN IS REALITY?",
      "🌪️ BREAKING: Local runner completes {runsCompleted}/{runGoal} runs! Scientists baffled! More at 11! 📺",
      "🎪 STEP RIGHT UP! See the amazing runner who did {runsCompleted} runs! Was the goal {runGoal}? WHO KNOWS! 🎪",
    ],
  },
};

export class MockMessages {
  private static instance: MockMessages;
  private messages: AccountabilityMessage[] = [];

  private constructor() {
    // Initialize with historical messages
    this.initFromStorage();
  }

  private async initFromStorage() {
    const storedMessages = await storage.getMessages();
    if (storedMessages.length > 0) {
      this.messages = storedMessages;
    } else {
      await this.generateHistoricalMessages();
    }
  }

  static getInstance(): MockMessages {
    if (!MockMessages.instance) {
      MockMessages.instance = new MockMessages();
    }
    return MockMessages.instance;
  }

  private getRandomTemplate(style: 'supportive' | 'snarky' | 'chaotic', type: 'missed-goal' | 'weekly-summary'): string {
    const templates = MESSAGE_TEMPLATES[style][type];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private formatMessage(template: string, runsCompleted: number, runGoal: number): string {
    return template
      .replace('{runsCompleted}', runsCompleted.toString())
      .replace('{runGoal}', runGoal.toString())
      .replace('{remainingRuns}', (runGoal - runsCompleted).toString());
  }

  private async generateHistoricalMessages() {
    const userId = '1'; // Mock user ID
    const contactIds = ['1', '2']; // Mock contact IDs
    const today = new Date();
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(today.getDate() - 28);

    // Generate weekly summaries for the past 4 weeks
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(fourWeeksAgo);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      // Generate messages for each contact
      contactIds.forEach(contactId => {
        const runsCompleted = Math.floor(Math.random() * 4); // 0-3 runs
        const runGoal = 3; // Fixed goal for simplicity
        const messageStyle = contactId === '1' ? 'supportive' : 'snarky';
        const messageType = runsCompleted < runGoal ? 'missed-goal' : 'weekly-summary';

        const template = this.getRandomTemplate(messageStyle, messageType);
        const content = this.formatMessage(template, runsCompleted, runGoal);

        this.messages.push({
          id: `msg-${week}-${contactId}`,
          userId,
          contactId,
          sentAt: weekEnd.toISOString(),
          messageType,
          messageStyle,
          content,
          weekStartDate: weekStart.toISOString(),
          weekEndDate: weekEnd.toISOString(),
          runsCompleted,
          runGoal,
        });
      });
    }

    // Sort messages by date
    this.messages.sort((a, b) => 
      new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );

    // Save to storage
    await storage.setMessages(this.messages);
  }

  async getMessages(userId: string): Promise<AccountabilityMessage[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.messages.filter(message => message.userId === userId);
  }

  async addMessage(message: Omit<AccountabilityMessage, 'id'>): Promise<AccountabilityMessage> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newMessage: AccountabilityMessage = {
      ...message,
      id: `msg-${Date.now()}`,
    };

    this.messages.push(newMessage);
    await storage.setMessages(this.messages);
    return newMessage;
  }

  async getMessagesForWeek(userId: string, weekStart: Date): Promise<AccountabilityMessage[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.messages.filter(message => {
      const messageDate = new Date(message.sentAt);
      return (
        message.userId === userId &&
        messageDate >= weekStart &&
        messageDate < weekEnd
      );
    });
  }
} 