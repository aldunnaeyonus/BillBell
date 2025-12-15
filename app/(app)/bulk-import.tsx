import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import RNFS from "react-native-fs";
import Share from "react-native-share";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { useTheme, Theme } from "../../src/ui/useTheme";

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
          <Ionicons name="cloud-upload" size={28} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: Theme }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>
      {title}
    </Text>
  );
}

function FileDropZone({
  filename,
  onPress,
  theme,
  parsedCount,
}: {
  filename: string | null;
  onPress: () => void;
  theme: Theme;
  parsedCount: number;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dropZone,
        {
          borderColor: filename ? theme.colors.primary : theme.colors.border,
          backgroundColor: pressed ? theme.colors.card : "transparent",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons
        name={filename ? "document-text" : "add-circle-outline"}
        size={40}
        color={filename ? theme.colors.primary : theme.colors.subtext}
      />
      <View style={{ alignItems: "center", gap: 4 }}>
<Text
  style={[
    styles.dropZoneTitle,
    { color: filename ? theme.colors.primaryText : theme.colors.subtext },
  ]}
>
  {filename || t("Tap to select CSV/XLSX")}
</Text>
        {filename ? (
          <Text style={{ color: theme.colors.accent, fontWeight: "700" }}>
            {parsedCount} items found
          </Text>
        ) : (
          <Text style={{ color: theme.colors.subtext, fontSize: 12 }}>
            {t("Max size: 5MB")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// --- Main Screen ---

export default function BulkImport() {
  const theme = useTheme();
  const { t } = useTranslation();

  const [importCode, setImportCode] = useState("");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Logic ---

  async function pickCsv() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/plain",
          "application/vnd.ms-excel",
          "text/comma-separated-values",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      const file = res.assets[0];
      setCsvName(file.name);

      const response = await fetch(file.uri);
      const content = await response.text();
      const parsed = parseCsvToBills(content);

      if (!parsed || !parsed.length) {
        Alert.alert(t("Import"), t("No valid rows found in CSV."));
        return;
      }

      setBills(parsed);
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("Import error"), e?.message ?? t("Failed to read CSV"));
    }
  }

  function parseCsvToBills(csv: string): any[] {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (!lines.length) return [];

    const headerLine = lines[0];
    
    // NEW FIX: DYNAMICALLY DETECT SEPARATOR BY COUNTING FREQUENCY
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semicolonCount = (headerLine.match(/;/g) || []).length;
    const tabCount = (headerLine.match(/\t/g) || []).length;

    let separator = ',';
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
        separator = ';';
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
        separator = '\t';
    }
    // If commaCount is the highest or tied, separator remains ','.
    
    const header = headerLine.split(separator).map((h) => h.trim().toLowerCase());
    const idx = (key: string) => header.indexOf(key);

    const iName = idx("name");
    const iAmount = idx("amount");
    const iDueDate = idx("due_date");
    const iNotes = idx("notes");
    const iRecurrence = idx("recurrence");
    const iOffset = idx("offset");
    const ireminder = idx("reminder"); 

    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      // USE DYNAMIC SEPARATOR
      const cols = lines[i].split(separator).map((c) => c.trim()); 

      // Safely extract column data
      const name = iName >= 0 && cols.length > iName ? cols[iName] : "";
      const amountStr = iAmount >= 0 && cols.length > iAmount ? cols[iAmount] : "";
      const dueDate = iDueDate >= 0 && cols.length > iDueDate ? cols[iDueDate] : "";
      const notes = iNotes >= 0 && cols.length > iNotes ? cols[iNotes] : "";
      
      let recurrence = "none";
      if (iRecurrence >= 0 && cols.length > iRecurrence) {
        const val = cols[iRecurrence].toLowerCase();
        if (["weekly", "bi-weekly", "monthly", "annually"].includes(val)) {
          recurrence = val;
        }
      }

      let offset = 0;
      if (iOffset >= 0 && cols.length > iOffset) {
          const val = parseInt(cols[iOffset]);
          if (!isNaN(val) && val >= 0 && val <= 3) offset = val;
      }

      // Basic validation for required fields
      if (!name || !amountStr || !dueDate) continue;
      const amount = parseFloat(amountStr);
      if (Number.isNaN(amount) || amount <= 0) continue;

      result.push({
        name,
        amount,
        due_date: dueDate,
        notes,
        recurrence,
        offset, 
      });
    }

    return result;
  }

  async function downloadTemplate() {
    try {
      const headers = "name,amount,due_date,notes,recurrence,offset"; 
      const today = new Date().toISOString().split("T")[0];
      const sampleRow = `Netflix,15.99,${today},Family Plan,none,0`;
      const csvContent = `${headers}\n${sampleRow}`;

      const path =
        Platform.OS === "ios"
          ? `${RNFS.DocumentDirectoryPath}/bill_template.csv`
          : `${RNFS.CachesDirectoryPath}/bill_template.csv`;

      await RNFS.writeFile(path, csvContent, "utf8");

      await Share.open({
        url: `file://${path}`,
        type: "text/csv",
        filename: "bill_import_template",
        title: "Download Bill Template",
      });
    } catch (error: any) {
      if (error?.message !== "User did not share") {
        Alert.alert(t("Error"), t("Failed to download template"));
      }
    }
  }

  async function doImport() {
    if (!importCode.trim()) {
      Alert.alert(t("Import"), t("Please enter an import code."));
      return;
    }
    if (!bills.length) {
      Alert.alert(t("Import"), t("Please pick a CSV and parse some bills first."));
      return;
    }

    try {
      setLoading(true);
      await api.importBills(importCode.trim().toUpperCase(), bills);
      Alert.alert(t("Import"), t("Bills imported successfully!"));
      setImportCode("");
      setCsvName(null);
      setBills([]);
      router.back();
    } catch (e: any) {
      Alert.alert(t("Import failed"), e?.message ?? t("Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <View style={styles.content}>
        {/* Header */}
        <Header
          title={t("Bulk Upload")}
          subtitle={t("Import multiple bills via CSV")}
          theme={theme}
        />

        {/* Step 1 */}
        <View style={styles.section}>
          <SectionTitle title={t("Step 1: Preparation")} theme={theme} />
          <Pressable
            onPress={downloadTemplate}
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="download-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.colors.primaryText }]}>
                {t("Download Template")}
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.subtext }]}>
                {t("Get the CSV template to ensure correct formatting.")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
          </Pressable>
        </View>

        {/* Step 2 */}
        <View style={styles.section}>
          <SectionTitle title={t("Step 2: Select File")} theme={theme} />
          <FileDropZone
            filename={csvName}
            onPress={pickCsv}
            theme={theme}
            parsedCount={bills.length}
          />
        </View>

        {/* Step 3 */}
        <View style={styles.section}>
          <SectionTitle title={t("Step 3: Authorization")} theme={theme} />
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="key-outline" size={20} color={theme.colors.subtext} style={{ marginLeft: 12 }} />
            <TextInput
              value={importCode}
              onChangeText={setImportCode}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={t("Enter Import Code")}
              placeholderTextColor={theme.colors.subtext}
              style={[styles.input, { color: theme.colors.primaryText }]}
            />
          </View>
          <Text style={{ color: theme.colors.subtext, fontSize: 12, marginLeft: 4 }}>
            {t("Generate this in your Profile")}
          </Text>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={doImport}
          disabled={loading || !importCode.trim() || !bills.length}
          style={({ pressed }) => [
            styles.importButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: loading || !importCode.trim() || !bills.length ? 0.3 : pressed ? 0.8 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.primaryTextButton} />
          ) : (
            <Text style={[styles.importButtonText, { color: theme.colors.primaryTextButton }]}>
              {t("Start Import")}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  // Header
  headerShadowContainer: {
    backgroundColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginVertical: 4,
    borderRadius: 20, 
  },
  headerGradient: {
    borderRadius: 20,
    height:120,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  // Sections
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  // Card
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  // Drop Zone
  dropZone: {
    height: 140,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    height: 56,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  // Button
  importButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 12,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});