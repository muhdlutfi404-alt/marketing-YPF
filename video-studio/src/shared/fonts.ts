import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * Brand fonts, bundled in public/fonts (SIL Open Font License — see OFL-*.txt there).
 * Loading them from the project instead of the internet means renders work offline
 * and look identical on every computer. Remotion waits for them before rendering.
 *
 * To add a font: put the .woff2 in public/fonts and add an entry below.
 * Inter and Montserrat are "variable" fonts — one file contains every weight.
 */
const FONT_FILES = [
  { family: "Bebas Neue", file: "fonts/bebas-neue-normal.woff2", weight: "400", style: "normal" },
  { family: "Anton", file: "fonts/anton-normal.woff2", weight: "400", style: "normal" },
  { family: "Inter", file: "fonts/inter-normal.woff2", weight: "100 900", style: "normal" },
  { family: "Montserrat", file: "fonts/montserrat-normal.woff2", weight: "100 900", style: "normal" },
  { family: "Playfair Display", file: "fonts/playfair-display-italic.woff2", weight: "400 900", style: "italic" },
] as const;

let loaded = false;
export const loadBrandFonts = () => {
  if (loaded) return;
  loaded = true;
  for (const f of FONT_FILES) {
    loadFont({ family: f.family, url: staticFile(f.file), weight: f.weight, style: f.style, format: "woff2" }).catch((err) => {
      console.error(`Could not load font ${f.family}`, err);
    });
  }
};

/** CSS font stacks (with safe fallbacks) used by the brand themes. */
export const FONT_STACKS = {
  bebas: '"Bebas Neue", "Anton", Impact, sans-serif',
  anton: '"Anton", Impact, sans-serif',
  inter: '"Inter", "Helvetica Neue", Arial, sans-serif',
  montserrat: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
  playfairItalic: '"Playfair Display", Georgia, serif',
} as const;
