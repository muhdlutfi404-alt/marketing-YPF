/** Global video settings shared by every template. */
export const FPS = 30;

/** Output sizes. Every template is registered in BOTH formats in Root.tsx. */
export const FORMATS = {
  /** 16:9 — YouTube, Facebook, websites, TV */
  landscape: { width: 1920, height: 1080 },
  /** 9:16 — TikTok, Instagram Reels, YouTube Shorts, WhatsApp Status */
  vertical: { width: 1080, height: 1920 },
} as const;

export type FormatName = keyof typeof FORMATS;
