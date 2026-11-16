import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveMedia } from "../../shared/utils/media";
import { zoomScaleAt, type ClipInfo, type Focus, type Zoom } from "../engine";
import { FramedVideo } from "../FramedVideo";
import { FootageGradeLayer } from "../grades";

/**
 * B-ROLL CUTAWAY — your REAL secondary footage (product, cooking, location) shown
 * over the presenter's voice. The voice keeps playing underneath (documentary L-cut).
 * Its own sound is muted by default; set props.volume (e.g. 0.25) to keep some ambience.
 */
export const Broll: React.FC<{
  dur: number;
  clip: ClipInfo | undefined;
  grade: string;
  gradeIntensity: number;
  props: { card?: { plate: string; tilt?: number }; clip?: string; image?: string; in?: number; focus?: Focus; zooms?: Zoom[]; volume?: number; transition?: "cut" | "fade" | "flash" | "zoom-punch" | "slide"; breathing?: number };
}> = ({ dur, clip, grade, gradeIntensity, props }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  if (!clip && !props.image) return null;
  const events = (props.zooms ?? []).filter((z) => typeof z.at === "number").map((z) => ({ ...z, at: z.at as number }));
  const scale = zoomScaleAt(t, events, dur / fps, props.breathing ?? 0.06);
  const tin = Math.min(8, dur / 3);
  const p = interpolate(frame, [0, tin], [0, 1], { extrapolateRight: "clamp" });
  const tr = props.transition ?? "cut";
  const style: React.CSSProperties =
    tr === "fade"
      ? { opacity: p }
      : tr === "slide"
        ? { transform: `translateX(${(1 - p) * 100}%)` }
        : tr === "zoom-punch"
          ? { transform: `scale(${interpolate(p, [0, 1], [1.25, 1])})`, opacity: Math.min(1, p * 2), filter: `blur(${(1 - p) * 10}px)` }
          : {};
  const vol = props.volume ?? 0;
  if (props.card) {
    // REAL footage/photo presented as a floating card over a (generated) backdrop
    const pop = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
    const tilt = (props.card.tilt ?? -4) * (1 - pop * 0.5) + Math.sin(frame / 30) * 0.6;
    const media = props.image ? (
      <Img src={resolveMedia(props.image)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
    ) : (
      <FramedVideo clip={clip!} trimBeforeSec={props.in ?? 0} focus={props.focus} scale={scale} muted fps={fps} frameWidth={860} frameHeight={1180} />
    );
    return (
      <AbsoluteFill>
        <AbsoluteFill>
          <Img src={resolveMedia(props.card.plate)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(10px) brightness(0.75)", transform: `scale(${1.1 + frame / fps * 0.01})` }} />
        </AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1600 }}>
          <div style={{ width: 860, height: 1180, marginTop: -160, borderRadius: 34, overflow: "hidden", position: "relative", boxShadow: "0 50px 90px rgba(0,0,0,0.55), 0 0 0 3px rgba(255,255,255,0.18)", transform: `rotateY(${tilt}deg) rotateX(2deg) scale(${0.86 + 0.14 * pop})`, opacity: pop }}>
            <FootageGradeLayer grade={grade} intensity={gradeIntensity}>{media}</FootageGradeLayer>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={style}>
      <FootageGradeLayer grade={grade} intensity={gradeIntensity}>
        {props.image ? (
          <AbsoluteFill style={{ overflow: "hidden" }}>
            <Img
              src={resolveMedia(props.image)}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${(props.focus?.x ?? 0.5) * 100}% ${(props.focus?.y ?? 0.5) * 100}%`, transform: `scale(${scale})`, transformOrigin: `${(props.focus?.x ?? 0.5) * 100}% ${(props.focus?.y ?? 0.5) * 100}%` }}
            />
          </AbsoluteFill>
        ) : (
        <FramedVideo
          clip={clip!}
          trimBeforeSec={props.in ?? 0}
          focus={props.focus}
          scale={scale}
          muted={vol === 0}
          volume={(f) => vol * interpolate(f, [0, 6, dur - 6, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          fps={fps}
          frameWidth={width}
          frameHeight={height}
        />
        )}
      </FootageGradeLayer>
      {tr === "flash" ? <AbsoluteFill style={{ background: "#fff", opacity: interpolate(frame, [0, 2, 7], [0.9, 0.9, 0], { extrapolateRight: "clamp" }) }} /> : null}
    </AbsoluteFill>
  );
};
