import { FONT_STACKS, loadBrandFonts } from "../../shared/fonts";

/**
 * YAPAKCIK FROZEN — visual identity.
 * Icy blues for "frozen & fresh", a warm appetite-red accent for food & calls-to-action,
 * and bold, heavy typography for commercial punch.
 */
loadBrandFonts();

export const FROZEN_THEME = {
  colors: {
    navy: "#06182f",
    deep: "#0b2a52",
    blue: "#1565c0",
    cyan: "#29b6f6",
    ice: "#cdeeff",
    white: "#ffffff",
    accent: "#ff4d2e", // appetite red-orange: prices, CTA, highlights
    gold: "#ffc531", // price burst / badges
    text: "#eaf6ff",
    muted: "rgba(234,246,255,0.7)",
  },
  fonts: {
    sans: FONT_STACKS.montserrat, // Montserrat — everything
    impact: FONT_STACKS.anton, // Anton — kinetic headlines
  },
  radius: 28,
} as const;
