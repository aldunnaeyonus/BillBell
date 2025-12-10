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
    subtext: string;
    border: string;
    primary: string;
    accent: string;
    danger: string;
  };
};

export function makeTheme(mode: "light" | "dark"): Theme {
  return {
    mode,
    colors: {
      bg: mode === "dark" ? palette.darkBg : palette.lightBg,
      card: mode === "dark" ? palette.darkCard : palette.lightCard,
      text: mode === "dark" ? palette.darkText : palette.lightText,
      subtext: mode === "dark" ? palette.darkSubtext : palette.lightSubtext,
      border: mode === "dark" ? palette.darkBorder : palette.lightBorder,
      primary: palette.navy,
      accent: palette.mint,
      danger: palette.danger
    }
  };
}
