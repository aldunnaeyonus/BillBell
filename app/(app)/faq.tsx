import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card } from "../../src/ui/styles";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";

export default function FAQ() {
  const theme = useTheme();
  const { t } = useTranslation();

  const faqSections = [
    {
      title: "Adding & Managing Debts",
      items: [
        {
          q: "How do I add a debt?",
          a: "Go to the Debts screen and tap the '+ Add' button. Enter the creditor, amount, and due date to save.",
        },
        {
          q: "How do I edit or update a debt?",
          a: "Tap any debt in the list to open the edit screen where you can update its details.",
        },
        {
          q: "How do I delete a debt?",
          a: "Select a debt, then tap the 'Delete' button to remove it permanently.",
        },
        {
          q: "What happens when I mark a debt as paid?",
          a: "It moves to the Paid section and future reminders for that debt stop automatically.",
        },
      ],
    },
    {
      title: "Notifications & Reminders",
      items: [
        {
          q: "When will I receive reminders?",
          a: "You will receive a reminder the day before a debt is due. Your family settings may adjust this reminder window.",
        },
        {
          q: "Why am I not receiving notifications?",
          a: "Ensure notifications are enabled for the app in your device settings. Also confirm you're logged in and part of a Family.",
        },
        {
          q: "Will reminders sync across all devices?",
          a: "Yes. All connected Family members receive reminders for shared debts.",
        },
      ],
    },
    {
      title: "Families & Sharing",
      items: [
        {
          q: "Can I share my account with someone else?",
          a: "Yes. Share your Family ID so other users can join your Family group and sync bills.",
        },
        {
          q: "How do I invite someone to my Family?",
          a: "Go to your Profile or Family screen to find your Family ID. Give this ID to someone you trust so they can join.",
        },
        {
          q: "Can multiple people manage the same debts?",
          a: "Absolutely. Anyone in your Family group can add, edit, pay, or delete shared debts.",
        },
        {
          q: "Can I leave a Family?",
          a: "Yes. You can leave from the Family Settings screen. If you're the only admin, you must assign a new admin first.",
        },
      ],
    },
    {
      title: "Importing & Bulk Upload",
      items: [
        {
          q: "How does the Import Code work?",
          a: "Family admins can generate a one-time import code. Use it in the Bulk Upload screen to securely import debts from a CSV file.",
        },
        {
          q: "What file type can I import?",
          a: "You can import CSV files containing the fields: name, amount, due_date, notes, autopay.",
        },
        {
          q: "Can I import multiple debts at once?",
          a: "Yes. Use the Bulk Upload feature to import many debts from a spreadsheet in one step.",
        },
        {
          q: "Why did my import fail?",
          a: "Check that your CSV uses valid formatting and that your Import Code has not expired or already been used.",
        },
      ],
    },
    {
      title: "Account, Login & Security",
      items: [
        {
          q: "How do I sign in?",
          a: "You can sign in using Apple Sign-In or Google Sign-In depending on your device.",
        },
        {
          q: "Is my data secure?",
          a: "Yes. Your data is protected with encrypted authentication tokens and stored securely on the server.",
        },
        {
          q: "Will my data sync across devices?",
          a: "Yes. As long as you sign in with the same Apple or Google account, your data syncs automatically.",
        },
      ],
    },
    {
      title: "App Settings & Customization",
      items: [
        {
          q: "Does the app support Dark Mode?",
          a: "Yes. The app automatically adapts to your device's appearance settings.",
        },
        {
          q: "Can I change my reminder settings?",
          a: "Family admins can update default reminder times in Family Settings.",
        },
        {
          q: "Can I change my Family ID?",
          a: "No. Family IDs are unique system-generated identifiers and cannot be changed.",
        },
      ],
    },
    {
      title: "Billing & Amounts",
      items: [
        {
          q: "How should I enter amounts?",
          a: "Enter the full amount without symbols. For example, '150.25' becomes $150.25.",
        },
        {
          q: "Can I track auto-pay bills?",
          a: "Yes. You can mark debts as auto-pay when creating or editing them.",
        },
      ],
    },
    {
      title: "Troubleshooting",
      items: [
        {
          q: "My bills aren't updating on another device. What should I do?",
          a: "Ensure both devices are logged into the same Family. Pull down on the Debts screen to refresh.",
        },
        {
          q: "I accidentally deleted a debt. Can I restore it?",
          a: "No. Deleted debts cannot be recovered, so delete carefully.",
        },
      ],
    },
  ];

  return (
    <View style={screen(theme)}>
      <Stack.Screen options={{ title: t("FAQ") }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[card(theme), { gap: 20 }]}>
          

          {faqSections.map((section, sIdx) => (
            <View key={sIdx} style={{ marginTop: sIdx === 0 ? 0 : 12 }}>
              {/* Section title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  marginBottom: 8,
                  color: theme.colors.text,
                }}
              >
                {t(section.title)}
              </Text>

              {section.items.map((item, index) => (
                <View key={index} style={{ gap: 4, marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: theme.colors.primary,
                    }}
                  >
                    {t(item.q)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.subtext,
                      lineHeight: 20,
                    }}
                  >
                    {t(item.a)}
                  </Text>

                  {index < section.items.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: theme.colors.border,
                        marginTop: 8,
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
