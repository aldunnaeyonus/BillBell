import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Props extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleAmount?: number;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScaleButton({ 
  children, 
  style, 
  scaleAmount = 0.96, 
  haptic = true, 
  onPress,
  ...props 
}: Props) {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (haptic) Haptics.selectionAsync();
    scale.value = withSpring(scaleAmount, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[rStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}