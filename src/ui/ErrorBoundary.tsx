import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates"; // Allows restarting the app
import Share from "react-native-share";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      // Fallback if not using Expo Go/Updates
      this.setState({ hasError: false });
    }
  };

  handleReport = () => {
    const report = `Error: ${this.state.error?.toString()}\n\nStack: ${this.state.errorInfo?.componentStack}`;
    Share.open({
      title: "Report Crash",
      subject: "BillBell Crash Report",
      message: report,
    }).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning" size={64} color="#FF6B6B" />
            <Text style={styles.title}>Oops! Something went wrong.</Text>
            <Text style={styles.subtitle}>
              We have encountered an unexpected error. Your data is safe.
            </Text>

            <View style={styles.buttonContainer}>
              <Pressable onPress={this.handleRestart} style={[styles.button, styles.primaryBtn]}>
                <Text style={styles.primaryText}>Restart App</Text>
              </Pressable>

              <Pressable onPress={this.handleReport} style={[styles.button, styles.secondaryBtn]}>
                <Text style={styles.secondaryText}>Report Issue</Text>
              </Pressable>
            </View>

            {/* Optional: Show error details in DEV mode */}
            {__DEV__ && (
              <ScrollView style={styles.debugBox}>
                <Text style={styles.debugText}>{this.state.error?.toString()}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", justifyContent: "center", alignItems: "center", padding: 20 },
  content: { alignItems: "center", gap: 16, width: "100%", maxWidth: 400 },
  title: { fontSize: 24, fontWeight: "800", color: "#2D3436", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#636E72", textAlign: "center", marginBottom: 20 },
  buttonContainer: { flexDirection: "row", gap: 12, width: "100%" },
  button: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  primaryBtn: { backgroundColor: "#2D3436" },
  secondaryBtn: { backgroundColor: "#DFE6E9" },
  primaryText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  secondaryText: { color: "#2D3436", fontWeight: "700", fontSize: 16 },
  debugBox: { marginTop: 40, padding: 12, backgroundColor: "#EEE", borderRadius: 8, width: "100%", maxHeight: 200 },
  debugText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#E74C3C' }
});