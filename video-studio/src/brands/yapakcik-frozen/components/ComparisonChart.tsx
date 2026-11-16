import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { BarChart } from "../../../shared/infographics/BarChart";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop } from "./FrostBackdrop";

export type ComparisonItem = { label: string; value: number; highlight?: boolean };

/** Infographic: animated comparison bars ("Ready in 8 min vs 45 min for delivery"). */
export const ComparisonChart: React.FC<{ heading: string; unit: string; items: ComparisonItem[]; sfxVolume?: number }> = ({ heading, unit, items, sfxVolume = 1 }) => {
  const { px, isVertical, width, safe } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const delay = 16;
  const stagger = 10;
  return (
    <AbsoluteFill>
      <FrostBackdrop variant="navy" seed={11} particles={12} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: isVertical ? `${safe.top}px ${safe.left}px ${safe.bottom - px(100)}px` : px(120) }}>
        <div style={{ width: isVertical ? "100%" : width * 0.62 }}>
          <AnimatedText text={heading.toUpperCase()} mode="slam" stagger={4} align="center" style={{ fontFamily: f.impact, fontSize: px(isVertical ? 110 : 100), color: c.white, lineHeight: 1, marginBottom: px(70) }} wordStyle={(_, i) => (i === 0 ? { color: c.cyan } : undefined)} />
          <BarChart
            data={items.map((it) => ({ label: it.label, value: it.value, color: it.highlight ? c.cyan : "rgba(255,255,255,0.35)" }))}
            width={isVertical ? width - safe.left - safe.right : width * 0.62}
            barThickness={px(isVertical ? 64 : 56)}
            gap={px(isVertical ? 56 : 44)}
            color={c.cyan}
            font={f.sans}
            labelSize={px(isVertical ? 40 : 36)}
            valueSuffix={` ${unit}`}
            delay={delay}
            stagger={stagger}
          />
        </div>
      </AbsoluteFill>
      <SfxTrack masterVolume={sfxVolume} cues={items.map((_, i) => ({ sfx: "whoosh" as const, at: delay + i * stagger, volume: 0.3, playbackRate: 1.4 }))} />
    </AbsoluteFill>
  );
};
