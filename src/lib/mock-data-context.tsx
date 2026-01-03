import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { User, Contact, Activity, AccountabilityMessage } from '../types/mock';

export interface MockDataStore {
  user: User | null;
  contacts: Contact[];
  activities: Activity[];
  messages: AccountabilityMessage[];
}

// Initial state
const initialState: MockDataStore = {
  user: null,
  contacts: [],
  activities: [],
  messages: [],
};

// Action types
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'REMOVE_CONTACT'; payload: string }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'SET_MESSAGES'; payload: AccountabilityMessage[] }
  | { type: 'ADD_MESSAGE'; payload: AccountabilityMessage };

// Context
const MockDataContext = createContext<{
  state: MockDataStore;
  setUser: (user: User | null) => void;
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  removeContact: (contactId: string) => void;
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  setMessages: (messages: AccountabilityMessage[]) => void;
  addMessage: (message: AccountabilityMessage) => void;
} | null>(null);

// Reducer
function reducer(state: MockDataStore, action: Action): MockDataStore {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'REMOVE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
      };
    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };
    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    default:
      return state;
  }
}

// Provider component
export function MockDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const setContacts = useCallback((contacts: Contact[]) => {
    dispatch({ type: 'SET_CONTACTS', payload: contacts });
  }, []);

  const addContact = useCallback((contact: Contact) => {
    dispatch({ type: 'ADD_CONTACT', payload: contact });
  }, []);

  const updateContact = useCallback((contact: Contact) => {
    dispatch({ type: 'UPDATE_CONTACT', payload: contact });
  }, []);

  const removeContact = useCallback((contactId: string) => {
    dispatch({ type: 'REMOVE_CONTACT', payload: contactId });
  }, []);

  const setActivities = useCallback((activities: Activity[]) => {
    dispatch({ type: 'SET_ACTIVITIES', payload: activities });
  }, []);

  const addActivity = useCallback((activity: Activity) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: activity });
  }, []);

  const setMessages = useCallback((messages: AccountabilityMessage[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);

  const addMessage = useCallback((message: AccountabilityMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  return (
    <MockDataContext.Provider
      value={{
        state,
        setUser,
        setContacts,
        addContact,
        updateContact,
        removeContact,
        setActivities,
        addActivity,
        setMessages,
        addMessage,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

// Hook for using the mock data context
export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
} 
