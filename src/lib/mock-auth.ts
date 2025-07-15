import { User } from '../types/mock';
import { storage } from './storage';

// Simulated delay to mimic API calls
const MOCK_DELAY = 1000;

// Mock user for testing
const MOCK_USER: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test Runner',
  stravaConnected: false,
  stravaId: undefined,
  goal_per_week: 3, // Set a default goal
  message_style: 'friendly', // Set a default message style
};

export class MockAuth {
  private static instance: MockAuth;
  private _isAuthenticated: boolean = false;
  private _user: User | null = null;

  private constructor() {
    // Don't initialize in constructor - will be done via initialize() method
  }

  private async initFromStorage() {
    const user = await storage.getUser();
    this._user = user;
    this._isAuthenticated = !!user;
  }

  async initialize() {
    await this.initFromStorage();
  }

  static getInstance(): MockAuth {
    if (!MockAuth.instance) {
      MockAuth.instance = new MockAuth();
    }
    return MockAuth.instance;
  }

  async signIn(): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    this._isAuthenticated = true;
    this._user = MOCK_USER;
    await storage.setUser(MOCK_USER);
    return MOCK_USER;
  }

  async signOut(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    this._isAuthenticated = false;
    this._user = null;
    await storage.setUser(null);
    await storage.clearAll(); // Clear all data on sign out
  }

  async connectStrava(): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    if (!this._user) {
      throw new Error('User must be signed in to connect Strava');
    }

    const updatedUser = {
      ...this._user,
      stravaConnected: true,
      stravaId: '12345',
    };

    this._user = updatedUser;
    await storage.setUser(updatedUser);
    return updatedUser;
  }

  async disconnectStrava(): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    if (!this._user) {
      throw new Error('User must be signed in to disconnect Strava');
    }

    this._user = {
      ...this._user,
      stravaConnected: false,
      stravaId: undefined,
    };

    await storage.setUser(this._user);
    return this._user;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    if (!this._user) {
      throw new Error('User must be signed in to update profile');
    }

    this._user = {
      ...this._user,
      ...updates,
    };

    await storage.setUser(this._user);
    return this._user;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  get currentUser(): User | null {
    return this._user;
  }
} 