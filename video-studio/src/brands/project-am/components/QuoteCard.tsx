import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { useLayout } from "../../../shared/hooks/useLayout";
import { AM_THEME } from "../theme";

/** A reflective narration quote, revealed word by word in elegant serif italics. */
export const QuoteCard: React.FC<{ text: string; author?: string }> = ({ text, author }) => {
  const frame = useCurrentFrame();
  const { px, isVertical, safe } = useLayout();
  const { colors, fonts } = AM_THEME;
  const words = text.split(/\s+/).length;
  const authorDelay = 10 + words * 4 + 10;
  const mark = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `0 ${isVertical ? safe.left : px(260)}px` }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: fonts.serif, fontSize: px(200), lineHeight: 0.6, color: colors.ember, opacity: mark, height: px(90) }}>“</div>
        <AnimatedText
          text={text}
          mode="blur"
          delay={10}
          stagger={4}
          align="center"
          style={{ fontFamily: fonts.serif, fontSize: px(isVertical ? 72 : 66), lineHeight: 1.25, color: colors.bone }}
        />
        {author ? (
          <AnimatedText
            text={`— ${author}`}
            mode="fade"
            delay={authorDelay}
            align="center"
            style={{ fontFamily: fonts.body, fontSize: px(28), letterSpacing: px(6), color: colors.dim, marginTop: px(40), textTransform: "uppercase" }}
          />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
