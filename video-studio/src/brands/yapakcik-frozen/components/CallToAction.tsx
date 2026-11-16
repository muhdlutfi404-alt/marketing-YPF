import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { resolveMedia } from "../../../shared/utils/media";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop, Snowflake } from "./FrostBackdrop";

/** Final card: brand logo sting with ice shine, pulsing order button and contact details. */
export const CallToAction: React.FC<{
  brand: string;
  tagline: string;
  logoSrc?: string;
  headline: string;
  buttonText: string;
  contactLines: string[];
  sfxVolume?: number;
}> = ({ brand, tagline, logoSrc, headline, buttonText, contactLines, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const shine = interpolate(frame, [10, 34], [-30, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const button = spring({ frame: frame - 34, fps, config: { damping: 9, stiffness: 180 } });
  const pulse = frame > 50 ? 1 + Math.sin((frame - 50) / 5) * 0.04 : 1;

  return (
    <AbsoluteFill>
      <FrostBackdrop variant="navy" seed={21} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: px(isVertical ? 50 : 34) }}>
        <div style={{ transform: `scale(${logo})`, opacity: Math.min(1, logo * 2) }}>
          {logoSrc ? (
            <Img src={resolveMedia(logoSrc)} style={{ height: px(isVertical ? 260 : 220) }} />
          ) : (
            <div style={{ position: "relative", display: "inline-block", overflow: "hidden", padding: `0 ${px(20)}px` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: px(18) }}>
                <Snowflake size={px(isVertical ? 110 : 96)} color={c.cyan} strokeWidth={3} />
                <span style={{ fontFamily: f.sans, fontWeight: 900, fontSize: px(isVertical ? 128 : 116), color: c.white, letterSpacing: px(-2) }}>{brand}</span>
              </div>
              <div style={{ fontFamily: f.sans, fontWeight: 800, fontSize: px(isVertical ? 46 : 40), letterSpacing: px(28), color: c.cyan, marginTop: px(-8), marginRight: px(-28) }}>{tagline}</div>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${shine - 15}%, rgba(255,255,255,0.65) ${shine}%, transparent ${shine + 15}%)`, mixBlendMode: "overlay" }} />
            </div>
          )}
        </div>
        <AnimatedText text={headline.toUpperCase()} mode="rise" delay={18} align="center" style={{ fontFamily: f.impact, fontSize: px(isVertical ? 100 : 84), color: c.white, lineHeight: 1 }} />
        <div
          style={{
            display: "inline-block",
            alignSelf: "center",
            background: c.accent,
            color: c.white,
            fontFamily: f.sans,
            fontWeight: 900,
            fontSize: px(isVertical ? 52 : 44),
            padding: `${px(24)}px ${px(64)}px`,
            borderRadius: px(999),
            transform: `scale(${button * pulse})`,
            boxShadow: `0 0 ${px(40) * (pulse - 0.96) * 10}px rgba(255,77,46,0.7)`,
          }}
        >
          {buttonText.toUpperCase()}
        </div>
        <div>
          {contactLines.map((line, i) => (
            <AnimatedText key={i} text={line} mode="fade" delay={46 + i * 6} align="center" style={{ fontFamily: f.sans, fontWeight: 600, fontSize: px(isVertical ? 40 : 34), color: c.muted, marginTop: px(8) }} />
          ))}
        </div>
      </AbsoluteFill>
      <SfxTrack masterVolume={sfxVolume} cues={[{ sfx: "iceSparkle", at: 8, volume: 0.8 }, { sfx: "pop", at: 34, volume: 0.8 }]} />
    </AbsoluteFill>
  );
};
