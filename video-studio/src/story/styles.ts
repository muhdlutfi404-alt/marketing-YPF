import { AM_THEME } from "../brands/project-am/theme";
import { FROZEN_THEME } from "../brands/yapakcik-frozen/theme";

/**
 * Brand style packs for the raw-footage editor.
 * Same engine, different personality per brand.
 */
export type StoryStyle = {
  name: string;
  colors: {
    accent: string; // main brand accent (bars, highlights)
    highlight: string; // active caption word
    text: string;
    dark: string; // panels / plates
    secondary: string;
  };
  fonts: { headline: string; body: string; caption: string };
  captionStroke: string;
  plate: "frost" | "earth";
};

export const STORY_STYLES: Record<"yapakcik-frozen" | "project-am", StoryStyle> = {
  "yapakcik-frozen": {
    name: "YaPakCik Frozen",
    colors: {
      accent: FROZEN_THEME.colors.accent,
      highlight: FROZEN_THEME.colors.gold,
      text: "#ffffff",
      dark: FROZEN_THEME.colors.navy,
      secondary: FROZEN_THEME.colors.cyan,
    },
    fonts: { headline: FROZEN_THEME.fonts.impact, body: FROZEN_THEME.fonts.sans, caption: FROZEN_THEME.fonts.sans },
    captionStroke: "#06182f",
    plate: "frost",
  },
  "project-am": {
    name: "Project A.M",
    colors: {
      accent: AM_THEME.colors.ember,
      highlight: AM_THEME.colors.ember,
      text: AM_THEME.colors.bone,
      dark: AM_THEME.colors.ink,
      secondary: AM_THEME.colors.sky,
    },
    fonts: { headline: AM_THEME.fonts.display, body: AM_THEME.fonts.body, caption: AM_THEME.fonts.body },
    captionStroke: "#000000",
    plate: "earth",
  },
};
