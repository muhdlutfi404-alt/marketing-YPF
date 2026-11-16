import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { useLayout } from "../../../shared/hooks/useLayout";
import { resolveMedia } from "../../../shared/utils/media";
import { AM_THEME } from "../theme";

/** Brand outro: logo/wordmark, tagline and a call to action. */
export const EndCard: React.FC<{ brand: string; tagline: string; callToAction: string; logoSrc?: string }> = ({ brand, tagline, callToAction, logoSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical } = useLayout();
  const { colors, fonts } = AM_THEME;
  const cta = spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.02 * Math.min(1, Math.max(0, (frame - 55) / 10));
  return (
    <AbsoluteFill style={{ background: colors.ink, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        {logoSrc ? <Img src={resolveMedia(logoSrc)} style={{ height: px(220), marginBottom: px(30), opacity: Math.min(1, frame / 20) }} /> : null}
        <AnimatedText
          text={brand}
          mode="tracking"
          align="center"
          trackingSpread={isVertical ? 0.1 : 0.3}
          style={{ fontFamily: fonts.display, fontSize: px(isVertical ? 200 : 220), color: colors.bone, lineHeight: 0.9, letterSpacing: px(12) }}
        />
        <AnimatedText text={tagline} mode="fade" delay={20} stagger={5} align="center" style={{ fontFamily: fonts.serif, fontSize: px(isVertical ? 46 : 42), color: colors.dim, marginTop: px(20) }} />
        <div
          style={{
            display: "inline-block",
            marginTop: px(60),
            padding: `${px(20)}px ${px(46)}px`,
            border: `${px(3)}px solid ${colors.ember}`,
            color: colors.bone,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: px(isVertical ? 34 : 30),
            letterSpacing: px(6),
            transform: `scale(${cta * pulse})`,
            opacity: Math.min(1, cta * 1.5),
          }}
        >
          {callToAction.toUpperCase()}
        </div>
      </div>
    </AbsoluteFill>
  );
};
