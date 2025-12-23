import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { useTheme, Theme } from "../../src/ui/useTheme";
import { useTranslation } from "react-i18next";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MAX_CONTENT_WIDTH } from "../../src/ui/styles";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

// --- Components ---

function Header({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
  return (
    <View style={styles.headerShadowContainer}>
      <LinearGradient
        colors={[theme.colors.navy, "#1a2c4e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerIconCircle}>
          <Ionicons name="help-buoy" size={28} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function SearchBar({
  value,
  onChange,
  theme,
  t,
}: {
  value: string;
  onChange: (text: string) => void;
  theme: Theme;
  t: any;
}) {
  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Ionicons name="search" size={20} color={theme.colors.subtext} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("Search questions...")}
        placeholderTextColor={theme.colors.subtext}
        style={[styles.searchInput, { color: theme.colors.text }]}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange("")}>
          <Ionicons name="close-circle" size={18} color={theme.colors.subtext} />
        </Pressable>
      )}
    </View>
  );
}

function AccordionItem({
  question,
  answer,
  theme,
}: {
  question: string;
  answer: string;
  theme: Theme;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.accordionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Pressable onPress={toggleExpand} style={styles.accordionHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.questionText, { color: theme.colors.primaryText }]}>
            {question}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={expanded ? theme.colors.accent : theme.colors.subtext}
        />
      </Pressable>
      {expanded && (
        <View style={styles.accordionBody}>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.answerText, { color: theme.colors.subtext }]}>
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
}

// --- Main Screen ---

export default function FAQ() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqItems = useMemo(() => {
    const rawFaqItems = t("faqSections", { returnObjects: true });
    
    // FIX: Ensure rawFaqItems is actually an array before filtering
    if (!Array.isArray(rawFaqItems)) return [];

    const sections = rawFaqItems as FaqSection[];

    if (!searchQuery.trim()) return sections;
    const lowerQuery = searchQuery.toLowerCase();

    return sections
      .map((section) => {
        const matchingItems = section.items.filter((item) => {
          const question = t(item.q).toLowerCase();
          const answer = t(item.a).toLowerCase();
          return question.includes(lowerQuery) || answer.includes(lowerQuery);
        });
        return { ...section, items: matchingItems };
      })
      .filter((section) => section.items.length > 0);
  }, [searchQuery, t]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          {/* Centered Content Wrapper */}
          <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
            <View style={styles.content}>
              
              <Header
                title={t("FAQ")}
                subtitle={t("Frequently Asked Questions")}
                theme={theme}
              />

              <SearchBar value={searchQuery} onChange={setSearchQuery} theme={theme} t={t} />

              {filteredFaqItems.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Ionicons name="search-outline" size={48} color={theme.colors.subtext} />
                  <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
                    {t("No results found for")} "{searchQuery}"
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 24 }}>
                  {filteredFaqItems.map((section, sIdx) => (
                    <View key={sIdx}>
                      <Text style={[styles.sectionHeader, { color: theme.colors.subtext }]}>
                        {t(section.title)}
                      </Text>
                      <View style={{ gap: 10 }}>
                        {section.items.map((item, index) => (
                          <AccordionItem
                            key={index}
                            question={t(item.q)}
                            answer={t(item.a)}
                            theme={theme}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20 },
  headerShadowContainer: { backgroundColor: 'transparent', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginVertical: 4, borderRadius: 20 },
  headerGradient: { borderRadius: 20, height:120, paddingBottom: 24, flexDirection: "row", alignItems: "center", gap: 16, overflow: "hidden" },
  headerIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", marginLeft:10 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  searchContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 50, borderRadius: 14, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, height: "100%" },
  sectionHeader: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
  accordionItem: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  accordionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, minHeight: 60 },
  questionText: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  accordionBody: { paddingHorizontal: 16, paddingBottom: 20 },
  divider: { height: 1, width: "100%", marginBottom: 16, opacity: 0.5 },
  answerText: { fontSize: 15, lineHeight: 24 },
  emptyState: { padding: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: 1, gap: 16, marginTop: 20 },
  emptyText: { fontSize: 16, textAlign: "center" },
});