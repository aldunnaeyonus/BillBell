import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from './useTheme';

interface SkeletonProps {
  width?: DimensionValue;  // FIXED: Changed from 'number | string'
  height?: DimensionValue; // FIXED: Changed from 'number' to support percentages too
  borderRadius?: number;
  style?: ViewStyle;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  const translateX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1 // Infinite repeat
    );
  }, []);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const baseColor = theme.mode === 'dark' ? '#1E293B' : '#E2E8F0';
  const highlightColor = theme.mode === 'dark' ? '#334155' : '#F1F5F9';

  return (
    <View
      style={[
        styles.container,
        // The error happened here because we were passing a generic string to a specific style type
        { width, height, borderRadius, backgroundColor: baseColor, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, rStyle]}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Base container styles if needed
  },
});