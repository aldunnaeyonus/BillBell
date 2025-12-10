import { useColorScheme } from "react-native";
import { makeTheme, Theme } from "./theme";

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return makeTheme(scheme === "dark" ? "dark" : "light");
}
