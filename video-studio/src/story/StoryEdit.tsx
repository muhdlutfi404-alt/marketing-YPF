import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, type CalculateMetadataFunction } from "remotion";
import { Audio } from "@remotion/media";
import { SFX, type SfxName } from "../shared/audio/library";
import { resolveMedia } from "../shared/utils/media";
import { AiLabel, CompositeBackground, CompositeForeground, type CompositeSpec } from "./CompositeShot";
import { MusicBed } from "../shared/audio/MusicBed";
import { SfxTrack, type SfxCue } from "../shared/audio/SoundEffect";
import { FilmGrain, Vignette } from "../shared/components/CinematicLook";
import { FPS } from "../shared/constants";
import { buildCaptionPages, captionWords, findQuote, resolveRevealTimes, resolveStory, resolveZoomTime, type ResolvedLayer, type ResolvedShot, type StoryBundle } from "./engine";
import { Annotations } from "./layers/index";
import { Broll } from "./layers/Broll";
import { PlaceholderRibbon, type PlateSource } from "./layers/common";
import { Chart, Counter, Dial, ProgressBar, Steps } from "./layers/Infographics";
import { Board } from "./layers/Board";
import { Typeset } from "./layers/Typeset";
import { gradeFilter } from "./grades";
import { Chapter, KeywordPop, Statement } from "./layers/Typography";
import { ShotView } from "./ShotView";
import { StoryCaptions } from "./StoryCaptions";
import { STORY_STYLES } from "./styles";

/**
 * STORY EDIT — renders a raw-footage edit (edit.json + footage.json + transcripts + facts.json)
 * as a vertical 1080×1920 video. One composition serves every project: the render script passes
 * the project's data as props, and the length is calculated from the timeline.
 */
export type StoryEditProps = StoryBundle;

export const calculateStoryMetadata: CalculateMetadataFunction<StoryEditProps> = ({ props }) => {
  const { total } = resolveStory(props);
  return { durationInFrames: Math.max(1, Math.ceil(total * FPS)), fps: FPS, width: 1080, height: 1920 };
};

const FULLSCREEN_TYPES = new Set(["fullscreen", "statement", "chapter", "chart", "cta", "dial", "board"]);

export const StoryEdit: React.FC<StoryEditProps> = (bundle) => {
  const fps = FPS;
  const width = 1080;
  const height = 1920;
  const { edit, clips } = bundle;
  const style = STORY_STYLES[edit.brand] ?? STORY_STYLES["yapakcik-frozen"];
  const story = useMemo(() => resolveStory(bundle), [bundle]);
  const pages = useMemo(() => buildCaptionPages(captionWords(story.words, edit.captions.hide), edit.captions.style === "minimal" ? { maxWords: 3, maxChars: 20, maxPageSec: 1.6 } : {}), [story.words, edit.captions.hide, edit.captions.style]);
  const f = (sec: number) => Math.round(sec * fps);

  // the real footage that is on screen at time t (for blurred plates behind full-screen graphics)
  const plateAt = (t: number): PlateSource => {
    const s = [...story.shots].reverse().find((x) => t >= x.start && t < x.start + x.duration) ?? story.shots[0];
    if (!s || !clips[s.clip]) return null;
    return { clip: clips[s.clip], trimBeforeSec: s.in + (t - s.start), focus: s.focus };
  };

  // composite spec for a shot = its edit settings + the matte (cut-out) made for its clip
  const compositeOf = (s: ResolvedShot): CompositeSpec | null => {
    const m = bundle.mattes?.[s.clip];
    if (!s.composite || !m) return null;
    return { ...s.composite, fg: { src: m.fg, from: m.from }, matteStats: m.stats, gradeFilter: s.composite.plate === "original" ? gradeFilter(edit.look.grade, edit.look.gradeIntensity ?? 0.8) : undefined };
  };
  const compShots = story.shots.filter((s) => compositeOf(s));

  const isFull = (l: ResolvedLayer) => FULLSCREEN_TYPES.has(l.type) || (l.type === "counter" && l.props.fullscreen) || (l.type === "steps" && l.props.fullscreen);
  // captions hide while a full-screen statement shows the same words in big type
  const captionHidden = story.layers
    .filter((l) => l.type === "statement" || l.type === "chapter" || l.type === "board" || (l.type === "typeset" && (l.props.plate ?? "none") !== "none") || l.props.hideCaptions)
    .map((l) => ({ from: l.start, to: l.start + l.dur }));

  const renderLayer = (l: ResolvedLayer) => {
    const dur = f(l.dur);
    const plate = plateAt(l.start);
    const common = { dur, style, plate, fps, width, height };
    switch (l.type) {
      case "broll":
        return <Broll dur={dur} clip={clips[l.props.clip]} grade={edit.look.grade} gradeIntensity={edit.look.gradeIntensity ?? 0.8} props={l.props as never} />;
      case "keyword":
        return <KeywordPop dur={dur} style={style} props={l.props as never} />;
      case "statement":
      case "fullscreen":
        return <Statement {...common} props={l.props as never} />;
      case "chapter":
        return <Chapter {...common} props={l.props as never} />;
      case "counter":
        return <Counter {...common} props={l.props as never} />;
      case "chart":
        return <Chart {...common} props={l.props as never} />;
      case "steps":
        return <Steps {...common} props={{ ...l.props, revealAt: l.props.revealAt ?? resolveRevealTimes(l, story.words)?.map((x) => x ?? 0) } as never} />;
      case "progress":
        return <ProgressBar dur={dur} style={style} props={l.props as never} />;
      case "callout":
        return <Annotations.Callout dur={dur} style={style} props={l.props as never} />;
      case "badge":
        return <Annotations.Badge dur={dur} style={style} props={l.props as never} />;
      case "lowerThird":
        return <Annotations.LowerThirdLayer dur={dur} style={style} props={l.props as never} />;
      case "cta":
        return <Annotations.CTA {...common} props={l.props as never} />;
      case "dial":
        return <Dial {...common} props={l.props as never} />;
      case "board":
        return <Board dur={dur} style={style} props={{ ...l.props, revealAt: l.props.revealAt ?? resolveRevealTimes(l, story.words)?.map((x) => x ?? 0) } as never} />;
      case "typeset":
        return <Typeset {...common} props={{ ...l.props, revealAt: l.props.revealAt ?? resolveRevealTimes(l, story.words)?.map((x) => x ?? 0) } as never} />;
      default:
        return null;
    }
  };

  // ── AUTOMATIC SOUND DESIGN ── timed to the edit itself
  const cues: SfxCue[] = [];
  if (edit.audio.sfx === "auto") {
    const brandSparkle = edit.brand === "yapakcik-frozen" ? "iceSparkle" : "shutter";
    story.shots.forEach((s, i) => {
      if (i > 0 && s.transition && s.transition.type !== "cut") cues.push({ sfx: "whoosh", at: f(s.start) - 2, volume: 0.45 });
      for (const z of s.zooms ?? []) {
        const at = resolveZoomTime(z, s, story.words);
        const big = (z.scale ?? 1.22) >= 1.18 && (z.type === "punch-in" || z.type === "punch-out") && (z.duration ?? 0.12) > 0.05;
        if (at !== null && at > 0.05 && big) cues.push({ sfx: "whoosh", at: f(s.start + at) - 1, volume: 0.16, playbackRate: 1.8 });
      }
    });
    for (const l of story.layers) {
      const at = f(l.start);
      if (l.type === "broll") cues.push({ sfx: "whoosh", at: at - 2, volume: 0.28, playbackRate: 1.3 });
      if (l.type === "keyword") cues.push({ sfx: "pop", at: at + 2, volume: 0.55 });
      if (l.type === "statement" || l.type === "fullscreen") {
        cues.push({ sfx: "impact", at: at + 3, volume: 0.45, playbackRate: 1.25 });
        (l.props.lines ?? []).slice(1).forEach((_: string, i: number) => cues.push({ sfx: "pop", at: at + 4 + (i + 1) * Math.max(6, Math.floor((f(l.dur) * 0.45) / l.props.lines.length)), volume: 0.4 }));
      }
      if (l.type === "chapter") {
        cues.push({ sfx: "riser", at: Math.max(0, at - f(1.6)), volume: 0.32 });
        cues.push({ sfx: "impact", at: at + 2, volume: 0.6 });
      }
      if (l.type === "counter") {
        for (let k = 0; k < 6; k++) cues.push({ sfx: "tick", at: at + 3 + k * 5, volume: 0.35, playbackRate: 1 + k * 0.05 });
        cues.push({ sfx: "pop", at: at + Math.min(38, f(l.dur) - 12), volume: 0.5 });
      }
      if (l.type === "chart") (l.props.items ?? []).forEach((_: unknown, i: number) => cues.push({ sfx: "whoosh", at: at + 10 + i * 12, volume: 0.25, playbackRate: 1.5 }));
      if (l.type === "steps") {
        const items = l.props.items ?? [];
        const spoken = l.props.revealAt ?? resolveRevealTimes(l, story.words);
        items.forEach((_: string, i: number) => {
          const rf = spoken?.[i] !== undefined && spoken[i] !== null ? Math.round(spoken[i] * fps) : 6 + Math.floor((i * (f(l.dur) * 0.6)) / Math.max(1, items.length));
          cues.push({ sfx: "pop", at: at + rf, volume: 0.5, playbackRate: 0.95 + i * 0.1 });
        });
      }
      if (l.type === "callout") cues.push({ sfx: "pop", at, volume: 0.5 });
      if (l.type === "badge") cues.push({ sfx: brandSparkle, at, volume: 0.6 });
      if (l.type === "cta") cues.push({ sfx: brandSparkle, at: at + 4, volume: 0.7 });
      if (l.type === "lowerThird") cues.push({ sfx: "whoosh", at, volume: 0.22, playbackRate: 1.6 });
      if (l.type === "board" || (l.type === "typeset" && l.props.plate && l.props.plate !== "none")) {
        cues.push({ sfx: "whoosh", at: at - 2, volume: 0.22, playbackRate: 1.4 });
        const rv = l.props.revealAt ?? resolveRevealTimes(l, story.words);
        (rv ?? []).forEach((r: number | null, i: number) => r !== null && r > 0.15 && cues.push({ sfx: "pop", at: at + Math.round(r * fps), volume: 0.28, playbackRate: 1.15 + i * 0.05 }));
      }
    }
  }
  // hand-placed cues (anchored to spoken words or seconds)
  for (const c of edit.audio.cues ?? []) {
    const t = typeof c.at === "number" ? c.at : (findQuote(story.words, c.at)?.start ?? NaN) + (c.at.offset ?? 0);
    if (Number.isFinite(t) && c.sfx in SFX) cues.push({ sfx: c.sfx as SfxName, at: f(t), volume: c.volume ?? 0.5, playbackRate: c.playbackRate });
  }
  const duck = story.speech.map((r) => ({ from: f(r.from), to: f(r.to), level: edit.audio.duckTo }));

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* 1 · REAL FOOTAGE — the presenter's shots with original voice
             (composite shots: generated environment here, the real subject is added in step 1c) */}
      {story.shots.map((s, i) => {
        const clip = clips[s.clip];
        if (!clip) return null;
        const comp = compositeOf(s);
        if (comp)
          return (
            <Sequence key={s.id} from={f(s.start)} durationInFrames={Math.max(1, f(s.duration))} name={`Shot ${s.id} · environment`} premountFor={fps}>
              <CompositeBackground shot={s} spec={comp} words={story.words} breathing={edit.look.breathing ?? 0} clip={clip} />
            </Sequence>
          );
        return (
          <Sequence key={s.id} from={f(s.start)} durationInFrames={Math.max(1, f(s.duration))} name={`Shot ${s.id}${s.label ? " · " + s.label : ""}`} premountFor={fps}>
            <ShotView shot={s} next={story.shots[i + 1]} clip={clip} words={story.words} grade={edit.look.grade} gradeIntensity={edit.look.gradeIntensity ?? 0.8} breathing={edit.look.breathing ?? 0} coverBands={(edit.look.coverBands ?? []).filter((b) => !b.clips || b.clips.includes(s.clip))} coverColor={style.colors.dark} />
          </Sequence>
        );
      })}

      {/* 1b · typography BEHIND the subject (depth) */}
      {story.layers.filter((l) => l.props.behind).map((l) => (
        <Sequence key={l.id} from={f(l.start)} durationInFrames={Math.max(1, f(l.dur))} name={`behind ${l.id}`}>
          {renderLayer(l)}
        </Sequence>
      ))}

      {/* 1c · the REAL presenter + product (cut-out, pixels untouched) in front */}
      {compShots.map((s) => {
        const i = story.shots.indexOf(s);
        return (
          <Sequence key={`fg-${s.id}`} from={f(s.start)} durationInFrames={Math.max(1, f(s.duration))} name={`Shot ${s.id} · real subject`} premountFor={fps}>
            <CompositeForeground shot={s} next={story.shots[i + 1]} spec={compositeOf(s)!} words={story.words} breathing={edit.look.breathing ?? 0} clip={clips[s.clip]} />
          </Sequence>
        );
      })}
      {/* cold-air ambience under frosty environments */}
      {compShots.filter((s) => s.composite?.atmosphere === "frost").map((s) => (
        <Sequence key={`amb-${s.id}`} from={f(s.start)} durationInFrames={Math.max(1, f(s.duration))} layout="none">
          <Audio src={resolveMedia(SFX.windAmbience)} volume={(fr) => 0.18 * edit.audio.sfxVolume * interpolate(fr, [0, 12, f(s.duration) - 12, f(s.duration)], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}

      {/* 2 · B-ROLL cutaways (real secondary footage over the voice) */}
      {story.layers.filter((l) => l.type === "broll").map((l) => (
        <Sequence key={l.id} from={f(l.start)} durationInFrames={Math.max(1, f(l.dur))} name={`B-roll ${l.id}`} premountFor={fps}>
          {renderLayer(l)}
        </Sequence>
      ))}

      {/* 3 · Film finish over footage (below graphics) */}
      {edit.look.vignette ? <Vignette strength={0.45} /> : null}
      {edit.look.grain ? <FilmGrain opacity={0.06} /> : null}

      {/* 4 · Motion graphics (full-screen first, then overlays) */}
      {[...story.layers.filter((l) => l.type !== "broll" && !l.props.behind && isFull(l)), ...story.layers.filter((l) => l.type !== "broll" && !l.props.behind && !isFull(l))].map((l) => (
        <Sequence key={l.id} from={f(l.start)} durationInFrames={Math.max(1, f(l.dur))} name={`${l.type} ${l.id}`} premountFor={fps}>
          {renderLayer(l)}
          {l.source === "placeholder" ? <PlaceholderRibbon /> : null}
        </Sequence>
      ))}

      {/* 4b · honest disclosure on scenes with AI-generated backgrounds */}
      {edit.look.aiLabel
        ? [
            ...compShots.map((s) => ({ key: s.id, from: s.start, dur: s.duration })),
            ...story.layers.filter((l) => typeof l.props.plate === "string" && l.props.plate.startsWith("generated/")).map((l) => ({ key: l.id, from: l.start, dur: l.dur })),
            ...story.layers.filter((l) => l.type === "broll" && l.props.card?.plate).map((l) => ({ key: l.id, from: l.start, dur: l.dur })),
          ].map((r) => (
            <Sequence key={`ai-${r.key}`} from={f(r.from)} durationInFrames={Math.max(1, f(r.dur))} layout="none">
              <AiLabel />
            </Sequence>
          ))
        : null}

      {/* 5 · Subtitles from the real transcript */}
      {edit.captions.enabled ? (
        <StoryCaptions pages={pages} style={style} variant={edit.captions.style} uppercase={edit.captions.uppercase} position={edit.captions.position} hiddenRanges={captionHidden} emphasis={edit.captions.emphasis} />
      ) : null}

      {/* 6 · Music (ducked under the voice) + sound design */}
      {edit.audio.music ? <MusicBed src={edit.audio.music} volume={edit.audio.musicVolume} duck={duck} fadeInSec={1} fadeOutSec={2} /> : null}
      <SfxTrack cues={cues.filter((c) => c.at >= 0)} masterVolume={edit.audio.sfxVolume} />
    </AbsoluteFill>
  );
};
