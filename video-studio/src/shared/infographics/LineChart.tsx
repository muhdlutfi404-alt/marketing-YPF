import React, { useId, useMemo } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { evolvePath, getPointAtLength, getLength } from "@remotion/paths";
import { smoothPath } from "../utils/smoothPath";

/**
 * A line chart that draws itself, with a filled area and a glowing marker at the tip.
 * Project A.M uses it as an elevation profile.
 */
export const LineChart: React.FC<{
  values: number[];
  width: number;
  height: number;
  color: string;
  fill?: string;
  strokeWidth?: number;
  delay?: number;
  durationInFrames?: number;
  /** Draw a dashed line + label at the highest point */
  markPeak?: { label: string; font: string; size: number; color: string };
}> = ({ values, width, height, color, fill = "rgba(255,255,255,0.1)", strokeWidth = 5, delay = 0, durationInFrames = 60, markPeak }) => {
  const frame = useCurrentFrame();
  const clipId = `line-reveal-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const { d, pts } = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = strokeWidth * 2;
    const points = values.map((v, i) => ({
      x: pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2),
      y: pad + (1 - (v - min) / range) * (height - pad * 2),
    }));
    return { d: smoothPath(points), pts: points };
  }, [values, width, height, strokeWidth]);

  const p = interpolate(frame - delay, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const evolved = evolvePath(p, d);
  const len = getLength(d);
  const tip = getPointAtLength(d, Math.max(0.01, len * p)) ?? pts[0];
  const peakIndex = values.indexOf(Math.max(...values));
  const peak = pts[peakIndex];
  const peakVisible = tip.x >= peak.x - 1;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={tip.x} height={height} />
        </clipPath>
      </defs>
      <path d={`${d} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`} fill={fill} clipPath={`url(#${clipId})`} />
      <path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />
      {markPeak && peakVisible ? (
        <g>
          <line x1={peak.x} y1={peak.y} x2={peak.x} y2={height} stroke={markPeak.color} strokeDasharray="6 8" strokeWidth={2} opacity={0.7} />
          <text x={peak.x} y={peak.y - markPeak.size * 0.9} fill={markPeak.color} fontFamily={markPeak.font} fontSize={markPeak.size} textAnchor="middle">
            {markPeak.label}
          </text>
        </g>
      ) : null}
      {p > 0 && p < 1 ? <circle cx={tip.x} cy={tip.y} r={strokeWidth * 2.2} fill={color} style={{ filter: `drop-shadow(0 0 ${strokeWidth * 2}px ${color})` }} /> : null}
    </svg>
  );
};
