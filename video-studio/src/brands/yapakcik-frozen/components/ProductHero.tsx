import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { resolveMedia } from "../../../shared/utils/media";
import { rand } from "../../../shared/utils/random";
import { FROZEN_THEME } from "../theme";
import { FrostBackdrop, Snowflake } from "./FrostBackdrop";
import { ProductPack } from "./ProductPack";

/**
 * Hero product reveal: the pack spins in, a frost burst explodes behind it,
 * light sweeps across, the badge pops and the name rises in.
 */
export const ProductHero: React.FC<{
  brand: string;
  name: string;
  category: string;
  badge: string;
  packColor: string;
  imageSrc?: string;
  sfxVolume?: number;
}> = ({ brand, name, category, badge, packColor, imageSrc, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, isVertical, safe } = useLayout();
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const rotate = interpolate(enter, [0, 1], [-120, -22]) + Math.sin(frame / 25) * 4;
  const float = Math.sin(frame / 18) * px(10);
  const shine = interpolate(frame, [18, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const burst = spring({ frame: frame - 6, fps, config: { damping: 30, stiffness: 60 } });
  const badgePop = spring({ frame: frame - 30, fps, config: { damping: 8, stiffness: 200 } });
  const packW = px(isVertical ? 520 : 440);

  return (
    <AbsoluteFill>
      <FrostBackdrop variant="navy" seed={3} />
      <AbsoluteFill
        style={{
          flexDirection: isVertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: px(isVertical ? 70 : 140),
          paddingTop: isVertical ? safe.top - px(40) : 0,
        }}
      >
        <div style={{ position: "relative", width: packW * 1.6, height: packW * 1.55, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* frost burst */}
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const dist = burst * px(rand(`b${i}`, 260, 420));
            return (
              <div key={i} style={{ position: "absolute", transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px) rotate(${frame * 2 + i * 20}deg)`, opacity: interpolate(burst, [0, 0.3, 1], [0, 1, 0.5]) }}>
                <Snowflake size={px(rand(`bs${i}`, 30, 70))} color={c.ice} />
              </div>
            );
          })}
          <div style={{ position: "absolute", width: packW * 1.4, height: packW * 1.4, borderRadius: "50%", background: `radial-gradient(circle, rgba(41,182,246,0.55) 0%, transparent 65%)`, transform: `scale(${burst})` }} />
          <div style={{ transform: `translateY(${float}px) scale(${interpolate(enter, [0, 1], [0.4, 1])})` }}>
            {imageSrc ? (
              <Img src={resolveMedia(imageSrc)} style={{ width: packW * 1.2, transform: `rotate(${(1 - enter) * -20}deg)`, filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.5))" }} />
            ) : (
              <ProductPack width={packW} brand={brand} productName={name} category={category} color={packColor} rotateY={rotate} shine={shine} />
            )}
          </div>
          {/* badge */}
          <div
            style={{
              position: "absolute",
              top: px(20),
              right: px(10),
              width: px(170),
              height: px(170),
              borderRadius: "50%",
              background: c.gold,
              color: c.navy,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: f.impact,
              fontSize: px(52),
              transform: `scale(${badgePop}) rotate(${(1 - badgePop) * -90 + 12}deg)`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
              textAlign: "center",
              lineHeight: 0.95,
            }}
          >
            {badge}
          </div>
        </div>
        <div style={{ textAlign: isVertical ? "center" : "left", maxWidth: isVertical ? "90%" : px(720) }}>
          <AnimatedText text={category.toUpperCase()} mode="fade" delay={20} align={isVertical ? "center" : "left"} style={{ fontFamily: f.sans, fontWeight: 700, fontSize: px(34), letterSpacing: px(8), color: c.cyan }} />
          <AnimatedText text={name.toUpperCase()} mode="rise" delay={26} stagger={5} align={isVertical ? "center" : "left"} style={{ fontFamily: f.impact, fontSize: px(isVertical ? 130 : 120), lineHeight: 1, color: c.white }} />
        </div>
      </AbsoluteFill>
      <SfxTrack masterVolume={sfxVolume} cues={[{ sfx: "whoosh", at: 0, volume: 0.6 }, { sfx: "iceSparkle", at: 14, volume: 0.8 }, { sfx: "pop", at: 30, volume: 0.8 }]} />
    </AbsoluteFill>
  );
};
