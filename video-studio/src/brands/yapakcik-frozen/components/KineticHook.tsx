import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop } from "./FrostBackdrop";

/**
 * The first 3 seconds — the scroll-stopper.
 * Each line SLAMS in with a camera shake, then the punchline lands on a colour block.
 */
export const KineticHook: React.FC<{ lines: string[]; punchline: string; durationInFrames: number; sfxVolume?: number }> = ({
  lines,
  punchline,
  durationInFrames,
  sfxVolume = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const gap = Math.max(10, Math.floor((durationInFrames * 0.55) / Math.max(1, lines.length)));
  const lineStarts = lines.map((_, i) => 4 + i * gap);
  const punchAt = 4 + lines.length * gap;

  // camera shake decays after every slam
  const shake = [...lineStarts, punchAt].reduce((acc, at) => {
    const t = frame - at;
    if (t < 0 || t > 12) return acc;
    return acc + Math.sin(t * 2.7) * (12 - t) * px(1.6);
  }, 0);

  const block = spring({ frame: frame - punchAt, fps, config: { damping: 16, stiffness: 160 } });
  const punch = spring({ frame: frame - punchAt - 3, fps, config: { damping: 11, stiffness: 200 } });

  return (
    <AbsoluteFill>
      <FrostBackdrop variant="navy" />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${shake}px, ${shake * -0.6}px)` }}>
        <div style={{ textAlign: "center" }}>
          {lines.map((line, i) => {
            const p = spring({ frame: frame - lineStarts[i], fps, config: { damping: 13, stiffness: 230, mass: 0.7 } });
            const dim = interpolate(frame, [punchAt, punchAt + 8], [1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={i}
                style={{
                  fontFamily: f.impact,
                  fontSize: px(isVertical ? 190 : 170),
                  lineHeight: 1,
                  color: i % 2 ? c.cyan : c.white,
                  transform: `scale(${interpolate(p, [0, 1], [3, 1])})`,
                  opacity: Math.min(1, p * 2) * dim,
                  filter: `blur(${(1 - Math.min(1, p)) * 8}px)`,
                }}
              >
                {line}
              </div>
            );
          })}
          <div style={{ position: "relative", display: "inline-block", marginTop: px(30), padding: `${px(10)}px ${px(40)}px` }}>
            <div style={{ position: "absolute", inset: 0, background: c.accent, transform: `scaleX(${block}) skewX(-8deg)`, transformOrigin: "left" }} />
            <div style={{ position: "relative", fontFamily: f.impact, fontSize: px(isVertical ? 150 : 130), color: c.white, lineHeight: 1.05, transform: `scale(${punch})`, opacity: Math.min(1, punch * 2) }}>
              {punchline}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <SfxTrack
        masterVolume={sfxVolume}
        cues={[
          ...lineStarts.map((at) => ({ sfx: "impact" as const, at, volume: 0.6, playbackRate: 1.3 })),
          { sfx: "impact", at: punchAt, volume: 0.95 },
          { sfx: "riser", at: Math.max(0, punchAt - 30), volume: 0.35 },
        ]}
      />
    </AbsoluteFill>
  );
};
