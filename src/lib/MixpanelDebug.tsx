import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type EventPayload = {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
};

// Global event queue that can be accessed from anywhere
let eventQueue: EventPayload[] = [];
let addEventCallback: ((event: EventPayload) => void) | null = null;

// Function to add events to the queue from anywhere in the app
export function addDebugEvent(eventName: string, properties: Record<string, any>) {
  const event = {
    eventName,
    properties,
    timestamp: Date.now(),
  };
  
  eventQueue.push(event);
  
  // Only keep the last 10 events
  if (eventQueue.length > 10) {
    eventQueue.shift();
  }
  
  // Notify the component if it's mounted
  if (addEventCallback) {
    addEventCallback(event);
  }
}

export default function MixpanelDebug() {
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventPayload | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Register callback to receive events
  useEffect(() => {
    // Initialize with existing events
    setEvents(eventQueue);
    
    addEventCallback = (event: EventPayload) => {
      // Use a ref callback to avoid issues with useInsertionEffect
      requestAnimationFrame(() => {
        setEvents(prev => {
          const newEvents = [...prev, event];
          if (newEvents.length > 10) {
            return newEvents.slice(-10);
          }
          return newEvents;
        });
        setCurrentEvent(event);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Fade out after 2 seconds
        timeoutRef.current = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setCurrentEvent(null);
          });
        }, 2000);
      });
    };
    
    return () => {
      addEventCallback = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fadeAnim]);
  
  if (!currentEvent || !__DEV__) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim, top: insets.top + 20 }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.eventName}>{currentEvent.eventName}</Text>
        <Text style={styles.timestamp}>
          {new Date(currentEvent.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <ScrollView style={styles.propertiesContainer}>
        {Object.entries(currentEvent.properties).map(([key, value]) => (
          <Text key={key} style={styles.property}>
            <Text style={styles.propertyKey}>{key}:</Text>{' '}
            <Text style={styles.propertyValue}>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </Text>
          </Text>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    color: '#ccc',
    fontSize: 12,
  },
  propertiesContainer: {
    maxHeight: 150,
  },
  property: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  propertyKey: {
    color: '#8be9fd',
    fontWeight: 'bold',
  },
  propertyValue: {
    color: '#f1fa8c',
  },
}); 