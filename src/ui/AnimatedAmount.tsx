import React, { useEffect } from 'react';
import { TextInput, TextInputProps, TextStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

// Animated TextInput to handle the text update efficiently
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedAmountProps {
  amount: number; // The value in cents
  style?: TextStyle;
  prefix?: string;
  duration?: number;
  delay?: number;
}

export function AnimatedAmount({
  amount,
  style,
  prefix = '$',
  duration = 800,
  delay = 0,
}: AnimatedAmountProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    // Animate to the new amount (in cents)
    animatedValue.value = withDelay(
      delay,
      withTiming(amount, {
        duration: duration,
        easing: Easing.out(Easing.exp), // "Premium" ease-out feel
      })
    );
  }, [amount, delay, duration]);

  const animatedProps = useAnimatedProps(() => {
    // Format: 1250 -> "12.50"
    const val = Math.round(animatedValue.value) / 100;
    // Add commas for thousands (simple regex)
    const formatted = val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    return {
      text: `${prefix}${formatted}`,
    } as TextInputProps;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={`${prefix}0.00`} // Initial fallback
      style={[styles.text, style]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    // Ensure font padding is removed for perfect alignment
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: '#000', 
  },
});