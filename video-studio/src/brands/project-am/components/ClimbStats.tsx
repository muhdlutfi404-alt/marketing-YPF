import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { AnimatedCounter } from "../../../shared/infographics/AnimatedCounter";
import { LineChart } from "../../../shared/infographics/LineChart";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { AM_THEME } from "../theme";

export type JourneyStat = { label: string; value: number; suffix?: string; decimals?: number };

/** Elevation profile that draws itself + a grid of journey statistics. */
export const ClimbStats: React.FC<{
  heading: string;
  elevationM: number[];
  stats: JourneyStat[];
  sfxVolume?: number;
}> = ({ heading, elevationM, stats, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, px, safe, isVertical } = useLayout();
  const { colors, fonts } = AM_THEME;
  const peak = Math.max(...elevationM);
  const chartW = isVertical ? width - safe.left - safe.right : width * 0.52;
  const chartH = isVertical ? height * 0.22 : height * 0.42;
  const statsDelay = 30;
  const statStagger = 8;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #1b2119 0%, ${colors.ink} 70%)` }}>
      <div
        style={{
          position: "absolute",
          left: safe.left,
          right: safe.right,
          top: isVertical ? safe.top : px(110),
          bottom: isVertical ? safe.bottom - px(80) : px(110),
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: isVertical ? px(70) : px(90),
          alignItems: isVertical ? "stretch" : "center",
        }}
      >
        <div>
          <AnimatedText text="ELEVATION PROFILE" mode="fade" style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: px(isVertical ? 32 : 26), letterSpacing: px(8), color: colors.ember }} />
          <AnimatedText text={heading} mode="rise" delay={4} style={{ fontFamily: fonts.display, fontSize: px(isVertical ? 110 : 96), color: colors.bone, lineHeight: 1, marginBottom: px(40) }} />
          <LineChart
            values={elevationM}
            width={chartW}
            height={chartH}
            color={colors.ember}
            fill="rgba(232,131,58,0.18)"
            strokeWidth={px(5)}
            delay={12}
            durationInFrames={70}
            markPeak={{ label: `PEAK ${peak.toLocaleString("en-US")} M`, font: fonts.body, size: px(isVertical ? 30 : 26), color: colors.bone }}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: `${px(isVertical ? 50 : 60)}px ${px(50)}px`,
            alignContent: "center",
          }}
        >
          {stats.map((s, i) => {
            const start = statsDelay + i * statStagger;
            const p = spring({ frame: frame - start, fps, config: { damping: 200 }, durationInFrames: 20 });
            return (
              <div key={s.label} style={{ borderTop: `${px(2)}px solid rgba(243,236,223,0.25)`, paddingTop: px(18), opacity: p, transform: `translateY(${(1 - p) * px(30)}px)` }}>
                <AnimatedCounter
                  to={s.value}
                  decimals={s.decimals ?? 0}
                  suffix={s.suffix ?? ""}
                  delay={start}
                  durationInFrames={40}
                  style={{ fontFamily: fonts.display, fontSize: px(isVertical ? 120 : 104), color: colors.bone, lineHeight: 1 }}
                />
                <div style={{ fontFamily: fonts.body, fontSize: px(isVertical ? 28 : 24), letterSpacing: px(5), color: colors.dim, marginTop: px(6) }}>{s.label.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>
      <SfxTrack masterVolume={sfxVolume} cues={stats.map((_, i) => ({ sfx: "tick", at: statsDelay + i * statStagger, volume: 0.6 }))} />
    </AbsoluteFill>
  );
};
