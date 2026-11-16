import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { BokehPlaceholder } from "../../../shared/components/BokehPlaceholder";
import { CinematicZoom } from "../../../shared/components/CinematicZoom";
import { Footage } from "../../../shared/components/Footage";
import { useLayout } from "../../../shared/hooks/useLayout";
import { FROZEN_THEME } from "../theme";

/** Real-life B-roll (cooking, family dinner…) with a punchy headline over it. */
export const LifestyleShot: React.FC<{
  clip: { src?: string; trimBeforeSec: number };
  headline: string;
  durationInFrames: number;
  fps: number;
}> = ({ clip, headline, durationInFrames, fps }) => {
  const { px, isVertical, safe } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <CinematicZoom durationInFrames={durationInFrames} direction="in" amount={0.18} punchAt={[4]} punchAmount={0.05}>
        <Footage src={clip.src} trimBeforeSec={clip.trimBeforeSec} fps={fps} fallback={<BokehPlaceholder />} />
      </CinematicZoom>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 40%, rgba(6,24,47,0.85) 100%)" }} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: isVertical ? `0 ${safe.left}px ${safe.bottom}px` : `0 ${px(130)}px ${px(120)}px` }}>
        <AnimatedText
          text={headline.toUpperCase()}
          mode="slam"
          delay={6}
          stagger={5}
          align={isVertical ? "center" : "left"}
          style={{ fontFamily: f.impact, fontSize: px(isVertical ? 130 : 120), lineHeight: 1, color: c.white, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}
          wordStyle={(_, i) => (i === 0 ? { color: c.gold } : undefined)}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
