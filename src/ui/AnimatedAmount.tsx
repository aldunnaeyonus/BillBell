import React, { useEffect, useState } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/currency';

interface AnimatedAmountProps extends TextProps {
  amount: number; // in CENTS
  currency?: string;
  style?: any;
}

export function AnimatedAmount({ amount, currency = 'USD', style, ...props }: AnimatedAmountProps) {
  // For a simple, reliable multi-currency formatter, we use standard State 
  // instead of Reanimated TextInput to ensure Intl formatting is perfect.
  const [displayValue, setDisplayValue] = useState(amount);

  useEffect(() => {
    // Simple spring effect logic could go here, 
    // but for text accuracy with currency symbols, direct update is cleaner for v1.
    setDisplayValue(amount);
  }, [amount]);

  return (
    <Text style={[styles.text, style]} {...props}>
      {formatCurrency(displayValue, currency)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'], // Prevents jitter when numbers change
  },
});