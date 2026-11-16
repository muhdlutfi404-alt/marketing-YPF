import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { noise2D } from "@remotion/noise";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { AnimatedCounter } from "../../../shared/infographics/AnimatedCounter";
import { CinematicZoom } from "../../../shared/components/CinematicZoom";
import { SfxTrack } from "../../../shared/audio/SoundEffect";
import { useLayout } from "../../../shared/hooks/useLayout";
import { smoothPath } from "../../../shared/utils/smoothPath";
import { AM_THEME } from "../theme";

export type Waypoint = { label: string; x: number; y: number };

/**
 * Animated expedition map: topographic background, a route that draws itself,
 * waypoints that pop in as the explorer marker passes, and a distance counter.
 * Waypoint x/y are 0–1 inside the map area, so the same route works in 16:9 and 9:16.
 */
export const MapRoute: React.FC<{
  title: string;
  waypoints: Waypoint[];
  distanceKm: number;
  durationInFrames: number;
  sfxVolume?: number;
}> = ({ title, waypoints, distanceKm, durationInFrames, sfxVolume = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height, px, safe, isVertical } = useLayout();
  const { colors, fonts } = AM_THEME;

  // Map area inside the frame
  const area = isVertical
    ? { x: safe.left, y: height * 0.27, w: width - safe.left - safe.right, h: height * 0.42 }
    : { x: width * 0.08, y: height * 0.2, w: width * 0.84, h: height * 0.62 };

  const pts = useMemo(() => waypoints.map((w) => ({ x: area.x + w.x * area.w, y: area.y + w.y * area.h })), [waypoints, area.x, area.y, area.w, area.h]);
  const d = useMemo(() => smoothPath(pts), [pts]);
  const total = useMemo(() => getLength(d), [d]);
  // Length along the path at which each waypoint is reached
  const stops = useMemo(() => pts.map((_, i) => (i === 0 ? 0 : getLength(smoothPath(pts.slice(0, i + 1))))), [pts]);

  const drawStart = 20;
  const drawEnd = durationInFrames - 40;
  const progress = interpolate(frame, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const evolved = evolvePath(progress, d);
  const tip = getPointAtLength(d, Math.max(0.01, total * progress)) ?? pts[0];

  // Frame at which each waypoint is reached (inverse of the easing, sampled)
  const reachFrame = (lengthAt: number) => {
    for (let f = drawStart; f <= drawEnd; f++) {
      const pr = interpolate(f, [drawStart, drawEnd], [0, 1], { easing: Easing.inOut(Easing.quad) });
      if (pr * total >= lengthAt - 0.5) return f;
    }
    return drawEnd;
  };
  const reach = stops.map(reachFrame);

  // Topographic contour lines
  const contours = useMemo(() => {
    const lines: string[] = [];
    const count = isVertical ? 34 : 22;
    for (let i = 0; i < count; i++) {
      const baseY = (i / count) * height;
      let path = "";
      for (let s = 0; s <= 40; s++) {
        const x = (s / 40) * width;
        const y = baseY + noise2D("topo", s / 8, i / 3) * px(60);
        path += `${s === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      lines.push(path);
    }
    return lines;
  }, [width, height, isVertical, px]);

  const card = spring({ frame: frame - 10, fps, config: { damping: 200 }, durationInFrames: 25 });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #23281f 0%, ${colors.ink} 75%)` }}>
      <CinematicZoom durationInFrames={durationInFrames} amount={0.08} direction="in" pan={{ x: -1, y: 0.5 }}>
        <svg width={width} height={height}>
          {contours.map((c, i) => (
            <path key={i} d={c} stroke={colors.bone} strokeOpacity={i % 5 === 0 ? 0.14 : 0.06} strokeWidth={i % 5 === 0 ? 2 : 1} fill="none" />
          ))}
          {/* full route, faint & dashed */}
          <path d={d} stroke={colors.bone} strokeOpacity={0.25} strokeWidth={px(3)} strokeDasharray={`${px(4)} ${px(14)}`} fill="none" strokeLinecap="round" />
          {/* travelled route */}
          <path
            d={d}
            stroke={colors.ember}
            strokeWidth={px(7)}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={evolved.strokeDasharray}
            strokeDashoffset={evolved.strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 ${px(10)}px ${colors.ember})` }}
          />
          {pts.map((p, i) => {
            const s = spring({ frame: frame - reach[i], fps, config: { damping: 9, stiffness: 160 } });
            const isLast = i === pts.length - 1;
            const labelBelow = p.y < area.y + area.h * 0.25;
            return (
              <g key={i} transform={`translate(${p.x} ${p.y})`} opacity={Math.min(1, s * 2)}>
                <circle r={px(isLast ? 22 : 14) * s} fill={isLast ? colors.ember : colors.bone} stroke={colors.ink} strokeWidth={px(4)} />
                <text
                  y={labelBelow ? px(64) : -px(34)}
                  textAnchor={p.x < width * 0.18 ? "start" : p.x > width * 0.82 ? "end" : "middle"}
                  x={p.x < width * 0.18 ? -px(18) : p.x > width * 0.82 ? px(18) : 0}
                  fill={colors.bone}
                  fontFamily={fonts.body}
                  fontWeight={700}
                  fontSize={px(isVertical ? 30 : 26)}
                  letterSpacing={px(2)}
                  style={{ paintOrder: "stroke", stroke: colors.ink, strokeWidth: px(6) }}
                >
                  {waypoints[i].label.toUpperCase()}
                </text>
              </g>
            );
          })}
          {/* explorer marker with pulse */}
          {progress > 0 ? (
            <g transform={`translate(${tip.x} ${tip.y})`}>
              <circle r={px(20) + (frame % 30) * px(1.2)} fill="none" stroke={colors.ember} strokeOpacity={1 - (frame % 30) / 30} strokeWidth={px(3)} />
              <circle r={px(10)} fill="#fff" />
            </g>
          ) : null}
        </svg>
      </CinematicZoom>

      {/* Title + distance */}
      <div style={{ position: "absolute", left: safe.left, top: isVertical ? safe.top : px(90), opacity: card }}>
        <AnimatedText text="THE ROUTE" mode="fade" delay={6} style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: px(isVertical ? 32 : 26), letterSpacing: px(8), color: colors.ember }} />
        <AnimatedText text={title} mode="rise" delay={10} style={{ fontFamily: fonts.display, fontSize: px(isVertical ? 110 : 96), color: colors.bone, lineHeight: 1 }} />
      </div>
      <div
        style={{
          position: "absolute",
          ...(isVertical ? { left: safe.left, bottom: safe.bottom - px(60) } : { right: safe.right, bottom: px(110) }),
          textAlign: isVertical ? "left" : "right",
          opacity: card,
        }}
      >
        <div style={{ fontFamily: fonts.body, fontSize: px(26), letterSpacing: px(6), color: colors.dim }}>DISTANCE</div>
        <AnimatedCounter
          to={distanceKm * progress}
          decimals={1}
          durationInFrames={1}
          suffix=" KM"
          style={{ fontFamily: fonts.display, fontSize: px(isVertical ? 140 : 120), color: colors.bone, lineHeight: 1 }}
        />
      </div>
      <SfxTrack masterVolume={sfxVolume} cues={reach.map((at, i) => ({ sfx: "pop", at, volume: i === reach.length - 1 ? 0.9 : 0.55, playbackRate: 0.9 + i * 0.06 }))} />
    </AbsoluteFill>
  );
};
