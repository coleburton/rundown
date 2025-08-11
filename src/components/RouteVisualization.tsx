import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

interface RouteVisualizationProps {
  latlng?: number[][];
  width?: number;
  height?: number;
}

export function RouteVisualization({ latlng, width = 300, height = 200 }: RouteVisualizationProps) {
  if (!latlng || !latlng.length) {
    return (
      <View style={{
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: height,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
      }}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🗺️</Text>
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280', textAlign: 'center' }}>
          Route visualization coming soon!
        </Text>
        <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          We'll show your GPS route here
        </Text>
      </View>
    );
  }

  // Calculate bounds
  const lats = latlng.map(point => point[0]);
  const lngs = latlng.map(point => point[1]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Add padding
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  const padding = 0.1; // 10% padding
  
  const paddedMinLat = minLat - (latRange * padding);
  const paddedMaxLat = maxLat + (latRange * padding);
  const paddedMinLng = minLng - (lngRange * padding);
  const paddedMaxLng = maxLng + (lngRange * padding);
  
  const paddedLatRange = paddedMaxLat - paddedMinLat;
  const paddedLngRange = paddedMaxLng - paddedMinLng;

  // Convert lat/lng to SVG coordinates
  const svgPoints = latlng.map(([lat, lng]) => {
    const x = ((lng - paddedMinLng) / paddedLngRange) * width;
    const y = ((paddedMaxLat - lat) / paddedLatRange) * height; // Flip Y axis
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{
      backgroundColor: '#f9fafb',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    }}>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 12 }}>
        Route Map
      </Text>
      
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Svg width={width} height={height}>
          <Polyline
            points={svgPoints}
            fill="none"
            stroke="#fc5200"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Start point */}
          {latlng.length > 0 && (
            <Circle
              cx={((latlng[0][1] - paddedMinLng) / paddedLngRange) * width}
              cy={((paddedMaxLat - latlng[0][0]) / paddedLatRange) * height}
              r="6"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
          
          {/* End point */}
          {latlng.length > 1 && (
            <Circle
              cx={((latlng[latlng.length - 1][1] - paddedMinLng) / paddedLngRange) * width}
              cy={((paddedMaxLat - latlng[latlng.length - 1][0]) / paddedLatRange) * height}
              r="6"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
        </Svg>
      </View>
      
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: 4, marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: '#6b7280' }}>Start</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4, marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: '#6b7280' }}>Finish</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 2, backgroundColor: '#fc5200', marginRight: 4 }} />
          <Text style={{ fontSize: 10, color: '#6b7280' }}>Route</Text>
        </View>
      </View>
    </View>
  );
}