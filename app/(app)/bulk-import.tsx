// app/src/screens/ImportBillsScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../src/api/client";
import { useTheme } from "../../src/ui/useTheme";

export default function BulkImport() {
  const theme = useTheme?.() ?? {
    colors: { background: "#fff", text: "#000", accent: "#007aff", subtext: "#666" },
  };

  const [importCode, setImportCode] = useState("");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function pickCsv() {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      // Added generic csv MIME type for better Android support
      type: ["text/csv", "text/plain", "application/vnd.ms-excel", "text/comma-separated-values"],
      copyToCacheDirectory: true,
    });

    if (res.canceled) return;

    const file = res.assets[0];
    setCsvName(file.name);

    // FIX: Read the string data from the URI provided by the picker
    const response = await fetch(file.uri);
    const content = await response.text();
    const parsed = parseCsvToBills(content);
    
    if (!parsed || !parsed.length) {
      Alert.alert("Import", "No valid rows found in CSV.");
      return;
    }

    setBills(parsed);
    Alert.alert("Import", `Parsed ${parsed.length} bill(s) from CSV.`);
  } catch (e: any) {
    console.error(e);
    Alert.alert("Import error", e.message ?? "Failed to read CSV");
  }
}

  function parseCsvToBills(csv: string): any[] {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (!lines.length) return [];

    // Expect header row: name,amount,due_date,notes,autopay
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

    function idx(key: string) {
      return header.indexOf(key);
    }

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

      if (!name || !amountStr || !dueDate) {
        continue;
      }

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
        due_date: dueDate, // must be YYYY-MM-DD to satisfy backend
        notes,
        autopay,
      });
    }

    return result;
  }

  async function doImport() {
    if (!importCode.trim()) {
      Alert.alert("Import", "Please enter an import code.");
      return;
    }
    if (!bills.length) {
      Alert.alert("Import", "Please pick a CSV and parse some bills first.");
      return;
    }

    try {
      setLoading(true);
      await api.importBills(importCode.trim().toUpperCase(), bills);
      Alert.alert("Import", "Bills imported successfully!");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Import failed", e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16 }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: theme.colors.text,
          marginBottom: 12,
        }}
      >
        Import Bills
      </Text>

      <Text style={{ color: theme.colors.subtext, marginBottom: 4 }}>
        Paste the import code you generated (or received), then pick a CSV file with your bills.
      </Text>

      <Text style={{ marginTop: 16, marginBottom: 4, color: theme.colors.text }}>
        Import code
      </Text>
      <TextInput
        value={importCode}
        onChangeText={setImportCode}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="e.g. ABCD1234"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          color: theme.colors.text,
        }}
      />

      <View style={{ height: 16 }} />

      <Pressable
        onPress={pickCsv}
        style={{
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: theme.colors.accent,
          alignSelf: "flex-start",
        }}
        disabled={loading}
      >
        <Text style={{ color: theme.colors.accent, fontWeight: "600" }}>
          {csvName ? "Pick another CSV" : "Pick CSV file"}
        </Text>
      </Pressable>

      {csvName && (
        <Text style={{ marginTop: 8, color: theme.colors.subtext }}>
          Selected: {csvName}
        </Text>
      )}

      {bills.length > 0 && (
        <Text style={{ marginTop: 8, color: theme.colors.subtext }}>
          Parsed {bills.length} bill(s)
        </Text>
      )}

      <View style={{ height: 24 }} />

      <Pressable
        onPress={doImport}
        disabled={loading || !importCode || !bills.length}
        style={{
          backgroundColor:
            loading || !importCode || !bills.length ? "#ccc" : theme.colors.accent,
          borderRadius: 999,
          paddingVertical: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {loading ? "Importing..." : "Import bills"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
