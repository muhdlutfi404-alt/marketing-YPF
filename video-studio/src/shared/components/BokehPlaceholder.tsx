import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useLayout } from "../hooks/useLayout";
import { rand } from "../utils/random";

/**
 * Warm, out-of-focus "kitchen / lifestyle" bokeh — placeholder for lifestyle B-roll
 * until you add a real clip (e.g. food sizzling in a pan).
 */
export const BokehPlaceholder: React.FC<{ colors?: string[]; background?: string; seed?: number }> = ({
  colors = ["#ffb347", "#ff7a45", "#ffd38a", "#ff9466"],
  background = "radial-gradient(ellipse at 50% 60%, #5a2a14 0%, #1d0c06 80%)",
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, px } = useLayout();
  const dots = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        x: rand(`bx${seed}${i}`, 0, 1),
        y: rand(`by${seed}${i}`, 0, 1),
        r: rand(`br${seed}${i}`, 40, 180),
        c: colors[i % colors.length],
        sp: rand(`bs${seed}${i}`, 0.2, 0.8),
        ph: rand(`bp${seed}${i}`, 0, 6.28),
      })),
    [colors, seed],
  );
  return (
    <AbsoluteFill style={{ background }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x * width + Math.sin(frame / 50 + d.ph) * px(40),
            top: d.y * height - ((frame * d.sp * px(1)) % px(80)),
            width: px(d.r),
            height: px(d.r),
            borderRadius: "50%",
            background: d.c,
            opacity: 0.18 + 0.15 * Math.sin(frame / 30 + d.ph),
            filter: `blur(${px(d.r * 0.12)}px)`,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
