import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../hooks/useLayout";

/** Name + role caption with an animated accent bar. Themeable via props. */
export const LowerThird: React.FC<{
  name: string;
  role?: string;
  accent: string;
  textColor?: string;
  titleFont: string;
  bodyFont: string;
  delay?: number;
  holdFrames?: number;
}> = ({ name, role, accent, textColor = "#fff", titleFont, bodyFont, delay = 0, holdFrames = 90 }) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const { px, safe, isVertical } = useLayout();
  const bar = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  const text = spring({ frame: frame - 8, fps, config: { damping: 200 }, durationInFrames: 20 });
  const out = interpolate(frame, [holdFrames, holdFrames + 14], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  if (frame < 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        bottom: isVertical ? safe.bottom + px(40) : safe.bottom + px(70),
        display: "flex",
        alignItems: "stretch",
        gap: px(22),
        opacity: out,
        transform: `translateX(${(1 - out) * -px(40)}px)`,
      }}
    >
      <div style={{ width: px(8), background: accent, transform: `scaleY(${bar})`, transformOrigin: "bottom" }} />
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            fontFamily: titleFont,
            fontSize: px(isVertical ? 64 : 58),
            color: textColor,
            lineHeight: 1,
            transform: `translateY(${(1 - text) * 100}%)`,
            letterSpacing: px(2),
          }}
        >
          {name}
        </div>
        {role ? (
          <div
            style={{
              fontFamily: bodyFont,
              fontSize: px(28),
              color: textColor,
              opacity: 0.85 * text,
              marginTop: px(10),
              letterSpacing: px(4),
              textTransform: "uppercase",
            }}
          >
            {role}
          </div>
        ) : null}
      </div>
    </div>
  );
};
