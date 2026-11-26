import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { Audio } from "@remotion/media";
import { FONT_STACKS } from "../shared/fonts";
import { MusicBed } from "../shared/audio/MusicBed";
import { SfxTrack, type SfxCue } from "../shared/audio/SoundEffect";
import { SFX, type SfxName } from "../shared/audio/library";
import { FilmGrain, Vignette } from "../shared/components/CinematicLook";
import { FPS } from "../shared/constants";
import { resolveMedia } from "../shared/utils/media";
import { buildCaptionPages, type TimelineWord } from "./engine";
import { StoryCaptions } from "./StoryCaptions";
import { STORY_STYLES } from "./styles";
import { BRAND_STAGE } from "./Canvas";
import { YpfScene, sceneSfx, YPF } from "./scenes/ypf";

/**
 * ANIMATIC — story & timing draft for an animated video (character art + voice-over).
 *
 * Every pose scene shows the character art for that pose. Until a pose image is APPROVED,
 * the scene uses the master avatar and is clearly labelled "PLACEHOLDER", with the requested
 * pose shown as a small reference. Nothing here is a final render.
 */
export type AnimaticScene = {
  id: string;
  from: number; // seconds
  to: number;
  pose: number | null;
  poseTitle?: string;
  /** approved pose image (characters/...); when missing, the master is shown as a labelled placeholder */
  image?: string;
  /** small reference of the requested pose (from the storyboard collage) */
  poseRef?: string;
  bg: "dawn" | "morning" | "day" | "night" | "dusk" | "brand";
  character?: boolean;
  push?: number;
  /** camera framing on the character art (reference style: many short shots from one pose) */
  frame?: "wide" | "medium" | "face" | "hands";
  /** hard cut with a small punch instead of a fade (shots of the same scene) */
  cut?: boolean;
  /** transition INTO this shot: hard cut (default when cut), quick whip-slide, or white flash */
  trans?: "cut" | "whip" | "flash" | "zoom" | "iris";
  /** painted background plate (generated, no people/logos) instead of the flat gradient */
  plate?: string;
  /** colour grade for the whole shot: flashback (past), night, mono (freeze/interrupt), present */
  grade?: "flashback" | "night" | "mono" | "present";
  /** split-screen: two half-height shots (top, bottom) shown together */
  split?: AnimaticScene[];
  splitLabels?: [string, string];
  /** extra punch-in on this cut (emphasis), 0 = none */
  punch?: number;
  /** width/height of the art (for framing maths); default 1 (master) */
  aspect?: number;
  /** focus points on the art (0–1 of the image): face / hands; default = master avatar */
  focus?: { face?: [number, number]; hands?: [number, number] };
};
export type AnimaticLayer = { id: string; from: number; dur: number; kind: string; split?: boolean; rv?: number[]; props: Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
export type AnimaticProps = {
  title: string;
  duration: number;
  master: string;
  vo: { src: string; at: number };
  music: { src: string; volume: number; duckTo: number };
  words: { text: string; start: number; end: number }[];
  scenes: AnimaticScene[];
  layers: AnimaticLayer[];
  cues?: { sfx: string; at: number; volume?: number; playbackRate?: number }[];
  emphasis?: Record<string, "big" | "script">;
  /** show POSE / PLACEHOLDER labels (animatic) — off for an editing preview */
  labels?: boolean;
  /** small corner tag, e.g. "ANIMATIC · DRAF" or "PREVIEW" */
  tag?: string;
};

export const calculateAnimaticMetadata: CalculateMetadataFunction<AnimaticProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.ceil((props.duration ?? 10) * FPS)),
  fps: FPS,
  width: 1080,
  height: 1920,
});

const BG: Record<AnimaticScene["bg"], string> = {
  dawn: "linear-gradient(180deg, #1b2a55 0%, #4b4a7c 38%, #e98a5a 72%, #f7c27a 100%)",
  morning: "linear-gradient(180deg, #3f6f9e 0%, #8fb6da 50%, #dbe9f5 100%)",
  day: "linear-gradient(180deg, #4a6f94 0%, #9db8d2 52%, #e3ebf3 100%)",
  night: "linear-gradient(180deg, #03070f 0%, #081a33 60%, #0d2340 100%)",
  dusk: "linear-gradient(180deg, #2a1d4f 0%, #6e3b6b 40%, #e0735a 78%, #f3a35f 100%)",
  brand: BRAND_STAGE,
};
const GLOW: Record<AnimaticScene["bg"], string> = {
  dawn: "radial-gradient(40% 18% at 50% 70%, rgba(255,200,120,0.55), rgba(255,200,120,0))",
  morning: "radial-gradient(50% 30% at 70% 20%, rgba(255,255,255,0.6), rgba(255,255,255,0))",
  day: "radial-gradient(50% 30% at 50% 25%, rgba(255,255,255,0.55), rgba(255,255,255,0))",
  night: "radial-gradient(30% 20% at 75% 40%, rgba(255,190,110,0.35), rgba(255,190,110,0))",
  dusk: "radial-gradient(45% 20% at 50% 68%, rgba(255,170,100,0.5), rgba(255,170,100,0))",
  brand: "radial-gradient(60% 30% at 50% 40%, rgba(41,182,246,0.16), rgba(41,182,246,0))",
};

const Bokeh: React.FC<{ seed: string; light: boolean }> = ({ seed, light }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: light ? 0.35 : 0.5 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const r = (n: number) => {
          const x = Math.sin((i + 1) * 9301 + seed.length * 49297 + n * 233) * 43758.5453;
          return x - Math.floor(x);
        };
        const s = 60 + r(1) * 160;
        return (
          <div key={i} style={{ position: "absolute", left: r(2) * 1080 - s / 2 + Math.sin(frame / 90 + i) * 14, top: r(3) * 1100 - s / 2 + Math.cos(frame / 110 + i) * 10, width: s, height: s, borderRadius: "50%", background: light ? "rgba(255,255,255,0.55)" : "rgba(255,210,150,0.35)", filter: "blur(18px)" }} />
        );
      })}
    </AbsoluteFill>
  );
};

// character art area on screen (wide framing), bottom-aligned
const BOX = { x: -210, y: 520, w: 1500, h: 1400 };
const FRAMES: Record<NonNullable<AnimaticScene["frame"]>, { z: number; target: [number, number]; key: "face" | "hands" | "body" }> = {
  wide: { z: 1, target: [540, 1290], key: "body" },
  medium: { z: 1.35, target: [540, 1020], key: "body" },
  face: { z: 1.95, target: [540, 800], key: "face" },
  hands: { z: 1.7, target: [540, 1150], key: "hands" },
};

/** simple market-hall silhouettes behind the character, moving slower than the camera (parallax) */
const SetLayer: React.FC<{ bg: AnimaticScene["bg"]; z: number; frame: number }> = ({ bg, z, frame }) => {
  const dark = bg === "night" ? "rgba(0,0,0,0.35)" : bg === "dusk" || bg === "dawn" ? "rgba(40,20,50,0.35)" : "rgba(20,45,80,0.18)";
  const pz = 1 + (z - 1) * 0.22; // background zooms much less than the character → depth
  const drift = Math.sin(frame / 140) * 18;
  return (
    <AbsoluteFill style={{ transform: `translateX(${drift}px) scale(${pz})`, transformOrigin: "50% 60%" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* roof beams */}
        {[0, 1, 2, 3, 4].map((i) => <line key={`b${i}`} x1={-100 + i * 320} y1={0} x2={240 + i * 260} y2={520} stroke={dark} strokeWidth={14} />)}
        <rect x={0} y={500} width={1080} height={18} fill={dark} />
        {/* stall counters / shelves */}
        {[0, 1, 2, 3].map((i) => (
          <g key={`s${i}`} opacity={0.9}>
            <rect x={i * 290 - 40} y={980 + (i % 2) * 40} width={240} height={420} rx={8} fill={dark} />
            {[0, 1, 2].map((k) => <rect key={k} x={i * 290 - 30} y={1010 + (i % 2) * 40 + k * 110} width={220} height={10} fill="rgba(255,255,255,0.12)" />)}
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** moving light: rays at dawn/dusk, lamp flicker at night, soft sweep by day */
const LightLayer: React.FC<{ bg: AnimaticScene["bg"]; frame: number; dur: number }> = ({ bg, frame, dur }) => {
  if (bg === "night")
    return <AbsoluteFill style={{ background: `radial-gradient(38% 26% at 72% 42%, rgba(255,190,110,${0.28 + 0.05 * Math.sin(frame / 7)}), rgba(255,190,110,0))` }} />;
  const sweep = interpolate(frame, [0, Math.max(1, dur)], [-30, 130]);
  const warm = bg === "dawn" || bg === "dusk";
  return (
    <>
      {warm ? (
        <AbsoluteFill style={{ opacity: 0.55, mixBlendMode: "screen", background: `repeating-conic-gradient(from ${200 + Math.sin(frame / 60) * 4}deg at 50% 78%, rgba(255,200,130,0.22) 0deg 5deg, rgba(255,200,130,0) 5deg 14deg)` }} />
      ) : null}
      <AbsoluteFill style={{ mixBlendMode: "soft-light", background: `linear-gradient(110deg, transparent ${sweep - 25}%, rgba(255,255,255,0.35) ${sweep}%, transparent ${sweep + 25}%)` }} />
    </>
  );
};

const PoseScene: React.FC<{ scene: AnimaticScene; master: string; dur: number; labels: boolean }> = ({ scene, master, dur, labels }) => {
  const frame = useCurrentFrame();
  // scene transitions: soft slide + blur in, fade out; cuts inside a scene: hard cut with a small punch
  const trans = scene.trans ?? (scene.cut ? "cut" : "fade");
  const tIn = trans === "fade" ? interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) : 1;
  const fadeOut = trans === "fade" && !scene.cut ? interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const whip = trans === "whip" ? interpolate(frame, [0, 5], [1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;
  const flash = trans === "flash" ? interpolate(frame, [0, 5], [1, 0], { extrapolateRight: "clamp" }) : 0;
  const ramp = trans === "zoom" ? interpolate(frame, [0, 7], [1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0; // speed-ramp zoom in
  const iris = trans === "iris" ? interpolate(frame, [0, 9], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }) : 1;
  const GRADE: Record<string, string> = { flashback: "sepia(0.22) saturate(0.86) contrast(1.06)", night: "saturate(0.85) hue-rotate(-8deg) brightness(0.92) contrast(1.05)", mono: "grayscale(1) contrast(1.15)", present: "saturate(1.08) contrast(1.04)" };
  const punch = 1 + (scene.punch ?? (scene.cut ? 0.03 : 0)) * Math.max(0, 1 - frame / 6);
  const push = (1 + (scene.push ?? 0.04) * (frame / Math.max(1, dur))) * punch;
  const breathe = 1 + 0.005 * Math.sin(frame / 22);
  const fr = FRAMES[scene.frame ?? "wide"];
  // where the art sits inside the box (contain, bottom-aligned)
  const aspect = scene.aspect ?? 1;
  const iw = Math.min(BOX.w, BOX.h * aspect), ih = iw / aspect;
  const ix = BOX.x + (BOX.w - iw) / 2, iy = BOX.y + BOX.h - ih;
  const fp: [number, number] = fr.key === "face" ? scene.focus?.face ?? [0.48, 0.17] : fr.key === "hands" ? scene.focus?.hands ?? [0.3, 0.66] : [0.5, fr.z > 1 ? 0.4 : 0.6];
  const P = [ix + fp[0] * iw, iy + fp[1] * ih];
  const z = fr.z * push * breathe;
  const isWide = (scene.frame ?? "wide") === "wide";
  const tx = isWide ? 0 : fr.target[0] - P[0] * z;
  // never show the art's bottom edge (art is cropped at the waist): keep it below the frame
  const ty = isWide ? 0 : Math.max(fr.target[1] - P[1] * z, 1920 - (iy + ih) * z);
  const placeholder = !scene.image;
  const light = scene.bg === "morning" || scene.bg === "day";
  return (
    <AbsoluteFill style={{ opacity: Math.min(tIn, fadeOut), filter: [scene.grade ? GRADE[scene.grade] : "", tIn < 1 || whip > 0 || ramp > 0 ? `blur(${(1 - tIn) * 10 + whip * 14 + ramp * 8}px)` : ""].join(" ").trim() || undefined, transform: tIn < 1 ? `translateX(${(1 - tIn) * 60}px)` : whip > 0 ? `translateX(${whip * 1080}px)` : ramp > 0 ? `scale(${1 + ramp * 0.35})` : undefined }}>
      <AbsoluteFill style={{ background: BG[scene.bg] }} />
      {scene.plate ? (
        // painted plate, softly out of focus, moving slower than the character (parallax depth)
        <AbsoluteFill style={{ transform: `translate(${tx * -0.04}px, ${ty * -0.03}px) scale(${1.08 + (z - 1) * 0.18 + frame * 0.0004})`, transformOrigin: "50% 55%" }}>
          <Img src={resolveMedia(scene.plate)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `blur(${isWide ? 3 : 7}px) ${scene.bg === "night" ? "brightness(0.42) saturate(0.7) hue-rotate(10deg)" : scene.bg === "dusk" ? "brightness(0.8) sepia(0.45) saturate(1.3) hue-rotate(-12deg)" : scene.bg === "dawn" ? "brightness(0.85) sepia(0.25) saturate(1.1)" : "brightness(0.92)"}` }} />
        </AbsoluteFill>
      ) : (
        <SetLayer bg={scene.bg} z={z} frame={frame} />
      )}
      <AbsoluteFill style={{ background: GLOW[scene.bg] }} />
      <Bokeh seed={scene.id} light={light} />
      {/* readable text zone at the top */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,24,47,0.62) 0%, rgba(6,24,47,0.35) 22%, rgba(6,24,47,0) 40%)" }} />
      {scene.character !== false ? (
        <AbsoluteFill style={{ transform: isWide ? `scale(${push * breathe})` : `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: isWide ? "50% 100%" : "0 0" }}>
          <Img
            src={resolveMedia(scene.image ?? master)}
            style={{
              position: "absolute", left: ix, top: iy, width: iw, height: ih,
              // white "sticker" outline (reference style) + scene lighting
              filter: `drop-shadow(0 0 0 #fff) drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff) drop-shadow(0 18px 30px rgba(0,0,0,0.35))${scene.bg === "night" ? " brightness(0.8) saturate(0.9)" : scene.bg === "dusk" || scene.bg === "dawn" ? " sepia(0.1) saturate(1.05)" : ""}`,
            }}
          />
        </AbsoluteFill>
      ) : null}
      {scene.character !== false ? <LightLayer bg={scene.bg} frame={frame} dur={dur} /> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
      {/* iris reveal as an overlay (a clip-path on the scaled art makes Chrome rasterise it soft) */}
      {iris < 1 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(0,0,0,0) ${iris * 115}%, #04101f ${iris * 115 + 0.5}%)` }} /> : null}
      {labels && scene.pose ? (
        <>
          <div style={{ position: "absolute", top: 70, left: 40, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: FONT_STACKS.montserrat, fontWeight: 900, fontSize: 30, color: "#fff", background: placeholder ? "#ff4d2e" : "#2e9e5b", padding: "6px 16px", borderRadius: 10 }}>POSE {scene.pose}</div>
            <div style={{ fontFamily: FONT_STACKS.montserrat, fontWeight: 800, fontSize: 24, color: "#fff", background: "rgba(6,24,47,0.75)", padding: "6px 14px", borderRadius: 10 }}>
              {placeholder ? "PLACEHOLDER · master sementara" : "POSE DILULUSKAN"}
            </div>
          </div>
          {placeholder && scene.poseRef ? (
            <div style={{ position: "absolute", left: 40, top: 1420, width: 170, background: "rgba(6,24,47,0.85)", borderRadius: 14, padding: 8, border: "2px dashed rgba(255,255,255,0.6)" }}>
              <Img src={resolveMedia(scene.poseRef)} style={{ width: "100%", borderRadius: 8, display: "block" }} />
              <div style={{ fontFamily: FONT_STACKS.montserrat, fontWeight: 800, fontSize: 18, color: "#fff", textAlign: "center", marginTop: 6, lineHeight: 1.15 }}>RUJUKAN POSE {scene.pose}<br /><span style={{ fontWeight: 600, opacity: 0.8 }}>{scene.poseTitle}</span></div>
            </div>
          ) : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** two shots at once (e.g. "dalam masa yang sama"): each half shows the middle band of a full shot */
const SplitScene: React.FC<{ scene: AnimaticScene; master: string; dur: number }> = ({ scene, master, dur }) => {
  const frame = useCurrentFrame();
  const halves = scene.split ?? [];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {halves.map((h, i) => {
        const p = interpolate(frame - i * 4, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: i * 960, width: 1080, height: 960, overflow: "hidden", transform: `translateX(${(1 - p) * (i ? 1080 : -1080)}px)` }}>
            <div style={{ position: "absolute", left: 0, top: -480, width: 1080, height: 1920 }}>
              <PoseScene scene={{ ...h, cut: true, trans: "cut" }} master={master} dur={dur} labels={false} />
            </div>
            {scene.splitLabels ? (
              <div style={{ position: "absolute", left: 40, top: i ? 30 : 880, fontFamily: FONT_STACKS.montserrat, fontWeight: 900, fontSize: 40, letterSpacing: 6, color: "#fff", background: "rgba(6,24,47,0.7)", padding: "6px 18px", borderRadius: 10 }}>{scene.splitLabels[i]}</div>
            ) : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, top: 954, width: 1080, height: 12, background: "#fff" }} />
    </AbsoluteFill>
  );
};

/** title card, job cards, end card (all text/labels from the brief; unconfirmed items carry a visible label) */
const Card: React.FC<{ dur: number; kind: string; props: Record<string, any> }> = ({ dur, kind, props }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const H = FONT_STACKS.montserrat;
  const pending = (t: string) => (
    <div style={{ display: "inline-block", fontFamily: H, fontWeight: 900, fontSize: 22, color: YPF.navy, background: YPF.gold, padding: "4px 12px", borderRadius: 8, letterSpacing: 1 }}>{t}</div>
  );
  if (kind === "title")
    return (
      <AbsoluteFill style={{ opacity: Math.min(inP, out), alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 300, width: 1080, textAlign: "center", transform: `translateY(${(1 - inP) * 20}px)` }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: YPF.ice }}>DI SEBALIK PERJALANAN</div>
          <div style={{ fontFamily: H, fontWeight: 900, fontSize: 92, color: "#fff", lineHeight: 1, marginTop: 10 }}>{props.line2}</div>
          <div style={{ marginTop: 18 }}>{props.pending ? pending(props.pending) : null}</div>
        </div>
      </AbsoluteFill>
    );
  if (kind === "jobs") {
    const jobs: { title: string; sub?: string; points: string[] }[] = props.jobs ?? [];
    return (
      <AbsoluteFill style={{ opacity: out }}>
        <div style={{ position: "absolute", top: 150, width: 1080, textAlign: "center", opacity: inP }}>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: 34, letterSpacing: 8, color: YPF.ice }}>KAMI MENCARI</div>
          {props.confirmed ? null : <div style={{ marginTop: 10 }}>{pending("MAKLUMAT MENUNGGU PENGESAHAN")}</div>}
        </div>
        {jobs.map((j, i) => {
          const at = Math.round((props.at?.[i] ?? i * 2.5) * fps);
          const p = interpolate(frame - at, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "absolute", top: 300 + i * (props.big ? 760 : 640), left: 50, right: 50, opacity: p, transform: `translateX(${(1 - p) * (i ? 120 : -120)}px)`, borderRadius: 36, padding: props.big ? "40px 46px" : "34px 40px", background: "linear-gradient(180deg, rgba(205,238,255,0.16), rgba(205,238,255,0.05))", border: `3px solid ${i ? YPF.gold : YPF.ice}` }}>
              <div style={{ fontFamily: H, fontWeight: 900, fontSize: props.big ? 80 : 66, color: "#fff", lineHeight: 1 }}>{j.title}</div>
              {j.sub ? <div style={{ fontFamily: H, fontWeight: 800, fontSize: 38, color: YPF.gold, marginTop: 6 }}>{j.sub}</div> : null}
              <div style={{ marginTop: props.big ? 26 : 22, display: "grid", gap: props.big ? 16 : 12 }}>
                {j.points.map((pt, k) => (
                  <div key={k} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: H, fontWeight: 700, fontSize: props.big ? 42 : 34, lineHeight: 1.15, color: "#fff", opacity: interpolate(frame - at - 6 - k * 3, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                    <span style={{ color: YPF.gold, fontWeight: 900 }}>✓</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }
  // end card
  return (
    <AbsoluteFill style={{ opacity: Math.min(inP, out), alignItems: "center" }}>
      {props.wordmark ? (
        <div style={{ position: "absolute", top: 470, width: 1080, textAlign: "center", transform: `scale(${0.9 + 0.1 * inP})` }}>
          <div style={{ fontFamily: H, fontWeight: 900, fontSize: 120, color: "#fff", letterSpacing: -2, lineHeight: 1 }}>YaPakCik</div>
          <div style={{ fontFamily: H, fontWeight: 800, fontSize: 50, letterSpacing: 22, color: YPF.ice, marginTop: 6 }}>FROZEN</div>
        </div>
      ) : (
        <div style={{ position: "absolute", top: 420, width: 640, height: 300, left: 220, border: "4px dashed rgba(255,255,255,0.7)", borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontFamily: H, fontWeight: 900, fontSize: 44, color: "#fff" }}>LOGO RASMI</div>
          <div style={{ fontFamily: H, fontWeight: 700, fontSize: 28, color: YPF.ice, marginTop: 8 }}>YaPakCik Frozen · menunggu fail</div>
        </div>
      )}
      <div style={{ position: "absolute", top: 820, width: 1080, textAlign: "center" }}>
        <div style={{ fontFamily: H, fontWeight: 900, fontSize: 60, color: "#fff" }}>{props.headline ?? "JOM SERTAI KAMI"}</div>
        <div style={{ fontFamily: H, fontWeight: 700, fontSize: 36, color: YPF.ice, marginTop: 14 }}>Cara memohon:</div>
        <div style={{ marginTop: 14 }}>
          {props.wordmark ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "#25d366", padding: "16px 34px", borderRadius: 999, boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}>
              <span style={{ fontFamily: H, fontWeight: 900, fontSize: 54, color: "#fff", letterSpacing: 1 }}>{props.apply}</span>
            </div>
          ) : (
            pending(props.apply ?? "MENUNGGU PENGESAHAN")
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Animatic: React.FC<AnimaticProps> = (p) => {
  const fps = FPS;
  const f = (s: number) => Math.round(s * fps);
  const style = STORY_STYLES["yapakcik-frozen"];
  const pages = useMemo(() => {
    const words: TimelineWord[] = p.words.map((w) => ({ text: w.text, start: w.start, end: w.end, t0: w.start, t1: w.end, norm: w.text.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ""), shot: "vo", clip: "vo" }));
    return buildCaptionPages(words, { maxWords: 3, maxChars: 20, maxPageSec: 1.6 });
  }, [p.words]);
  // captions step aside while a graphic already shows the same spoken words big on screen
  const hideCaps = p.layers.filter((l) => l.kind === "title" || l.kind === "jobs" || l.kind === "endcard-placeholder" || l.kind === "icon" || l.props?.hideCaptions).map((l) => ({ from: l.from, to: l.from + l.dur }));
  const cues: SfxCue[] = [];
  p.scenes.forEach((s, i) => {
    if (i === 0) return;
    const tr = s.trans ?? (s.cut ? "cut" : "fade");
    if (tr === "whip") cues.push({ sfx: "whoosh", at: f(s.from) - 2, volume: 0.3, playbackRate: 1.4 });
    else if (tr === "flash") cues.push({ sfx: "impact", at: f(s.from), volume: 0.35, playbackRate: 1.3 });
    else if (tr === "zoom") cues.push({ sfx: "riser", at: Math.max(0, f(s.from) - 8), volume: 0.18, playbackRate: 2.2 });
    else if (tr === "iris") cues.push({ sfx: "shimmer", at: f(s.from), volume: 0.35 });
    else if (tr === "fade") cues.push({ sfx: "whoosh", at: f(s.from) - 3, volume: 0.2, playbackRate: 1.2 });
  });
  for (const l of p.layers) {
    if (["title", "jobs", "endcard-placeholder"].includes(l.kind)) {
      cues.push({ sfx: l.kind === "jobs" ? "riser" : "shimmer", at: Math.max(0, f(l.from) - (l.kind === "jobs" ? 30 : 0)), volume: 0.3 });
      continue;
    }
    for (const c of sceneSfx(l.kind, (l.rv ?? []).map((x) => f(x)), l.props, fps, f(l.dur))) if (c.sfx in SFX) cues.push({ sfx: c.sfx as SfxName, at: f(l.from) + c.at, volume: c.volume, playbackRate: c.playbackRate });
  }
  for (const c of p.cues ?? []) if (c.sfx in SFX) cues.push({ sfx: c.sfx as SfxName, at: f(c.at), volume: c.volume ?? 0.4, playbackRate: c.playbackRate });
  const voFrom = f(p.vo.at);
  const voDur = p.words.length ? f(p.words[p.words.length - 1].end) : 0;
  const duck = p.words.length ? [{ from: f(p.words[0].start) - 6, to: voDur + 6, level: p.music.duckTo }] : [];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {p.scenes.map((s) => (
        <Sequence key={s.id} from={f(s.from)} durationInFrames={Math.max(1, f(s.to - s.from))} name={`scene ${s.id}`} premountFor={fps}>
          {s.split ? <SplitScene scene={s} master={p.master} dur={f(s.to - s.from)} /> : <PoseScene scene={s} master={p.master} dur={f(s.to - s.from)} labels={p.labels ?? true} />}
        </Sequence>
      ))}
      <Vignette strength={0.35} />
      <FilmGrain opacity={0.05} />
      {p.layers.map((l) => (
        <Sequence key={l.id} from={f(l.from)} durationInFrames={Math.max(1, f(l.dur))} name={`${l.kind} ${l.id}`} premountFor={fps}>
          {["title", "jobs", "endcard-placeholder"].includes(l.kind) ? <Card dur={f(l.dur)} kind={l.kind} props={l.props} /> : <YpfScene dur={f(l.dur)} rv={(l.rv ?? []).map((x) => f(x))} props={{ ...l.props, kind: l.kind }} split={!!l.split} />}
        </Sequence>
      ))}
      <StoryCaptions pages={pages} style={style} variant="bold" uppercase position={0.72} wordGap="0.45em" hiddenRanges={hideCaps} emphasis={p.emphasis ?? {}} />
      <div style={{ position: "absolute", top: 70, right: 40, fontFamily: FONT_STACKS.montserrat, fontWeight: 900, fontSize: 24, color: "#fff", background: "rgba(6,24,47,0.75)", padding: "6px 14px", borderRadius: 10, letterSpacing: 2 }}>{p.tag ?? "ANIMATIC · DRAF"}</div>
      <Sequence from={voFrom} name="voice-over" layout="none">
        <Audio src={resolveMedia(p.vo.src)} />
      </Sequence>
      <MusicBed src={p.music.src} volume={p.music.volume} duck={duck} fadeInSec={1} fadeOutSec={3} />
      <SfxTrack cues={cues.filter((c) => c.at >= 0)} masterVolume={0.55} />
    </AbsoluteFill>
  );
};
