// app/(app)/import.tsx  (or wherever your route screen lives)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "react-i18next";

import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";
import { screen, card, button, buttonText } from "../../src/ui/styles";

export default function BulkImport() {
  const theme = useTheme();
  const { t } = useTranslation();

  const [importCode, setImportCode] = useState("");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const deviceDate = new Date().toLocaleDateString();
  const deviceTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function pickCsv() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/plain",
          "application/vnd.ms-excel",
          "text/comma-separated-values",
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
      Alert.alert(t("Import"), t("ParsedCSV", { bills: parsed.length }));
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

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const idx = (key: string) => header.indexOf(key);

    const iName = idx("name");
    const iAmount = idx("amount");
    const iDueDate = idx("due_date");
    const iNotes = idx("notes");
    const iAutopay = idx("autopay");

    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const name = iName >= 0 ? cols[iName] : "";
      const amountStr = iAmount >= 0 ? cols[iAmount] : "";
      const dueDate = iDueDate >= 0 ? cols[iDueDate] : "";
      const notes = iNotes >= 0 ? cols[iNotes] : "";
      const autopayStr = iAutopay >= 0 ? cols[iAutopay] : "";

      if (!name || !amountStr || !dueDate) continue;

      const amount = parseFloat(amountStr);
      if (Number.isNaN(amount)) continue;

      const autopay =
        autopayStr.toLowerCase() === "1" ||
        autopayStr.toLowerCase() === "true" ||
        autopayStr.toLowerCase() === "yes"
          ? 1
          : 0;

      result.push({
        name,
        amount,
        due_date: dueDate,
        notes,
        autopay,
      });
    }

    return result;
  }

  async function doImport() {
    if (!importCode.trim()) {
      Alert.alert(t("Import"), t("Please enter an import code."));
      return;
    }
    if (!bills.length) {
      Alert.alert(
        t("Import"),
        t("Please pick a CSV and parse some bills first.")
      );
      return;
    }

    try {
      setLoading(true);
      await api.importBills(importCode.trim().toUpperCase(), bills);
      Alert.alert(t("Import"), t("Bills imported successfully!"));
      setImportCode("");
      setCsvName(null);
      setBills([]);
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("Import failed"), e?.message ?? t("Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[screen(theme), { gap: 12 }]}>
        <View style={card(theme)}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: theme.colors.primaryText,
            }}
          >
            {t("Import Bills")}
          </Text>

          <Text
            style={{
              color: theme.colors.subtext,
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            {t(
              "Paste the import code you generated (or received), then pick a CSV file with your bills."
            )}
            {"\n\n"}
            {t("CSV columns: name, amount, due_date, notes, autopay")}
            {"\n\n"}
            {`Example: Creditor.com, 29.00, ${deviceDate}, Monthly bill, yes`}
            {"\n"}
            {`Time example: ${deviceTime}`}
          </Text>

          <View style={{ height: 14 }} />

          <Text
            style={{
              marginBottom: 6,
              color: theme.colors.primaryText,
              fontWeight: "700",
            }}
          >
            {t("Import code (Generated in Profile)")}
          </Text>

          <TextInput
            value={importCode}
            onChangeText={setImportCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={t("e.g. ABCD1234")}
            placeholderTextColor={theme.colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: theme.colors.primaryText,
            }}
          />

          <View style={{ height: 14 }} />

          <Pressable
            onPress={pickCsv}
            disabled={loading}
            style={button(theme, "ghost")}
          >
            <Text style={buttonText(theme, "ghost")}>
              {csvName ? t("Pick another CSV") : t("Pick CSV file")}
            </Text>
          </Pressable>

          {csvName && (
            <Text style={{ marginTop: 8, color: theme.colors.subtext }}>
              {t("Selected:")} {csvName}
            </Text>
          )}

          {bills.length > 0 && (
            <Text style={{ marginTop: 6, color: theme.colors.subtext }}>
              {t("Parsed", { bills: bills.length })}
            </Text>
          )}

          <View style={{ height: 16 }} />

          <Pressable
            onPress={doImport}
            disabled={loading || !importCode.trim() || !bills.length}
            style={[
              button(theme, "primary"),
              (loading || !importCode.trim() || !bills.length) && {
                opacity: 0.6,
              },
            ]}
          >
            <Text style={buttonText(theme, "primary")}>
              {loading ? t("Importing...") : t("Import")}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
