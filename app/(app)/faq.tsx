import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card } from "../../src/ui/styles";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { Key } from "react";

interface FaqItem {
  title: any | string | string[];
  items: any;
  question: string;
  answer: string;
}

export default function FAQ() {
  const theme = useTheme();
  const { t } = useTranslation();
  const faqItems = t("faqSections", { returnObjects: true }) as FaqItem[];

  return (
    <View style={screen(theme)}>
      <Stack.Screen options={{ title: t("FAQ") }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={[card(theme), { gap: 20 }]}>
          {faqItems.map((section, sIdx) => (
            <View key={sIdx} style={{ marginTop: sIdx === 0 ? 0 : 12 }}>
              {/* Section title */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  marginBottom: 8,
                  color: theme.colors.primaryText,
                }}
              >
                {t(section.title)}
              </Text>

              {section.items.map(
                (
                  item: {
                    q: any | string | string[];
                    a: any | string | string[];
                  },
                  index: Key | null | undefined
                ) => (
                  <View key={index} style={{ gap: 4, marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: theme.colors.primaryText,
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

                    {(index as number) < section.items.length - 1 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: theme.colors.border,
                          marginTop: 8,
                        }}
                      />
                    )}
                  </View>
                )
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
