import { Theme } from "./theme";

export function screen(theme: Theme) {
  return { flex: 1, padding: 16, backgroundColor: theme.colors.bg };
}

export function card(theme: Theme) {
  return {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14
  };
}

export function button(theme: Theme, variant: "primary" | "ghost" | "danger" = "primary") {
  const bg =
    variant === "primary" ? theme.colors.primary :
    variant === "danger" ? theme.colors.danger :
    "transparent";

  const borderWidth = variant === "ghost" ? 1 : 0;
  const borderColor = variant === "ghost" ? theme.colors.border : "transparent";

  return {
    backgroundColor: bg,
    borderWidth,
    borderColor,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14
  };
}

export function buttonText(theme: Theme, variant: "primary" | "ghost" | "danger" = "primary") {
  const color = variant === "ghost" ? theme.colors.text : "#FFFFFF";
  return { color, textAlign: "center", fontWeight: "700" as const };
}
