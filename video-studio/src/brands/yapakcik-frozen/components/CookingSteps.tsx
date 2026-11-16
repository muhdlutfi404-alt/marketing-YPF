import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { ProgressRing } from "../../../shared/infographics/ProgressRing";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop } from "./FrostBackdrop";

export type Step = { title: string; caption: string };

/** Educational "how to" sequence: numbered rings fill one after another, joined by a drawing line. */
export const CookingSteps: React.FC<{ heading: string; steps: Step[]; sfxVolume?: number }> = ({ heading, steps, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical, safe } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const start = 16;
  const stagger = 22;
  const ring = px(isVertical ? 170 : 190);
  const line = interpolate(frame, [start, start + stagger * (steps.length - 1) + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });

  return (
    <AbsoluteFill>
      <FrostBackdrop variant="ice" seed={13} particles={10} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: isVertical ? `${safe.top}px ${safe.left}px ${safe.bottom - px(140)}px` : px(110) }}>
        <AnimatedText text={heading.toUpperCase()} mode="slam" stagger={5} align="center" style={{ fontFamily: f.impact, fontSize: px(isVertical ? 116 : 104), color: c.navy, lineHeight: 1, marginBottom: px(isVertical ? 60 : 80) }} />
        <div style={{ position: "relative", display: "flex", flexDirection: isVertical ? "column" : "row", gap: px(isVertical ? 46 : 110), alignItems: isVertical ? "flex-start" : "flex-start" }}>
          {/* connector line */}
          <div
            style={{
              position: "absolute",
              background: c.accent,
              ...(isVertical
                ? { left: ring / 2 - px(4), top: ring / 2, width: px(8), height: `calc((100% - ${ring}px) * ${line})` }
                : { top: ring / 2 - px(4), left: ring / 2, height: px(8), width: `calc((100% - ${ring}px) * ${line})` }),
            }}
          />
          {steps.map((s, i) => {
            const at = start + i * stagger;
            const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 160 } });
            return (
              <div key={i} style={{ display: "flex", flexDirection: isVertical ? "row" : "column", alignItems: "center", gap: px(isVertical ? 34 : 26), width: isVertical ? "100%" : px(380), transform: `scale(${interpolate(p, [0, 1], [0.6, 1])})`, opacity: Math.min(1, p * 2) }}>
                <div style={{ background: c.white, borderRadius: "50%", boxShadow: "0 14px 30px rgba(6,24,47,0.2)", flex: "none" }}>
                  <ProgressRing size={ring} stroke={px(14)} value={100} color={i === steps.length - 1 ? c.accent : c.blue} trackColor="rgba(21,101,192,0.15)" delay={at} durationInFrames={24}>
                    <span style={{ fontFamily: f.impact, fontSize: ring * 0.5, color: c.navy }}>{i + 1}</span>
                  </ProgressRing>
                </div>
                <div style={{ textAlign: isVertical ? "left" : "center" }}>
                  <div style={{ fontFamily: f.sans, fontWeight: 900, fontSize: px(isVertical ? 50 : 44), color: c.navy }}>{s.title}</div>
                  <div style={{ fontFamily: f.sans, fontWeight: 500, fontSize: px(isVertical ? 32 : 28), color: "#3b5878", marginTop: px(6) }}>{s.caption}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <SfxTrack masterVolume={sfxVolume} cues={steps.map((_, i) => ({ sfx: "pop" as const, at: start + i * stagger, volume: 0.75, playbackRate: 0.9 + i * 0.12 }))} />
    </AbsoluteFill>
  );
};
