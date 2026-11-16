import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { useLayout } from "../../../shared/hooks/useLayout";
import { AM_THEME } from "../theme";

/** Main title: episode label, huge tracked-in title, subtitle, expanding rules. */
export const TitleSequence: React.FC<{ episodeLabel: string; title: string; subtitle: string }> = ({ episodeLabel, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { px, isVertical, safe } = useLayout();
  const { colors, fonts } = AM_THEME;
  const rule = interpolate(frame, [6, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingLeft: safe.left, paddingRight: safe.right }}>
      <div style={{ textAlign: "center", width: "100%" }}>
        <AnimatedText
          text={episodeLabel}
          mode="tracking"
          delay={2}
          align="center"
          trackingSpread={isVertical ? 0.15 : 0.5}
          style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: px(isVertical ? 36 : 30), letterSpacing: px(14), color: colors.ember }}
        />
        <div style={{ height: px(3), width: `${rule * (isVertical ? 70 : 40)}%`, margin: `${px(26)}px auto`, background: `linear-gradient(90deg, transparent, ${colors.bone}, transparent)` }} />
        <AnimatedText
          text={title}
          mode="tracking"
          delay={8}
          align="center"
          trackingSpread={isVertical ? 0.12 : 0.35}
          style={{
            fontFamily: fonts.display,
            fontSize: px(isVertical ? 190 : 230),
            lineHeight: 0.9,
            color: colors.bone,
            textShadow: "0 10px 60px rgba(0,0,0,0.6)",
          }}
        />
        <div style={{ height: px(3), width: `${rule * (isVertical ? 70 : 40)}%`, margin: `${px(26)}px auto`, background: `linear-gradient(90deg, transparent, ${colors.bone}, transparent)` }} />
        <AnimatedText
          text={subtitle}
          mode="blur"
          delay={30}
          stagger={3}
          align="center"
          style={{ fontFamily: fonts.serif, fontSize: px(isVertical ? 48 : 44), color: colors.dim }}
        />
      </div>
    </AbsoluteFill>
  );
};
