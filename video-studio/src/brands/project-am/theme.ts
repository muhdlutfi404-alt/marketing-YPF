import { FONT_STACKS, loadBrandFonts } from "../../shared/fonts";

/**
 * PROJECT A.M — visual identity.
 * Earthy, cinematic, adventurous. Change colours/fonts here and every
 * Project A.M template updates.
 */
loadBrandFonts();

export const AM_THEME = {
  colors: {
    ink: "#0d0f0c", // near-black, slightly green
    bone: "#f3ecdf", // warm off-white for text
    ember: "#e8833a", // sunset orange — the accent
    moss: "#6f8f5a",
    sky: "#9fb8c8",
    dim: "rgba(243,236,223,0.65)",
  },
  fonts: {
    display: FONT_STACKS.bebas, // big titles — Bebas Neue
    body: FONT_STACKS.inter, // labels & captions — Inter
    serif: FONT_STACKS.playfairItalic, // quotes — Playfair Display Italic
  },
} as const;
