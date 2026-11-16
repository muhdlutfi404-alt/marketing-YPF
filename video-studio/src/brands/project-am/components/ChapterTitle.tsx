import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { useLayout } from "../../../shared/hooks/useLayout";
import { AM_THEME } from "../theme";

/** "CHAPTER 01 — THE CLIMB" style title that appears over footage. */
export const ChapterTitle: React.FC<{ label: string; title: string; delay?: number; exitAt?: number }> = ({
  label,
  title,
  delay = 8,
  exitAt = 100,
}) => {
  const frame = useCurrentFrame();
  const { px, safe, isVertical, height } = useLayout();
  const line = interpolate(frame - delay, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const out = interpolate(frame, [exitAt, exitAt + 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { colors, fonts } = AM_THEME;
  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        right: safe.right,
        ...(isVertical ? { top: height * 0.36 } : { bottom: safe.bottom + px(150) }),
        opacity: out,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: px(18), marginBottom: px(14) }}>
        <div style={{ width: px(70) * line, height: px(3), background: colors.ember }} />
        <AnimatedText
          text={label}
          mode="fade"
          delay={delay + 6}
          style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: px(isVertical ? 34 : 28), letterSpacing: px(8), color: colors.ember }}
        />
      </div>
      <AnimatedText
        text={title}
        mode="rise"
        delay={delay + 10}
        stagger={5}
        style={{
          fontFamily: fonts.display,
          fontSize: px(isVertical ? 150 : 150),
          lineHeight: 0.95,
          color: colors.bone,
          textShadow: "0 6px 40px rgba(0,0,0,0.45)",
          maxWidth: isVertical ? "100%" : "70%",
        }}
      />
    </div>
  );
};
