import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { normalize, type CaptionPage } from "./engine";
import { FONT_STACKS } from "../shared/fonts";
import type { StoryStyle } from "./styles";

/**
 * Word-by-word subtitles from the real transcript.
 * Text is displayed EXACTLY as transcribed (dialect kept); `uppercase` only changes letter case.
 * The word being spoken right now is highlighted.
 */
export const StoryCaptions: React.FC<{
  pages: CaptionPage[];
  style: StoryStyle;
  variant: "bold" | "documentary" | "minimal";
  uppercase?: boolean;
  position?: number;
  hiddenRanges?: { from: number; to: number }[];
  emphasis?: Record<string, "big" | "script">;
  /** space between words (thick stroked captions need more than the default) */
  wordGap?: string;
}> = ({ pages, style, variant, uppercase = false, position = 0.7, hiddenRanges = [], emphasis = {}, wordGap = "0.25em" }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  if (hiddenRanges.some((r) => t >= r.from && t < r.to)) return null;
  const page = pages.find((p) => t >= p.start && t < p.end);
  if (!page) return null;
  const local = Math.round((t - page.start) * fps);
  const pop = spring({ frame: local, fps, config: { damping: 14, stiffness: 220 }, durationInFrames: 10 });

  const base: React.CSSProperties =
    variant === "bold"
      ? { fontFamily: style.fonts.caption, fontWeight: 900, fontSize: 76, lineHeight: 1.12, color: "#fff", WebkitTextStroke: `10px ${style.captionStroke}`, paintOrder: "stroke fill", textShadow: "0 6px 16px rgba(0,0,0,0.45)" }
      : variant === "documentary"
        ? { fontFamily: style.fonts.caption, fontWeight: 600, fontSize: 54, lineHeight: 1.25, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)" }
        : { fontFamily: FONT_STACKS.inter, fontWeight: 600, fontSize: 46, lineHeight: 1.1, color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.6)", letterSpacing: 0.2 };
  const emph = (w: string): React.CSSProperties | undefined => {
    const e = emphasis[normalize(w)];
    if (variant !== "minimal" || !e) return undefined;
    return e === "script"
      ? { fontFamily: FONT_STACKS.playfairItalic, fontStyle: "italic", fontWeight: 400, fontSize: 70, letterSpacing: 0 }
      : { fontWeight: 800, fontSize: 74, letterSpacing: -1 };
  };

  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: height * position, display: "flex", justifyContent: "center", transform: `translateY(-50%) scale(${0.9 + 0.1 * pop})`, opacity: Math.min(1, pop * 1.5) }}>
      <div style={{ ...base, textAlign: "center", textTransform: uppercase ? "uppercase" : "none" }}>
        {page.words.map((w, i) => {
          const active = t >= w.t0 && t < Math.max(w.t1, w.t0 + 0.12);
          const spoken = t >= w.t0;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: wordGap,
                ...emph(w.text),
                color: variant === "minimal" ? (spoken ? "#fff" : "rgba(255,255,255,0.55)") : active ? style.colors.highlight : variant === "documentary" && !spoken ? "rgba(255,255,255,0.75)" : "#fff",
                transform: active && variant === "bold" ? "scale(1.08)" : undefined,
                borderBottom: active && variant === "documentary" ? `4px solid ${style.colors.highlight}` : "4px solid transparent",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
