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
    bg: string;
    card: string;
    text: string;
    primaryText: string;
    subtext: string;
    border: string;
    primary: string;
    accent: string;
    danger: string;
    navy: string;
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

      // ✅ primary should be a solid, readable brand color in both modes
      primary: isDark ? palette.mint : palette.navy,

      // ✅ text that sits ON TOP of primary
      primaryText: isDark ? palette.darkBg : "#FFFFFF",

      accent: palette.mint,
      navy: palette.navy,
      danger: palette.danger,
    },
  };
}
