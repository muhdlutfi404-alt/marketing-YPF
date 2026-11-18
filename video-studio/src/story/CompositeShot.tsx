import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { resolveMedia } from "../shared/utils/media";
import { resolveZoomTime, zoomScaleAt, type ClipInfo, type ResolvedShot, type TimelineWord } from "./engine";
import { FramedVideo } from "./FramedVideo";

/**
 * CINEMATIC COMPOSITE — the REAL presenter + REAL product (cut out by scripts/story/matte.py,
 * pixels untouched) placed in a generated environment.
 *
 *   back  → BackgroundPart : generated plate (soft focus, parallax), atmosphere, contact shadow
 *   (text "behind" the subject is rendered by StoryEdit between the two parts)
 *   front → ForegroundPart : the transparent foreground video + rim light + front particles
 *
 * The subject only receives a GLOBAL light/colour match (exposure, warmth, saturation —
 * limits enforced by the safety check). No face or body edits exist in this system.
 */
export type CompositeSpec = {
  plate: string; // path inside /public (generated/<project>/<name>.png)
  fg: { src: string; from: number }; // transparent foreground video + the clip time it starts at
  dof?: number; // background blur in px (depth of field)
  plateTint?: string; // colour wash over the plate to match the grade
  plateBrightness?: number;
  light?: { exposure?: number; warmth?: number; saturation?: number };
  rim?: string; // rim-light colour around the subject (outside the subject only)
  shadow?: boolean; // contact shadow under the subject/product
  atmosphere?: "frost" | "warm" | "none";
  parallax?: number; // 0 = background moves with the subject, 1 = background still
  /** SET EXTENSION: darken only the real floor below this height (0–1 of the source frame) so it sits in the new light */
  floorShadeFrom?: number;
  floorShade?: number;
  matteStats?: { t: number; bottom?: number; left?: number; right?: number }[];
  /** grade filter applied identically to background and cut-out (so they match) */
  gradeFilter?: string;
};

const useShotScale = (shot: ResolvedShot, words: TimelineWord[], breathing: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const events = (shot.zooms ?? [])
    .map((z) => ({ ...z, at: resolveZoomTime(z, shot, words) }))
    .filter((z): z is typeof z & { at: number } => z.at !== null);
  return zoomScaleAt(frame / fps, events, shot.duration, shot.breathing ?? breathing);
};

const enterStyle = (shot: ResolvedShot, frame: number, fps: number): React.CSSProperties => {
  const tf = Math.round(shot.transitionSec * fps);
  if (tf <= 0) return {};
  const p = interpolate(frame, [0, tf], [0, 1], { extrapolateRight: "clamp" });
  const t = shot.transition?.type;
  if (t === "zoom-punch") return { transform: `scale(${interpolate(p, [0, 1], [1.3, 1])})`, opacity: Math.min(1, p * 2), filter: `blur(${(1 - p) * 12}px)` };
  if (t === "frost-dissolve") return { opacity: p, filter: `blur(${(1 - p) * 18}px)` };
  return { opacity: p };
};

/* ───────── atmosphere: light rays + drifting fog + fine particles ───────── */
const Atmosphere: React.FC<{ kind: "frost" | "warm"; front?: boolean }> = ({ kind, front }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const warm = kind === "warm";
  const dots = useMemo(
    () =>
      Array.from({ length: front ? 18 : 46 }, (_, i) => ({
        x: random(`ax${i}${front}`) * width,
        y: random(`ay${i}${front}`) * height,
        r: (front ? 3 : 1.2) + random(`ar${i}${front}`) * (front ? 5 : 2.4),
        s: 0.2 + random(`as${i}${front}`) * 0.8,
        p: random(`ap${i}${front}`) * 6.28,
      })),
    [front, width, height],
  );
  const c = warm ? "255,200,140" : "200,230,255";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {!front ? (
        <>
          {/* volumetric light rays from above */}
          <AbsoluteFill
            style={{
              background: `conic-gradient(from 180deg at ${50 + Math.sin(frame / 90) * 6}% -10%, transparent 0deg, rgba(${c},0.10) 8deg, transparent 16deg, rgba(${c},0.07) 24deg, transparent 34deg, rgba(${c},0.09) 330deg, transparent 340deg)`,
              mixBlendMode: "screen",
            }}
          />
          {/* low fog */}
          <AbsoluteFill style={{ background: `linear-gradient(0deg, rgba(${c},${warm ? 0.10 : 0.22}) 0%, transparent 38%)`, transform: `translateX(${Math.sin(frame / 70) * 30}px)` }} />
        </>
      ) : null}
      {dots.map((d, i) => {
        const y = (d.y - frame * d.s * (warm ? 0.6 : 1.1) + height * 2) % height;
        const x = d.x + Math.sin(frame / 40 + d.p) * 20;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: d.r * 2,
              height: d.r * 2,
              borderRadius: "50%",
              background: `rgba(${c},${front ? 0.22 : 0.55})`,
              filter: front ? "blur(4px)" : "blur(0.6px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Background half of a composite shot: generated plate + atmosphere + contact shadow. */
export const CompositeBackground: React.FC<{ shot: ResolvedShot; spec: CompositeSpec; words: TimelineWord[]; breathing: number; clip: ClipInfo }> = ({ shot, spec, words, breathing, clip }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = useShotScale(shot, words, breathing);
  const par = spec.parallax ?? 0.6;
  const bgScale = 1.08 + (scale - 1) * (1 - par) + frame / fps * 0.004; // slow independent drift
  const focus = shot.focus ?? { x: 0.5, y: 0.5 };

  // contact shadow from the matte statistics (subject+product bottom edge at this moment)
  const tClip = shot.in + frame / fps;
  const st = spec.matteStats?.reduce((best, s) => (Math.abs(s.t - tClip) < Math.abs(best.t - tClip) ? s : best), spec.matteStats[0]);
  // map source-frame coords → screen (same framing maths as FramedVideo, scaled around the focus)
  const srcAR = clip.width / clip.height;
  const w = srcAR > width / height ? height * srcAR : width;
  const h = srcAR > width / height ? height : width / srcAR;
  const left0 = -(w - width) * focus.x;
  const top0 = -(h - height) * focus.y;
  const toScreen = (x: number, y: number) => ({
    x: focus.x * width + (left0 + x * w - focus.x * width) * scale,
    y: focus.y * height + (top0 + y * h - focus.y * height) * scale,
  });

  if (spec.plate === "original") {
    // depth layering over the REAL footage: same frame, same zoom as the cut-out in front
    return (
      <AbsoluteFill style={{ background: "#000", ...enterStyle(shot, frame, fps) }}>
        <AbsoluteFill style={{ filter: spec.gradeFilter }}>
          <FramedVideo clip={clip} trimBeforeSec={shot.in} focus={shot.focus} scale={scale} muted fps={fps} frameWidth={width} frameHeight={height} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#05070c", ...enterStyle(shot, frame, fps) }}>
      <AbsoluteFill style={{ transform: `scale(${bgScale})`, transformOrigin: `${focus.x * 100}% ${focus.y * 100}%` }}>
        <Img
          src={resolveMedia(spec.plate)}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: `blur(${spec.dof ?? 6}px) brightness(${spec.plateBrightness ?? 0.85}) saturate(1.05)` }}
        />
      </AbsoluteFill>
      {spec.plateTint ? <AbsoluteFill style={{ background: spec.plateTint, mixBlendMode: "soft-light" }} /> : null}
      {spec.atmosphere && spec.atmosphere !== "none" ? <Atmosphere kind={spec.atmosphere} /> : null}
      {spec.shadow && st?.bottom !== undefined && st.left !== undefined && st.right !== undefined
        ? (() => {
            const a = toScreen(st.left!, st.bottom!);
            const b = toScreen(st.right!, st.bottom!);
            const sw = (b.x - a.x) * 1.08;
            return (
              <div
                style={{
                  position: "absolute",
                  left: a.x - sw * 0.04,
                  top: a.y - 26 * scale,
                  width: sw,
                  height: 70 * scale,
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 45%, transparent 72%)",
                  filter: "blur(10px)",
                }}
              />
            );
          })()
        : null}
      {/* vignette inside the environment for depth */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Foreground half: the REAL subject (transparent video, pixels untouched) + rim light + front particles. */
export const CompositeForeground: React.FC<{ shot: ResolvedShot; next?: ResolvedShot; spec: CompositeSpec; words: TimelineWord[]; breathing: number; clip: ClipInfo }> = ({ shot, next, spec, words, breathing, clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = useShotScale(shot, words, breathing);
  const dur = Math.round(shot.duration * fps);
  const L = spec.light ?? {};
  const id = `lm-${shot.id}`;
  const warm = L.warmth ?? 0;
  // global light match only (no local/face edits)
  const filter = `${spec.gradeFilter ? spec.gradeFilter + " " : ""}url(#${id}) brightness(${Math.pow(2, L.exposure ?? 0)}) saturate(${L.saturation ?? 1})${spec.rim ? ` drop-shadow(0 0 14px ${spec.rim})` : ""}`;
  const fadeIn = Math.max(2, Math.round(shot.transitionSec * fps));
  const fadeOut = Math.max(2, next ? Math.round(next.transitionSec * fps) : 2);
  const gain = Math.min(1, Math.pow(10, (shot.gainDb ?? 0) / 20));
  return (
    <AbsoluteFill style={enterStyle(shot, frame, fps)}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`${1 + warm * 0.08} 0 0 0 0  0 1 0 0 0  0 0 ${1 - warm * 0.1} 0 0  0 0 0 1 0`} />
        </filter>
      </svg>
      {/* the ORIGINAL voice, straight from the source clip */}
      {shot.audio !== "mute" ? (
        <Audio src={resolveMedia(clip.src)} trimBefore={Math.round(shot.in * fps)} volume={(f) => gain * interpolate(f, [0, fadeIn, dur - fadeOut, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      ) : null}
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${(shot.focus?.x ?? 0.5) * 100}% ${(shot.focus?.y ?? 0.5) * 100}%` }}>
        <OffthreadVideo
          src={resolveMedia(spec.fg.src)}
          transparent
          muted
          trimBefore={Math.max(0, Math.round((shot.in - spec.fg.from) * fps))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${(shot.focus?.x ?? 0.5) * 100}% ${(shot.focus?.y ?? 0.5) * 100}%`, filter }}
        />
        {spec.floorShadeFrom !== undefined ? (
          // environment shadow on the real FLOOR only (starts below the product), moves with the zoom
          <div style={{ position: "absolute", left: 0, right: 0, top: `${spec.floorShadeFrom * 100}%`, bottom: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,${spec.floorShade ?? 0.45}) 55%, rgba(0,0,0,${(spec.floorShade ?? 0.45) + 0.15}) 100%)` }} />
        ) : null}
      </AbsoluteFill>
      {spec.atmosphere && spec.atmosphere !== "none" ? <Atmosphere kind={spec.atmosphere} front /> : null}
    </AbsoluteFill>
  );
};

/** Small, honest disclosure on scenes with AI-generated backgrounds. */
export const AiLabel: React.FC = () => (
  <div style={{ position: "absolute", top: 70, left: 46, fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: 24, letterSpacing: 2, color: "rgba(255,255,255,0.62)", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
    LATAR: VISUAL AI
  </div>
);
