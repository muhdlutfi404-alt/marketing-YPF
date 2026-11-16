import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useLayout } from "../../../shared/hooks/useLayout";
import { rand } from "../../../shared/utils/random";
import { FROZEN_THEME } from "../theme";

/** A 6-armed snowflake / ice crystal. */
export const Snowflake: React.FC<{ size: number; color?: string; opacity?: number; strokeWidth?: number }> = ({
  size,
  color = "#fff",
  opacity = 1,
  strokeWidth = 2,
}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ opacity, overflow: "visible" }}>
    {Array.from({ length: 6 }, (_, i) => (
      <g key={i} transform={`rotate(${i * 60})`} stroke={color} strokeWidth={strokeWidth * (100 / size) * 2} strokeLinecap="round" fill="none">
        <line x1={0} y1={0} x2={0} y2={-44} />
        <line x1={0} y1={-26} x2={-12} y2={-36} />
        <line x1={0} y1={-26} x2={12} y2={-36} />
        <line x1={0} y1={-12} x2={-8} y2={-20} />
        <line x1={0} y1={-12} x2={8} y2={-20} />
      </g>
    ))}
  </svg>
);

export type BackdropVariant = "navy" | "ice" | "warm";

/**
 * Animated brand background: deep gradient, sweeping light beams,
 * subtle grid and drifting ice crystals. Every Frozen scene sits on this.
 */
export const FrostBackdrop: React.FC<{ variant?: BackdropVariant; particles?: number; seed?: number }> = ({
  variant = "navy",
  particles = 26,
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, px } = useLayout();
  const c = FROZEN_THEME.colors;
  const bg =
    variant === "navy"
      ? `radial-gradient(ellipse at 30% 20%, ${c.deep} 0%, ${c.navy} 65%)`
      : variant === "ice"
        ? `radial-gradient(ellipse at 50% 30%, #ffffff 0%, ${c.ice} 55%, #8fd3f4 100%)`
        : `radial-gradient(ellipse at 50% 40%, #ff7a45 0%, #c8301e 60%, #6d1410 100%)`;
  const flakeColor = variant === "ice" ? c.cyan : "#ffffff";

  const flakes = useMemo(
    () =>
      Array.from({ length: particles }, (_, i) => ({
        x: rand(`fx${seed}-${i}`, 0, 1),
        y: rand(`fy${seed}-${i}`, 0, 1),
        size: rand(`fs${seed}-${i}`, 14, 60),
        speed: rand(`fv${seed}-${i}`, 0.4, 1.4),
        spin: rand(`fr${seed}-${i}`, -1, 1),
        sway: rand(`fw${seed}-${i}`, 0, Math.PI * 2),
        opacity: rand(`fo${seed}-${i}`, 0.15, 0.6),
      })),
    [particles, seed],
  );

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {/* grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${variant === "ice" ? "rgba(21,101,192,0.07)" : "rgba(255,255,255,0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${variant === "ice" ? "rgba(21,101,192,0.07)" : "rgba(255,255,255,0.05)"} 1px, transparent 1px)`,
          backgroundSize: `${px(90)}px ${px(90)}px`,
          transform: `translateY(${(frame * 0.6) % px(90)}px)`,
        }}
      />
      {/* light beams */}
      {[0, 1].map((i) => (
        <AbsoluteFill
          key={i}
          style={{
            background: `linear-gradient(${105 + i * 20}deg, transparent 40%, rgba(255,255,255,${variant === "ice" ? 0.5 : 0.09}) 50%, transparent 60%)`,
            transform: `translateX(${Math.sin((frame + i * 70) / 70) * 25}%)`,
          }}
        />
      ))}
      {/* drifting ice crystals */}
      {flakes.map((f, i) => {
        const y = ((f.y * height + frame * f.speed * px(1.6)) % (height + 120)) - 60;
        const x = f.x * width + Math.sin(frame / 40 + f.sway) * px(30);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `rotate(${frame * f.spin * 1.5}deg)` }}>
            <Snowflake size={px(f.size)} color={flakeColor} opacity={f.opacity} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
