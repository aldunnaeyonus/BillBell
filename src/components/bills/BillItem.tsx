import React, { useMemo, useRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";
import Animated from "react-native-reanimated"; 
import * as Haptics from "expo-haptics";
import { parseISO } from "date-fns";
import { useTheme } from "../../ui/useTheme";
import { useCurrency } from "../../hooks/useCurrency";
import { formatCurrency } from "../../utils/currency";
import { getBillIcon, getSmartDueDate, isOverdue } from "../../utils/billLogic";
import { BillItemProps } from "../../types/domain";

const BillItemComponent = ({ item, t, locale, onLongPress, onEdit, onMarkPaid, onDelete }: BillItemProps) => {
  const theme = useTheme();
  const currency = useCurrency();
  const swipeableRef = useRef<SwipeableMethods>(null);

  const amt = formatCurrency(item.amount_cents, currency);
  const isPaid = Boolean(item.paid_at || item.is_paid || item.status === "paid");
  const overdue = isOverdue(item);

  const dateInfo = useMemo(() => {
    if (isPaid) {
      const d = item.paid_at || item.due_date;
      const formatted = d ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parseISO(d)) : "";
      return { label: `${t("Paid on")} ${formatted}`, color: undefined };
    }
    return getSmartDueDate(item.due_date, t, locale);
  }, [item.due_date, item.paid_at, isPaid, t, locale]);

  const iconData = getBillIcon(item.creditor);
  const IconComponent = iconData.type === "Ionicons" ? Ionicons : MaterialCommunityIcons;

  const renderRightActions = useCallback(() => {
    const ActionButton = ({ icon, color, label, onPress }: any) => (
      <RectButton
        style={[{ backgroundColor: color }, styles.swipeAction]}
        onPress={() => {
          Haptics.selectionAsync();
          swipeableRef.current?.close();
          onPress();
        }}
      >
        <Ionicons name={icon} size={24} color="#FFF" />
        <Text style={styles.actionText}>{label}</Text>
      </RectButton>
    );

    return (
      <View style={styles.rightActionsContainer}>
        <ActionButton icon="create-outline" color="#3498DB" label={t("Edit")} onPress={() => onEdit(item)} />
        {!isPaid && (
          <ActionButton icon="checkmark-done-circle-outline" color={theme.colors.success || "#2ECC71"} label={t("Paid")} onPress={() => onMarkPaid(item)} />
        )}
        <ActionButton icon="trash-outline" color="#E74C3C" label={t("Delete")} onPress={() => onDelete(item)} />
      </View>
    );
  }, [isPaid, onEdit, onMarkPaid, onDelete, t, item, theme.colors.success]);

  const BillContent = (
    <Pressable
      onPress={() => onEdit(item)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onLongPress(item);
      }}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.billCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: overdue ? theme.colors.danger : theme.colors.border,
          opacity: pressed ? 0.95 : 1, 
          borderWidth: 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* LEFT: Icon */}
        <View style={[styles.iconBox, { backgroundColor: iconData.color + "20" }]}>
          <IconComponent name={iconData.name as any} size={20} color={iconData.color} />
        </View>

        {/* CENTER: Details */}
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.billCreditor, { color: theme.colors.primaryText }]} numberOfLines={1}>
            {item.creditor}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
            <MaterialCommunityIcons
              name={item.payment_method === "auto" ? "refresh-auto" : "hand-pointing-right"}
              size={14}
              color={item.payment_method === "auto" ? theme.colors.navy : theme.colors.subtext}
            />
            <Text style={{ color: item.payment_method === "auto" ? theme.colors.navy : theme.colors.subtext, fontSize: 11, fontWeight: "600", marginLeft: 4, textTransform: "uppercase" }}>
              {item.payment_method === "auto" ? t("Auto-Draft") : t("Manual Pay")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Ionicons name={isPaid ? "checkmark-circle" : "calendar-outline"} size={14} color={dateInfo.color || (isPaid ? theme.colors.accent : theme.colors.subtext)} />
            <Text style={{ color: dateInfo.color || (isPaid ? theme.colors.accent : theme.colors.subtext), fontSize: 13, fontWeight: "500" }}>
              {dateInfo.label}
            </Text>
          </View>
        </View>

        {/* RIGHT: Wrapper for Amount + Dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          
          {/* Amount Column */}
          <View style={{ alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.billAmount, { color: theme.colors.primaryText }]}>{amt}</Text>
            {overdue && !isPaid && (
              <View style={{ backgroundColor: theme.colors.danger + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
                <Text style={{ color: theme.colors.danger, fontSize: 10, fontWeight: "800" }}>{t("OVERDUE")}</Text>
              </View>
            )}
          </View>

          {/* 3-DOT MENU BUTTON (Right Side) */}
          <Pressable
              onPress={(e) => {
                e.stopPropagation(); 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onLongPress(item); 
              }}
              hitSlop={12}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                padding: 4,
                // Optional: add a slight background to make the tap area obvious
                // backgroundColor: theme.colors.border + '30', 
                // borderRadius: 20
              })}
            >
              <Ionicons 
                name="ellipsis-vertical-outline" 
                size={26} 
                color={theme.colors.subtext} 
              />
          </Pressable>

        </View>
      </View>
    </Pressable>
  );

  if (Platform.OS === "ios") {
    return (
      <Animated.View>
        <ReanimatedSwipeable ref={swipeableRef} friction={2} rightThreshold={40} renderRightActions={renderRightActions} containerStyle={{ marginVertical: 0 }}>
          {BillContent}
        </ReanimatedSwipeable>
      </Animated.View>
    );
  }

  return <Animated.View>{BillContent}</Animated.View>;
};

function arePropsEqual(prev: BillItemProps, next: BillItemProps) {
  if (prev.locale !== next.locale || prev.t !== next.t) return false;
  
  const p = prev.item;
  const n = next.item;
  
  return (
    p.id === n.id &&
    p.amount_cents === n.amount_cents &&
    p.status === n.status &&
    p.paid_at === n.paid_at &&
    p.due_date === n.due_date &&
    p.creditor === n.creditor &&
    p.payment_method === n.payment_method
  );
}

const BillItem = React.memo(BillItemComponent, arePropsEqual);

const styles = StyleSheet.create({
  billCard: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  billCreditor: { fontSize: 16, fontWeight: "700" },
  billAmount: { fontSize: 18, fontWeight: "800" },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 10 },
  swipeAction: { justifyContent: "center", alignItems: "center", width: 80, height: "100%" },
  rightActionsContainer: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  actionText: { color: "#FFF", fontSize: 12, fontWeight: "600", marginTop: 4 },
});

export default BillItem;