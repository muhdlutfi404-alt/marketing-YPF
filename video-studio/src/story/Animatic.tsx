import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
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

// character box on screen (wide framing): 1260×1260, bottom-aligned
const BOX = { x: -90, y: 660, w: 1260, h: 1260 };
const FRAMES: Record<NonNullable<AnimaticScene["frame"]>, { z: number; target: [number, number]; key: "face" | "hands" | "body" }> = {
  wide: { z: 1, target: [540, 1290], key: "body" },
  medium: { z: 1.45, target: [540, 1010], key: "body" },
  face: { z: 2.2, target: [540, 790], key: "face" },
  hands: { z: 1.9, target: [540, 1160], key: "hands" },
};
const PoseScene: React.FC<{ scene: AnimaticScene; master: string; dur: number }> = ({ scene, master, dur }) => {
  const frame = useCurrentFrame();
  const fadeIn = scene.cut ? 1 : interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = scene.cut ? 1 : interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const punch = scene.cut ? 1 + 0.06 * Math.max(0, 1 - frame / 6) : 1;
  const push = (1 + (scene.push ?? 0.04) * (frame / Math.max(1, dur))) * punch;
  const breathe = 1 + 0.006 * Math.sin(frame / 22);
  const fr = FRAMES[scene.frame ?? "wide"];
  const fp = fr.key === "face" ? scene.focus?.face ?? [0.48, 0.17] : fr.key === "hands" ? scene.focus?.hands ?? [0.3, 0.66] : [0.5, fr.z > 1 ? 0.36 : 0.5];
  const z = fr.z * push * breathe;
  const tx = fr.target[0] - BOX.x - fp[0] * BOX.w * z;
  const ty = fr.target[1] - BOX.y - fp[1] * BOX.h * z;
  const placeholder = !scene.image;
  const light = scene.bg === "morning" || scene.bg === "day";
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <AbsoluteFill style={{ background: BG[scene.bg] }} />
      <AbsoluteFill style={{ background: GLOW[scene.bg] }} />
      <Bokeh seed={scene.id} light={light} />
      {/* readable text zone at the top */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,24,47,0.62) 0%, rgba(6,24,47,0.35) 22%, rgba(6,24,47,0) 40%)" }} />
      {scene.character !== false ? (
        <div style={{ position: "absolute", left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, transform: (scene.frame ?? "wide") === "wide" ? `scale(${push * breathe})` : `translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: (scene.frame ?? "wide") === "wide" ? "50% 100%" : "0 0" }}>
          <Img
            src={resolveMedia(scene.image ?? master)}
            style={{
              width: "100%", height: "100%", objectFit: "contain", objectPosition: "50% 100%",
              // white "sticker" outline (reference style) + scene lighting
              filter: `drop-shadow(0 0 0 #fff) drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff) drop-shadow(0 18px 30px rgba(0,0,0,0.35))${scene.bg === "night" ? " brightness(0.8) saturate(0.9)" : scene.bg === "dusk" || scene.bg === "dawn" ? " sepia(0.1) saturate(1.05)" : ""}`,
            }}
          />
        </div>
      ) : null}
      {scene.pose ? (
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
          <div style={{ marginTop: 10 }}>{pending("MAKLUMAT MENUNGGU PENGESAHAN")}</div>
        </div>
        {jobs.map((j, i) => {
          const at = Math.round((props.at?.[i] ?? i * 2.5) * fps);
          const p = interpolate(frame - at, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "absolute", top: 330 + i * 640, left: 60, right: 60, opacity: p, transform: `translateX(${(1 - p) * (i ? 120 : -120)}px)`, borderRadius: 34, padding: "34px 40px", background: "linear-gradient(180deg, rgba(205,238,255,0.16), rgba(205,238,255,0.05))", border: `3px solid ${i ? YPF.gold : YPF.ice}` }}>
              <div style={{ fontFamily: H, fontWeight: 900, fontSize: 66, color: "#fff", lineHeight: 1 }}>{j.title}</div>
              {j.sub ? <div style={{ fontFamily: H, fontWeight: 800, fontSize: 38, color: YPF.gold, marginTop: 6 }}>{j.sub}</div> : null}
              <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
                {j.points.map((pt, k) => (
                  <div key={k} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontFamily: H, fontWeight: 600, fontSize: 34, color: "#fff", opacity: interpolate(frame - at - 8 - k * 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
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
      <div style={{ position: "absolute", top: 420, width: 640, height: 300, left: 220, border: "4px dashed rgba(255,255,255,0.7)", borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontFamily: H, fontWeight: 900, fontSize: 44, color: "#fff" }}>LOGO RASMI</div>
        <div style={{ fontFamily: H, fontWeight: 700, fontSize: 28, color: YPF.ice, marginTop: 8 }}>YaPakCik Frozen · menunggu fail</div>
      </div>
      <div style={{ position: "absolute", top: 820, width: 1080, textAlign: "center" }}>
        <div style={{ fontFamily: H, fontWeight: 900, fontSize: 60, color: "#fff" }}>{props.headline ?? "JOM SERTAI KAMI"}</div>
        <div style={{ fontFamily: H, fontWeight: 700, fontSize: 36, color: YPF.ice, marginTop: 14 }}>Cara memohon:</div>
        <div style={{ marginTop: 10 }}>{pending(props.apply ?? "MENUNGGU PENGESAHAN")}</div>
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
  const hideCaps = p.layers.filter((l) => l.kind === "title" || l.kind === "jobs" || l.kind === "endcard-placeholder").map((l) => ({ from: l.from, to: l.from + l.dur }));
  const cues: SfxCue[] = [];
  p.scenes.forEach((s, i) => i > 0 && cues.push(s.cut ? { sfx: "click", at: f(s.from), volume: 0.3, playbackRate: 0.9 } : { sfx: "whoosh", at: f(s.from) - 3, volume: 0.25, playbackRate: 1.2 }));
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
          <PoseScene scene={s} master={p.master} dur={f(s.to - s.from)} />
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
      <div style={{ position: "absolute", top: 70, right: 40, fontFamily: FONT_STACKS.montserrat, fontWeight: 900, fontSize: 24, color: "#fff", background: "rgba(6,24,47,0.75)", padding: "6px 14px", borderRadius: 10, letterSpacing: 2 }}>ANIMATIC · DRAF</div>
      <Sequence from={voFrom} name="voice-over" layout="none">
        <Audio src={resolveMedia(p.vo.src)} />
      </Sequence>
      <MusicBed src={p.music.src} volume={p.music.volume} duck={duck} fadeInSec={1} fadeOutSec={3} />
      <SfxTrack cues={cues.filter((c) => c.at >= 0)} masterVolume={0.55} />
    </AbsoluteFill>
  );
};
