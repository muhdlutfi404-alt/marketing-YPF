import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/** Circular progress ring (e.g. "98% satisfied", or a numbered step indicator). */
export const ProgressRing: React.FC<{
  size: number;
  stroke: number;
  /** 0 – 100 */
  value: number;
  color: string;
  trackColor?: string;
  delay?: number;
  durationInFrames?: number;
  children?: React.ReactNode;
}> = ({ size, stroke, value, color, trackColor = "rgba(255,255,255,0.15)", delay = 0, durationInFrames = 40, children }) => {
  const frame = useCurrentFrame();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = interpolate(frame - delay, [0, durationInFrames], [0, value / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
};
