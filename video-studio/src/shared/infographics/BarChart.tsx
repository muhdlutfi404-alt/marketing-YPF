import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedCounter } from "./AnimatedCounter";

export type BarDatum = { label: string; value: number; color?: string };

/**
 * Animated bar chart. Horizontal bars read best on phones (vertical video),
 * so `orientation="horizontal"` is the default.
 */
export const BarChart: React.FC<{
  data: BarDatum[];
  width: number;
  barThickness: number;
  gap: number;
  color: string;
  trackColor?: string;
  labelColor?: string;
  font: string;
  labelSize: number;
  valueSuffix?: string;
  delay?: number;
  stagger?: number;
  maxValue?: number;
}> = ({ data, width, barThickness, gap, color, trackColor = "rgba(255,255,255,0.12)", labelColor = "#fff", font, labelSize, valueSuffix = "", delay = 0, stagger = 8, maxValue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap }}>
      {data.map((d, i) => {
        const start = delay + i * stagger;
        const p = spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 90 } });
        return (
          <div key={d.label} style={{ fontFamily: font, color: labelColor }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: labelSize, marginBottom: labelSize * 0.35, opacity: Math.min(1, p * 2) }}>
              <span style={{ fontWeight: 600 }}>{d.label}</span>
              <AnimatedCounter to={d.value} delay={start} durationInFrames={40} suffix={valueSuffix} style={{ fontWeight: 800 }} />
            </div>
            <div style={{ height: barThickness, background: trackColor, borderRadius: barThickness / 2, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(d.value / max) * 100 * Math.min(1, p)}%`,
                  background: d.color ?? color,
                  borderRadius: barThickness / 2,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
