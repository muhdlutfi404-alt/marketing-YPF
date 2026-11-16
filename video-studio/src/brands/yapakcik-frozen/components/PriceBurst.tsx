import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedCounter } from "../../../shared/infographics/AnimatedCounter";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop } from "./FrostBackdrop";

const starPath = (points: number, outer: number, inner: number) => {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"} ${Math.cos(a) * r} ${Math.sin(a) * r} `;
  }
  return `${d}Z`;
};

/** Price reveal: spinning starburst, old price struck out, new price counts up and lands. */
export const PriceBurst: React.FC<{
  currency: string;
  price: number;
  originalPrice?: number;
  unitLabel: string;
  note: string;
  sfxVolume?: number;
}> = ({ currency, price, originalPrice, unitLabel, note, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const burst = spring({ frame: frame - 4, fps, config: { damping: 10, stiffness: 120 } });
  const strike = interpolate(frame, [14, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const land = spring({ frame: frame - 40, fps, config: { damping: 7, stiffness: 260 } });
  const size = px(isVertical ? 900 : 820);
  const pill = spring({ frame: frame - 48, fps, config: { damping: 12, stiffness: 160 } });

  return (
    <AbsoluteFill>
      <FrostBackdrop variant="warm" seed={17} particles={16} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} style={{ position: "absolute", transform: `scale(${burst}) rotate(${frame * 0.8}deg)` }}>
          <path d={starPath(18, size * 0.48, size * 0.4)} fill={c.gold} />
          <path d={starPath(18, size * 0.4, size * 0.35)} fill="#ffd95e" />
        </svg>
        <div style={{ position: "relative", textAlign: "center", transform: `scale(${burst})` }}>
          {originalPrice ? (
            <div style={{ position: "relative", display: "inline-block", fontFamily: f.sans, fontWeight: 800, fontSize: px(52), color: c.navy, opacity: 0.6, marginBottom: px(14) }}>
              {currency} {originalPrice.toFixed(2)}
              <div style={{ position: "absolute", left: "-5%", top: "52%", height: px(7), width: `${110 * strike}%`, background: c.accent, transform: "rotate(-8deg)" }} />
            </div>
          ) : null}
          <div style={{ fontFamily: f.impact, color: c.navy, lineHeight: 1.05, whiteSpace: "nowrap", transform: `scale(${interpolate(land, [0, 1], [1.2, 1])})` }}>
            <span style={{ fontSize: px(60), verticalAlign: "top", marginRight: px(6) }}>{currency}</span>
            <AnimatedCounter to={price} decimals={2} delay={18} durationInFrames={22} style={{ fontSize: px(isVertical ? 170 : 155) }} />
          </div>
          <div style={{ fontFamily: f.sans, fontWeight: 800, fontSize: px(36), color: c.navy, marginTop: px(12) }}>{unitLabel}</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: isVertical ? px(500) : px(70) }}>
        <div style={{ background: c.navy, padding: `${px(14)}px ${px(34)}px`, borderRadius: px(999), transform: `scale(${pill})`, opacity: Math.min(1, pill * 2) }}>
          <AnimatedText text={note.toUpperCase()} mode="pop" delay={52} align="center" style={{ fontFamily: f.sans, fontWeight: 900, fontSize: px(isVertical ? 50 : 44), color: c.white }} />
        </div>
      </AbsoluteFill>
      <SfxTrack
        masterVolume={sfxVolume}
        cues={[
          { sfx: "whoosh", at: 0, volume: 0.6 },
          { sfx: "tick", at: 20, volume: 0.5 },
          { sfx: "tick", at: 26, volume: 0.5 },
          { sfx: "tick", at: 32, volume: 0.5 },
          { sfx: "impact", at: 40, volume: 0.8, playbackRate: 1.2 },
          { sfx: "pop", at: 50, volume: 0.7 },
        ]}
      />
    </AbsoluteFill>
  );
};
