import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { AnimatedCounter } from "../../../shared/infographics/AnimatedCounter";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop } from "./FrostBackdrop";

/** Infographic: a thermometer drops from room temperature to freezing while frost creeps in. */
export const TemperatureGauge: React.FC<{ fromC: number; toC: number; caption: string; sfxVolume?: number }> = ({ fromC, toC, caption, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { px, isVertical, width, height } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const start = 10;
  const dur = 50;
  const p = interpolate(frame - start, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const color = interpolateColors(p, [0, 0.5, 1], ["#ff4d2e", "#ffc531", "#29b6f6"]);
  const tubeH = px(isVertical ? 760 : 640);
  const tubeW = px(90);
  const fill = interpolate(p, [0, 1], [0.85, 0.12]);
  const frost = interpolate(p, [0.4, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ticks = 8;

  return (
    <AbsoluteFill>
      <FrostBackdrop variant="navy" seed={8} particles={Math.round(10 + frost * 25)} />
      {/* frost creeping in from the edges */}
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${px(260) * frost}px ${px(60) * frost}px rgba(205,238,255,${0.55 * frost})` }} />
      <AbsoluteFill style={{ flexDirection: isVertical ? "column" : "row", alignItems: "center", justifyContent: "center", gap: px(isVertical ? 60 : 140) }}>
        {/* thermometer */}
        <div style={{ position: "relative", width: tubeW * 3, height: tubeH + tubeW * 1.6 }}>
          <div style={{ position: "absolute", left: tubeW, top: 0, width: tubeW, height: tubeH, borderRadius: tubeW, background: "rgba(255,255,255,0.12)", border: `${px(5)}px solid rgba(255,255,255,0.6)`, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: color, transition: "none" }} />
          </div>
          <div style={{ position: "absolute", left: tubeW * 0.6, top: tubeH - tubeW * 0.4, width: tubeW * 1.8, height: tubeW * 1.8, borderRadius: "50%", background: color, border: `${px(5)}px solid rgba(255,255,255,0.6)`, boxShadow: `0 0 ${px(50)}px ${color}` }} />
          {Array.from({ length: ticks + 1 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: tubeW * 2.15, top: px(30) + (i / ticks) * (tubeH - px(60)), width: i % 2 ? px(18) : px(34), height: px(4), background: "rgba(255,255,255,0.6)" }} />
          ))}
        </div>
        <div style={{ textAlign: isVertical ? "center" : "left" }}>
          <AnimatedCounter
            from={fromC}
            to={toC}
            delay={start}
            durationInFrames={dur}
            suffix="°C"
            style={{ fontFamily: f.impact, fontSize: px(isVertical ? 260 : 250), color: c.white, lineHeight: 1, textShadow: `0 0 ${px(40)}px ${color}` }}
          />
          <AnimatedText text={caption.toUpperCase()} mode="rise" delay={start + dur - 6} stagger={4} align={isVertical ? "center" : "left"} style={{ fontFamily: f.sans, fontWeight: 800, fontSize: px(isVertical ? 50 : 46), color: c.ice, maxWidth: isVertical ? width * 0.85 : height * 0.9, lineHeight: 1.2 }} />
        </div>
      </AbsoluteFill>
      <SfxTrack
        masterVolume={sfxVolume}
        cues={[
          ...Array.from({ length: 8 }, (_, i) => ({ sfx: "tick" as const, at: start + i * 6, volume: 0.45, playbackRate: 1 - i * 0.04 })),
          { sfx: "iceSparkle", at: start + dur - 4, volume: 0.9 },
        ]}
      />
    </AbsoluteFill>
  );
};
