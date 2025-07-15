import { Activity } from '../types/mock';
import { storage } from './storage';

// Constants for generating realistic running data
const AVG_PACE_MIN = 5.5; // minutes per km
const AVG_PACE_MAX = 7.0; // minutes per km
const DISTANCE_MIN = 3000; // 3km in meters
const DISTANCE_MAX = 10000; // 10km in meters

export class MockActivities {
  private static instance: MockActivities;
  private activities: Activity[] = [];

  private constructor() {
    // Initialize with historical data
    this.initFromStorage();
  }

  private async initFromStorage() {
    const storedActivities = await storage.getActivities();
    if (storedActivities.length > 0) {
      this.activities = storedActivities;
    } else {
      await this.generateHistoricalActivities();
    }
  }

  static getInstance(): MockActivities {
    if (!MockActivities.instance) {
      MockActivities.instance = new MockActivities();
    }
    return MockActivities.instance;
  }

  private generateRandomActivity(date: Date, userId: string): Activity {
    // Generate random distance between min and max
    const distance = Math.floor(
      Math.random() * (DISTANCE_MAX - DISTANCE_MIN) + DISTANCE_MIN
    );

    // Generate random pace between min and max
    const paceMinutes =
      Math.random() * (AVG_PACE_MAX - AVG_PACE_MIN) + AVG_PACE_MIN;

    // Calculate duration in seconds based on distance and pace
    const durationSeconds = Math.floor((distance / 1000) * paceMinutes * 60);

    return {
      id: `mock-activity-${date.getTime()}-${userId}`,
      type: Math.random() > 0.8 ? 'Trail Run' : 'Run',
      date: date.toISOString(),
      distance,
      duration: durationSeconds,
    };
  }

  private getRandomActivityName(): string {
    const prefixes = ['Morning', 'Afternoon', 'Evening', 'Lunch', 'Quick'];
    const suffixes = ['Run', 'Jog', 'Training', 'Exercise'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix}`;
  }

  private formatDistance(meters: number): string {
    const km = (meters / 1000).toFixed(1);
    return `${km}km`;
  }

  private async generateHistoricalActivities() {
    console.log('Generating historical activities...');
    const userId = '1'; // Mock user ID
    const today = new Date();
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(today.getDate() - 28);

    // Generate activities for the past 4 weeks
    for (let date = new Date(fourWeeksAgo); date <= today; date.setDate(date.getDate() + 1)) {
      // 50% chance of having an activity on any given day
      if (Math.random() > 0.5) {
        // Set activity time to morning (6-9am)
        const activityDate = new Date(date);
        activityDate.setHours(6 + Math.floor(Math.random() * 3), 
                             Math.floor(Math.random() * 60));
        
        this.activities.push(this.generateRandomActivity(activityDate, userId));
      }
    }

    // Ensure we have at least 3 activities this week
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    const thisWeekActivities = this.activities.filter(
      activity => new Date(activity.date) >= monday
    );

    // Add guaranteed activities for this week if we don't have enough
    if (thisWeekActivities.length < 2) {
      console.log('Adding guaranteed activities for this week...');
      for (let i = 0; i < 2; i++) {
        const activityDate = new Date(monday);
        activityDate.setDate(monday.getDate() + i * 2); // Spread across the week
        activityDate.setHours(7, 0, 0, 0);
        
        this.activities.push(this.generateRandomActivity(activityDate, userId));
      }
    }

    // Sort activities by date (most recent first)
    this.activities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log('Generated activities:', this.activities.length);

    // Save to storage
    await storage.setActivities(this.activities);
  }

  async getActivities(userId: string): Promise<Activity[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For mock data, we'll treat all activities as belonging to the current user
    // In a real app, you would filter by userId
    console.log('Returning activities:', this.activities.length);
    return this.activities;
  }

  async addActivity(userId: string): Promise<Activity> {
    // Generate a new activity for today
    const now = new Date();
    const newActivity = this.generateRandomActivity(now, userId);
    
    this.activities.unshift(newActivity); // Add to beginning to keep most recent first
    
    // Save to storage
    await storage.setActivities(this.activities);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return newActivity;
  }

  async getActivitiesForWeek(userId: string, weekStart: Date): Promise<Activity[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return (
        activityDate >= weekStart &&
        activityDate < weekEnd
      );
    });
  }

  // Method to regenerate mock activities (useful for testing)
  async regenerateActivities(): Promise<void> {
    this.activities = [];
    await storage.setActivities([]);
    await this.generateHistoricalActivities();
  }

  // Method to check if activities are loaded
  hasActivities(): boolean {
    return this.activities.length > 0;
  }

  // Method to add test activities for debugging
  addTestActivities(): void {
    const userId = '1';
    const today = new Date();
    
    // Add some test activities for today and yesterday
    for (let i = 0; i < 3; i++) {
      const activityDate = new Date(today);
      activityDate.setDate(today.getDate() - i);
      activityDate.setHours(7 + i, 0, 0, 0);
      
      this.activities.push(this.generateRandomActivity(activityDate, userId));
    }
    
    // Sort by date
    this.activities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    console.log('Added test activities. Total:', this.activities.length);
  }
} 