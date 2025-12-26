// src/hooks/useBadges.ts
import { useState, useCallback } from 'react';
import { userSettings } from '../storage/userSettings';
import { BADGES } from '../data/badges';
import { BadgeId, Bill } from '../types/domain';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import { useTranslation } from "react-i18next"; 

export function useBadges() {
  const { t } = useTranslation(); // <--- Moved to top level
  const [achievements, setAchievements] = useState(userSettings.getAchievements());

  const unlockBadge = useCallback((badgeId: BadgeId) => {
    // Hook call removed from here
    const current = userSettings.getAchievements();
    if (!current.unlockedBadges.includes(badgeId)) {
      const updated = {
        ...current,
        unlockedBadges: [...current.unlockedBadges, badgeId],
      };
      userSettings.saveAchievements(updated);
      setAchievements(updated);
      
      // Feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const badgeInfo = BADGES.find(b => b.id === badgeId);
      if (badgeInfo) {
        Alert.alert(
          t("Badge Unlocked! 🏆"), 
          t("You earned the {{name}} badge.", { name: t(badgeInfo.title) }) 
        );
      }
    }
  }, [t]); // <--- Added 't' to dependency array

  // Call this when a bill is added
  const checkAddBillBadges = (billsCount: number) => {
    if (billsCount >= 1) unlockBadge('rookie');
  };

  // Call this when a bill is marked paid
  const checkPaymentBadges = (bill: Bill) => {
    const newCount = userSettings.incrementPaidCount();

    // 1. Count checks
    if (newCount >= 10) unlockBadge('debt_destroyer');
    if (newCount >= 50) unlockBadge('pro_user');

    // 2. Early Bird check
    if (bill.due_date) {
      const due = parseISO(bill.due_date);
      const today = startOfDay(new Date());
      if (isBefore(today, due)) {
        unlockBadge('early_bird');
      }
    }
  };

  // Call this when loading the main screen
  const checkStatusBadges = (overdueBills: Bill[]) => {
    if (overdueBills.length === 0) unlockBadge('clean_slate');
  };
  
  // Call this when saving a budget
  const checkBudgetBadges = () => {
    unlockBadge('budget_boss');
  };

  return {
    achievements,
    unlockBadge,
    checkAddBillBadges,
    checkPaymentBadges,
    checkStatusBadges,
    checkBudgetBadges
  };
}