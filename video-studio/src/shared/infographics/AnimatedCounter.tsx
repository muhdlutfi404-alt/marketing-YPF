import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/** Number that counts up/down — e.g. "0 → 2,450 m", "RM 0.00 → RM 12.90", "25°C → -18°C". */
export const AnimatedCounter: React.FC<{
  from?: number;
  to: number;
  delay?: number;
  durationInFrames?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
  thousandsSeparator?: boolean;
}> = ({ from = 0, to, delay = 0, durationInFrames = 45, decimals = 0, prefix = "", suffix = "", style, thousandsSeparator = true }) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame - delay, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const text = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: thousandsSeparator,
  });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};
