import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../hooks/useLayout";

export type Caption = { text: string; startSec: number; endSec: number };

/**
 * Burned-in subtitles. Most social videos are watched on mute,
 * so captions massively improve retention.
 * In vertical they sit higher to stay clear of the TikTok/Reels caption area.
 */
export const Subtitles: React.FC<{
  captions: Caption[];
  font: string;
  highlight?: string;
  boxColor?: string;
}> = ({ captions, font, highlight = "#ffd166", boxColor = "rgba(0,0,0,0.55)" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical, safe } = useLayout();
  const t = frame / fps;
  const current = captions.find((c) => t >= c.startSec && t < c.endSec);
  if (!current) return null;
  const local = (t - current.startSec) * fps;
  const appear = interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const words = current.text.split(" ");
  // highlight the word currently being "spoken" (even spread across the caption)
  const progress = (t - current.startSec) / (current.endSec - current.startSec);
  const activeWord = Math.min(words.length - 1, Math.floor(progress * words.length));
  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        right: safe.right,
        bottom: isVertical ? safe.bottom - px(120) : px(70),
        display: "flex",
        justifyContent: "center",
        opacity: appear,
        transform: `translateY(${(1 - appear) * px(12)}px)`,
      }}
    >
      <div
        style={{
          fontFamily: font,
          fontSize: px(isVertical ? 50 : 40),
          fontWeight: 600,
          color: "#fff",
          background: boxColor,
          padding: `${px(10)}px ${px(22)}px`,
          borderRadius: px(10),
          textAlign: "center",
          lineHeight: 1.3,
          maxWidth: isVertical ? "100%" : "75%",
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: i === activeWord ? highlight : "#fff" }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
