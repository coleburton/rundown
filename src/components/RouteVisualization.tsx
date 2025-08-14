import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { VectorIcon } from './ui/IconComponent';

interface RouteVisualizationProps {
  latlng?: number[][];
  width?: number;
  height?: number;
}

export function RouteVisualization({ latlng, width = 300, height = 200 }: RouteVisualizationProps) {
  // Validate GPS data more thoroughly
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
        <VectorIcon emoji="📍" size={40} color="#9ca3af" style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280', textAlign: 'center' }}>
          No GPS data for this activity
        </Text>
        <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          This activity was recorded without GPS tracking
        </Text>
      </View>
    );
  }

  // Filter out invalid GPS points and validate data
  const validPoints = latlng.filter(point => {
    if (!Array.isArray(point) || point.length !== 2) return false;
    const [lat, lng] = point;
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' && 
      !isNaN(lat) && 
      !isNaN(lng) && 
      isFinite(lat) && 
      isFinite(lng) &&
      lat >= -90 && 
      lat <= 90 && 
      lng >= -180 && 
      lng <= 180
    );
  });

  // If no valid points after filtering, show fallback
  if (validPoints.length < 2) {
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
        <VectorIcon emoji="📍" size={40} color="#9ca3af" style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280', textAlign: 'center' }}>
          No GPS data for this activity
        </Text>
        <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          {validPoints.length === 1 
            ? 'Only one GPS point recorded'
            : 'This activity was recorded without GPS tracking'
          }
        </Text>
      </View>
    );
  }

  // Calculate bounds using valid points
  const lats = validPoints.map(point => point[0]);
  const lngs = validPoints.map(point => point[1]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Validate bounds are finite
  if (!isFinite(minLat) || !isFinite(maxLat) || !isFinite(minLng) || !isFinite(maxLng)) {
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
        <VectorIcon emoji="📍" size={40} color="#9ca3af" style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280', textAlign: 'center' }}>
          No GPS data for this activity
        </Text>
        <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          The GPS coordinates are corrupted or invalid
        </Text>
      </View>
    );
  }
  
  // Add padding
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  const padding = 0.1; // 10% padding
  
  // Handle case where lat/lng range is 0 (single point)
  const safeLatRange = latRange === 0 ? 0.001 : latRange;
  const safeLngRange = lngRange === 0 ? 0.001 : lngRange;
  
  const paddedMinLat = minLat - (safeLatRange * padding);
  const paddedMaxLat = maxLat + (safeLatRange * padding);
  const paddedMinLng = minLng - (safeLngRange * padding);
  const paddedMaxLng = maxLng + (safeLngRange * padding);
  
  const paddedLatRange = paddedMaxLat - paddedMinLat;
  const paddedLngRange = paddedMaxLng - paddedMinLng;

  // Convert lat/lng to SVG coordinates using valid points
  const svgPoints = validPoints.map(([lat, lng]) => {
    const x = ((lng - paddedMinLng) / paddedLngRange) * width;
    const y = ((paddedMaxLat - lat) / paddedLatRange) * height; // Flip Y axis
    // Ensure coordinates are finite
    return isFinite(x) && isFinite(y) ? `${x},${y}` : '';
  }).filter(point => point !== '').join(' ');

  // If no valid SVG points, show fallback
  if (!svgPoints) {
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
        <VectorIcon emoji="📍" size={40} color="#9ca3af" style={{ marginBottom: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: '500', color: '#6b7280', textAlign: 'center' }}>
          No GPS data for this activity
        </Text>
        <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          Unable to render GPS route
        </Text>
      </View>
    );
  }

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
          {validPoints.length > 0 && (() => {
            const startX = ((validPoints[0][1] - paddedMinLng) / paddedLngRange) * width;
            const startY = ((paddedMaxLat - validPoints[0][0]) / paddedLatRange) * height;
            return isFinite(startX) && isFinite(startY) ? (
              <Circle
                cx={startX}
                cy={startY}
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ) : null;
          })()}
          
          {/* End point */}
          {validPoints.length > 1 && (() => {
            const endX = ((validPoints[validPoints.length - 1][1] - paddedMinLng) / paddedLngRange) * width;
            const endY = ((paddedMaxLat - validPoints[validPoints.length - 1][0]) / paddedLatRange) * height;
            return isFinite(endX) && isFinite(endY) ? (
              <Circle
                cx={endX}
                cy={endY}
                r="6"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ) : null;
          })()}
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