import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop } from "./FrostBackdrop";
import { Icon, type IconName } from "./Icon";

export type Feature = { icon: IconName; title: string; text: string };

/** "Why choose us" — feature cards that fly in one by one with an icon pop. */
export const FeatureGrid: React.FC<{ heading: string; features: Feature[]; sfxVolume?: number }> = ({ heading, features, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical, safe } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const start = 14;
  const stagger = 9;
  return (
    <AbsoluteFill>
      <FrostBackdrop variant="ice" particles={14} seed={5} />
      <AbsoluteFill
        style={{
          padding: isVertical ? `${safe.top}px ${safe.left}px ${safe.bottom - px(120)}px` : `${px(110)}px ${px(130)}px`,
          flexDirection: isVertical ? "column" : "row",
          alignItems: isVertical ? "stretch" : "center",
          gap: px(isVertical ? 50 : 90),
        }}
      >
        <div style={{ flex: isVertical ? undefined : "0 0 34%" }}>
          <AnimatedText text={heading} mode="slam" stagger={5} style={{ fontFamily: f.impact, fontSize: px(isVertical ? 104 : 112), lineHeight: 1, color: c.navy }} wordStyle={(_, i) => (i % 3 === 2 ? { color: c.accent } : undefined)} />
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: isVertical ? "1fr" : "1fr 1fr", gap: px(isVertical ? 26 : 34) }}>
          {features.map((feat, i) => {
            const p = spring({ frame: frame - start - i * stagger, fps, config: { damping: 15, stiffness: 120 } });
            const icon = spring({ frame: frame - start - i * stagger - 6, fps, config: { damping: 8, stiffness: 220 } });
            return (
              <div
                key={feat.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: px(28),
                  background: c.white,
                  borderRadius: px(FROZEN_THEME.radius),
                  padding: px(isVertical ? 30 : 34),
                  boxShadow: "0 18px 40px rgba(6,24,47,0.18)",
                  transform: `translateX(${(1 - p) * (i % 2 ? px(300) : -px(300))}px)`,
                  opacity: Math.min(1, p * 1.5),
                }}
              >
                <div style={{ flex: "none", width: px(110), height: px(110), borderRadius: "50%", background: i % 2 ? c.accent : c.blue, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${icon})` }}>
                  <Icon name={feat.icon} size={px(60)} color={c.white} />
                </div>
                <div>
                  <div style={{ fontFamily: f.sans, fontWeight: 900, fontSize: px(isVertical ? 44 : 40), color: c.navy }}>{feat.title}</div>
                  <div style={{ fontFamily: f.sans, fontWeight: 500, fontSize: px(isVertical ? 30 : 27), color: "#3b5878", marginTop: px(4) }}>{feat.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <SfxTrack masterVolume={sfxVolume} cues={features.map((_, i) => ({ sfx: "pop" as const, at: start + i * stagger + 6, volume: 0.7, playbackRate: 1 + i * 0.08 }))} />
    </AbsoluteFill>
  );
};
