import { ColorValue, OpaqueColorValue } from "react-native";

export const palette = {
  navy: "#0B1F3B",
  mint: "#71E3C3",
  danger: "#B00020",

  lightBg: "#F7F9FC",
  darkBg: "#070B12",

  lightCard: "#FFFFFF",
  darkCard: "#0E1626",

  lightText: "#0B1F3B",
  darkText: "#F7F9FC",

  lightSubtext: "rgba(11,31,59,0.65)",
  darkSubtext: "rgba(247,249,252,0.70)",

  lightBorder: "rgba(11,31,59,0.10)",
  darkBorder: "rgba(247,249,252,0.12)"
};

export type Theme = {
  mode: "light" | "dark";
  colors: {
    textSecondary?: ColorValue;
    destructive?: string | OpaqueColorValue;
    textTertiary?: ColorValue;
    bg: string;
    card: string;
    text: string;
    primaryText: string;
    dangerText: string;
    subtext: string;
    border: string;
    primary: string;
    accent: string;
    danger: string;
    navy: string;
    primaryTextButton: string;
  };
};

export function makeTheme(mode: "light" | "dark"): Theme {
  const isDark = mode === "dark";

  return {
    mode,
    colors: {
      bg: isDark ? palette.darkBg : palette.lightBg,
      card: isDark ? palette.darkCard : palette.lightCard,
      text: isDark ? palette.darkText : palette.lightText,
      subtext: isDark ? palette.darkSubtext : palette.lightSubtext,
      border: isDark ? palette.darkBorder : palette.lightBorder,

      primary: isDark ? palette.mint : palette.navy,

      // text ON TOP of primary
      primaryText: isDark ? "#FFFFFF" : palette.darkBg ,
      primaryTextButton: isDark ? palette.darkBg : "#FFFFFF",

      // text ON TOP of danger
      dangerText: "#FFFFFF",

      accent: palette.mint,
      navy: palette.navy,
      danger: palette.danger,
    },
  };
}