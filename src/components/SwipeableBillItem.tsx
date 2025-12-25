import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler'; // Standard export
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Use standard Animated for simplicity, or Reanimated if you prefer
// This uses standard Animated for maximum compatibility
interface BillItemProps {
  item: any; // Replace with your Bill type from domain.ts
  onPay: (id: string) => void;
}

export const SwipeableBillItem = ({ item, onPay }: BillItemProps) => {
  const swipeableRef = useRef<Swipeable>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- Animations on Mount ---
  useEffect(() => {
    const delay = 500; // Wait a bit after screen load

    if (Platform.OS === 'ios') {
      // iOS: Slide open slightly to hint action
      setTimeout(() => {
        swipeableRef.current?.openRight();
        setTimeout(() => {
          swipeableRef.current?.close();
        }, 800);
      }, delay);
    } else if (Platform.OS === 'android') {
      // Android: "Breathe" animation to hint interactability
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    }
  }, []);

  // --- Actions ---
  const handlePayPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPay(item.id);
    swipeableRef.current?.close();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Manage Bill", `Actions for ${item.merchant}`, [
        { text: "Mark as Paid", onPress: handlePayPress },
        { text: "Cancel", style: "cancel" }
    ]);
  };

  // --- Renderers ---
  const renderRightActions = (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={[styles.payButton, { transform: [{ translateX: trans }] }]}>
          <TouchableOpacity onPress={handlePayPress} style={styles.payButtonInner}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.payText}>Pay</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={handleLongPress} // Android Simulation
            style={styles.itemContainer}
        >
            {/* Replace this with your actual Bill Card UI */}
            <View style={styles.billContent}>
                <View>
                    <Text style={styles.merchant}>{item.merchant}</Text>
                    <Text style={styles.date}>{item.date}</Text>
                </View>
                <Text style={styles.amount}>${item.total}</Text>
            </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  billContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  merchant: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 12, color: '#666', marginTop: 4 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  
  // Swipe Actions
  rightActionContainer: {
    width: 100,
    marginBottom: 10,
    flexDirection: 'row',
  },
  payButton: {
    flex: 1,
    backgroundColor: '#34C759', // iOS Green
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
});