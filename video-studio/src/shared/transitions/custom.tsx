import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

/**
 * Custom transitions built for the two brands.
 * Each one receives `presentationProgress` (0 → 1) and whether the scene is
 * "entering" (new scene) or "exiting" (old scene).
 */

// ── Flash: quick bright flash between shots (commercial energy / camera flash) ──
type FlashProps = { color?: string };
const FlashPresentation: React.FC<TransitionPresentationComponentProps<FlashProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p > 0.5 ? 1 : 0 }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: passedProps.color ?? "#fff", opacity: Math.sin(p * Math.PI) ** 1.5 }} />
    </AbsoluteFill>
  );
};
export const flash = (props: FlashProps = {}): TransitionPresentation<FlashProps> => ({
  component: FlashPresentation,
  props,
});

// ── Zoom punch: old scene rushes towards camera, new scene settles in ──
const ZoomPunchPresentation: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const entering = presentationDirection === "entering";
  const style: React.CSSProperties = entering
    ? { transform: `scale(${interpolate(p, [0, 1], [0.8, 1])})`, opacity: interpolate(p, [0.3, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), filter: `blur(${(1 - p) * 10}px)` }
    : { transform: `scale(${interpolate(p, [0, 1], [1, 1.6])})`, opacity: 1 - p, filter: `blur(${p * 14}px)` };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
export const zoomPunch = (): TransitionPresentation<Record<string, never>> => ({
  component: ZoomPunchPresentation,
  props: {},
});

// ── Light leak: warm film-burn style glow sweeping across (documentary feel) ──
type LightLeakProps = { colors?: [string, string] };
const LightLeakPresentation: React.FC<TransitionPresentationComponentProps<LightLeakProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const [a, b] = passedProps.colors ?? ["rgba(255,170,80,0.95)", "rgba(255,80,40,0.7)"];
  const x = interpolate(p, [0, 1], [-60, 60]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: interpolate(p, [0.25, 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 90% at ${50 + x}% 50%, ${a} 0%, ${b} 35%, transparent 70%)`,
          mixBlendMode: "screen",
          opacity: Math.sin(p * Math.PI),
          filter: "blur(20px)",
        }}
      />
    </AbsoluteFill>
  );
};
export const lightLeak = (props: LightLeakProps = {}): TransitionPresentation<LightLeakProps> => ({
  component: LightLeakPresentation,
  props,
});

// ── Frost dissolve: scenes blur & brighten through an icy haze (YaPakCik Frozen) ──
type FrostProps = { tint?: string };
const FrostPresentation: React.FC<TransitionPresentationComponentProps<FrostProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const entering = presentationDirection === "entering";
  const blur = entering ? (1 - p) * 24 : p * 24;
  const bright = entering ? 1 + (1 - p) * 0.6 : 1 + p * 0.6;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: `blur(${blur}px) brightness(${bright})`, opacity: entering ? p : 1 }}>{children}</AbsoluteFill>
      {entering ? (
        <AbsoluteFill style={{ background: passedProps.tint ?? "rgba(190,232,255,0.9)", opacity: Math.sin(p * Math.PI) * 0.55 }} />
      ) : null}
    </AbsoluteFill>
  );
};
export const frostDissolve = (props: FrostProps = {}): TransitionPresentation<FrostProps> => ({
  component: FrostPresentation,
  props,
});
