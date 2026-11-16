import React from "react";
import { AbsoluteFill, Sequence, type CalculateMetadataFunction } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { z } from "zod";
import { MusicBed } from "../../../shared/audio/MusicBed";
import { SfxTrack, type SfxCue } from "../../../shared/audio/SoundEffect";
import { MUSIC, SFX } from "../../../shared/audio/library";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { CinematicOverlay, GRADE_NAMES } from "../../../shared/components/CinematicLook";
import { LowerThird } from "../../../shared/components/LowerThird";
import { LANDSCAPE_NAMES } from "../../../shared/components/ProceduralLandscape";
import { Subtitles } from "../../../shared/components/Subtitles";
import { useLayout } from "../../../shared/hooks/useLayout";
import { makePresentation, makeTiming, TRANSITION_NAMES } from "../../../shared/transitions/presets";
import { FPS } from "../../../shared/constants";
import { sec } from "../../../shared/utils/time";
import { buildTimeline } from "../../../shared/utils/timeline";
import { AMShot } from "../components/AMShot";
import { ChapterTitle } from "../components/ChapterTitle";
import { ClimbStats } from "../components/ClimbStats";
import { EndCard } from "../components/EndCard";
import { LocationTag } from "../components/LocationTag";
import { MapRoute } from "../components/MapRoute";
import { QuoteCard } from "../components/QuoteCard";
import { TitleSequence } from "../components/TitleSequence";
import { AM_THEME } from "../theme";

/* ───────────────────────────── SETTINGS (editable in the Studio sidebar) ───────────────────────────── */

const clipSchema = z.object({
  src: z.string().optional().describe("Path inside /public, e.g. footage/ready/summit.mp4 — leave empty for the animated placeholder"),
  trimBeforeSec: z.number().min(0).describe("Skip this many seconds at the start of the clip"),
  placeholder: z.enum(LANDSCAPE_NAMES),
});

export const projectAMSchema = z.object({
  episodeLabel: z.string(),
  title: z.string(),
  subtitle: z.string(),
  coldOpen: z.object({ line: z.string(), clip: clipSchema, durationSec: z.number().min(2).max(20) }),
  presenter: z.object({ name: z.string(), role: z.string() }),
  chapters: z
    .array(
      z.object({
        label: z.string(),
        title: z.string(),
        place: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        altitudeM: z.number(),
        clip: clipSchema,
        durationSec: z.number().min(2).max(60),
      }),
    )
    .min(1),
  route: z.object({
    title: z.string(),
    distanceKm: z.number().min(0),
    waypoints: z.array(z.object({ label: z.string(), x: z.number().min(0).max(1), y: z.number().min(0).max(1) })).min(2),
    durationSec: z.number().min(3).max(30),
  }),
  climb: z.object({
    heading: z.string(),
    elevationM: z.array(z.number()).min(2),
    stats: z.array(z.object({ label: z.string(), value: z.number(), suffix: z.string().optional(), decimals: z.number().int().min(0).max(3).optional() })).max(4),
    durationSec: z.number().min(3).max(30),
  }),
  quote: z.object({ text: z.string(), author: z.string(), clip: clipSchema, durationSec: z.number().min(2).max(20) }),
  outro: z.object({ brand: z.string(), tagline: z.string(), callToAction: z.string(), logoSrc: z.string().optional(), durationSec: z.number().min(2).max(15) }),
  captions: z.array(z.object({ text: z.string(), startSec: z.number().min(0), endSec: z.number().min(0) })),
  look: z.object({ grade: z.enum(GRADE_NAMES), letterbox: z.boolean(), filmGrain: z.boolean(), vignette: z.boolean() }),
  transition: z.object({ style: z.enum(TRANSITION_NAMES), durationSec: z.number().min(0.2).max(2) }),
  audio: z.object({
    music: z.string(),
    musicVolume: z.number().min(0).max(1),
    ambience: z.string(),
    ambienceVolume: z.number().min(0).max(1),
    sfxVolume: z.number().min(0).max(1),
  }),
});

export type ProjectAMProps = z.infer<typeof projectAMSchema>;

/* ───────────────────────────── DEFAULT CONTENT (replace with your own) ───────────────────────────── */

export const projectAMDefaults: ProjectAMProps = {
  episodeLabel: "PROJECT A.M · EPISODE 01",
  title: "INTO THE HIGHLANDS",
  subtitle: "Three days. One ridge. No signal.",
  coldOpen: {
    line: "Some places you don't visit. You earn them.",
    clip: { src: "", trimBeforeSec: 0, placeholder: "night-camp" },
    durationSec: 5.5,
  },
  presenter: { name: "YOUR NAME", role: "Host · Project A.M" },
  chapters: [
    {
      label: "CHAPTER 01",
      title: "THE APPROACH",
      place: "Base Camp",
      latitude: 4.4721,
      longitude: 101.3801,
      altitudeM: 1520,
      clip: { src: "", trimBeforeSec: 0, placeholder: "forest-mist" },
      durationSec: 5.5,
    },
    {
      label: "CHAPTER 02",
      title: "THE RIVER CROSSING",
      place: "Sungai Valley",
      latitude: 4.5012,
      longitude: 101.4123,
      altitudeM: 1185,
      clip: { src: "", trimBeforeSec: 0, placeholder: "river-valley" },
      durationSec: 5,
    },
    {
      label: "CHAPTER 03",
      title: "SUMMIT AT DAWN",
      place: "The Summit",
      latitude: 4.5323,
      longitude: 101.4479,
      altitudeM: 2187,
      clip: { src: "", trimBeforeSec: 0, placeholder: "dawn-mountains" },
      durationSec: 5.5,
    },
  ],
  route: {
    title: "42 KM ACROSS THE RIDGE",
    distanceKm: 42.6,
    waypoints: [
      { label: "Trailhead", x: 0.05, y: 0.8 },
      { label: "Base Camp", x: 0.3, y: 0.55 },
      { label: "River", x: 0.5, y: 0.85 },
      { label: "Ridge", x: 0.72, y: 0.4 },
      { label: "Summit", x: 0.93, y: 0.12 },
    ],
    durationSec: 6.5,
  },
  climb: {
    heading: "THE CLIMB",
    elevationM: [420, 610, 890, 1240, 1520, 1380, 1185, 1450, 1790, 1960, 2187, 2050],
    stats: [
      { label: "Distance", value: 42.6, suffix: " km", decimals: 1 },
      { label: "Elevation gain", value: 2890, suffix: " m" },
      { label: "Days on trail", value: 3 },
      { label: "Coldest night", value: 6, suffix: "°C" },
    ],
    durationSec: 6.5,
  },
  quote: {
    text: "The mountain doesn't care how fast you climb. Only that you keep going.",
    author: "Trail notes, day three",
    clip: { src: "", trimBeforeSec: 0, placeholder: "golden-ridge" },
    durationSec: 5.5,
  },
  outro: {
    brand: "PROJECT A.M",
    tagline: "Adventure. Mountains. Stories.",
    callToAction: "Subscribe for episode 02",
    logoSrc: "",
    durationSec: 5,
  },
  captions: [
    { text: "Some places you don't visit.", startSec: 0.6, endSec: 2.6 },
    { text: "You earn them.", startSec: 2.6, endSec: 4.6 },
  ],
  look: { grade: "teal-orange", letterbox: true, filmGrain: true, vignette: true },
  transition: { style: "light-leak", durationSec: 0.7 },
  audio: {
    music: MUSIC.amCinematicDrone,
    musicVolume: 0.55,
    ambience: SFX.windAmbience,
    ambienceVolume: 0.35,
    sfxVolume: 0.9,
  },
};

/* ───────────────────────────── TIMELINE ───────────────────────────── */

/** The scene list — shared by the component and calculateMetadata so the length is always right. */
const sceneDurations = (p: ProjectAMProps, fps: number) => [
  { id: "cold-open", durationInFrames: sec(p.coldOpen.durationSec, fps) },
  { id: "title", durationInFrames: sec(4.5, fps) },
  ...p.chapters.map((c, i) => ({ id: `chapter-${i}`, durationInFrames: sec(c.durationSec, fps) })),
  { id: "route", durationInFrames: sec(p.route.durationSec, fps) },
  { id: "climb", durationInFrames: sec(p.climb.durationSec, fps) },
  { id: "quote", durationInFrames: sec(p.quote.durationSec, fps) },
  { id: "outro", durationInFrames: sec(p.outro.durationSec, fps) },
];

/** Sets the video length automatically from the settings (add a chapter → video gets longer). */
export const calculateProjectAMMetadata: CalculateMetadataFunction<ProjectAMProps> = ({ props }) => {
  const { totalDurationInFrames } = buildTimeline(sceneDurations(props, FPS), sec(props.transition.durationSec, FPS));
  return { durationInFrames: totalDurationInFrames, fps: FPS };
};

/* ───────────────────────────── THE VIDEO ───────────────────────────── */

export const ProjectAMDocumentary: React.FC<ProjectAMProps> = (props) => {
  const { fps, width, height, px, isVertical } = useLayout();
  const { colors, fonts } = AM_THEME;
  const T = sec(props.transition.durationSec, fps);
  const durations = sceneDurations(props, fps);
  const { scenes } = buildTimeline(durations, T);
  const dur = (id: string) => durations.find((d) => d.id === id)!.durationInFrames;
  const titleStart = scenes.find((s) => s.id === "title")!.from;

  // ── Sound design: whoosh on every transition, riser → impact into the title, shutter on each chapter ──
  const cues: SfxCue[] = [
    ...scenes.slice(1).map((s): SfxCue => ({ sfx: "whoosh", at: s.from - 3, volume: 0.45 })),
    { sfx: "riser", at: titleStart - sec(2, fps), volume: 0.6 },
    { sfx: "impact", at: titleStart + 2, volume: 0.95 },
    ...scenes.filter((s) => s.id.startsWith("chapter-")).map((s): SfxCue => ({ sfx: "shutter", at: s.from + 15, volume: 0.6 })),
  ];

  return (
    <AbsoluteFill style={{ background: colors.ink }}>
      <TransitionSeries>
        {/* 1 · COLD OPEN — hook line over atmospheric footage */}
        <TransitionSeries.Sequence durationInFrames={dur("cold-open")} name="Cold open">
          <AMShot clip={props.coldOpen.clip} grade={props.look.grade} durationInFrames={dur("cold-open")} fps={fps} darken={0.35} seed={7} />
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: px(isVertical ? 80 : 200) }}>
            <AnimatedText
              text={props.coldOpen.line}
              mode="blur"
              delay={12}
              stagger={5}
              exitAt={dur("cold-open") - 30}
              align="center"
              style={{ fontFamily: fonts.serif, fontSize: px(isVertical ? 76 : 72), color: colors.bone, lineHeight: 1.2, textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}
            />
          </AbsoluteFill>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={makePresentation("fade", { width, height })} timing={makeTiming(T)} />

        {/* 2 · TITLE */}
        <TransitionSeries.Sequence durationInFrames={dur("title")} name="Title">
          <AMShot clip={props.coldOpen.clip} grade={props.look.grade} durationInFrames={dur("title")} fps={fps} darken={0.55} zoom="out" seed={7} punchAt={[2]} />
          <TitleSequence episodeLabel={props.episodeLabel} title={props.title} subtitle={props.subtitle} />
        </TransitionSeries.Sequence>

        {/* 3 · CHAPTERS */}
        {props.chapters.flatMap((c, i) => {
          const d = dur(`chapter-${i}`);
          return [
            <TransitionSeries.Transition key={`t-ch-${i}`} presentation={makePresentation(props.transition.style, { width, height }, i)} timing={makeTiming(T)} />,
            <TransitionSeries.Sequence key={`ch-${i}`} durationInFrames={d} name={`Chapter ${i + 1}`}>
              <AMShot clip={c.clip} grade={props.look.grade} durationInFrames={d} fps={fps} zoom={i % 2 ? "out" : "in"} seed={i + 1} darken={0.15} />
              <ChapterTitle label={c.label} title={c.title} exitAt={Math.min(110, d - 30)} />
              <LocationTag place={c.place} latitude={c.latitude} longitude={c.longitude} altitudeM={c.altitudeM} delay={15} />
              {i === 0 && props.presenter.name ? (
                <Sequence from={Math.min(110, d - 50)} layout="none">
                  <LowerThird name={props.presenter.name} role={props.presenter.role} accent={colors.ember} titleFont={fonts.display} bodyFont={fonts.body} holdFrames={Math.max(20, d - Math.min(110, d - 50) - 30)} />
                </Sequence>
              ) : null}
            </TransitionSeries.Sequence>,
          ];
        })}

        {/* 4 · MAP ROUTE infographic */}
        <TransitionSeries.Transition presentation={makePresentation("wipe", { width, height })} timing={makeTiming(T)} />
        <TransitionSeries.Sequence durationInFrames={dur("route")} name="Map route">
          <MapRoute title={props.route.title} waypoints={props.route.waypoints} distanceKm={props.route.distanceKm} durationInFrames={dur("route")} sfxVolume={props.audio.sfxVolume} />
        </TransitionSeries.Sequence>

        {/* 5 · ELEVATION + STATS infographic */}
        <TransitionSeries.Transition presentation={makePresentation("slide", { width, height }, 1)} timing={makeTiming(T)} />
        <TransitionSeries.Sequence durationInFrames={dur("climb")} name="Climb stats">
          <ClimbStats heading={props.climb.heading} elevationM={props.climb.elevationM} stats={props.climb.stats} durationInFrames={dur("climb")} sfxVolume={props.audio.sfxVolume} />
        </TransitionSeries.Sequence>

        {/* 6 · QUOTE */}
        <TransitionSeries.Transition presentation={makePresentation(props.transition.style, { width, height }, 3)} timing={makeTiming(T)} />
        <TransitionSeries.Sequence durationInFrames={dur("quote")} name="Quote">
          <AMShot clip={props.quote.clip} grade={props.look.grade} durationInFrames={dur("quote")} fps={fps} darken={0.6} zoom="out" seed={11} />
          <QuoteCard text={props.quote.text} author={props.quote.author} />
        </TransitionSeries.Sequence>

        {/* 7 · OUTRO */}
        <TransitionSeries.Transition presentation={makePresentation("fade", { width, height })} timing={makeTiming(T)} />
        <TransitionSeries.Sequence durationInFrames={dur("outro")} name="End card">
          <EndCard brand={props.outro.brand} tagline={props.outro.tagline} callToAction={props.outro.callToAction} logoSrc={props.outro.logoSrc || undefined} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Finishing layers over the whole film */}
      <CinematicOverlay grain={props.look.filmGrain} vignette={props.look.vignette} letterbox={props.look.letterbox} />
      <Subtitles captions={props.captions} font={fonts.body} highlight={colors.ember} />

      {/* Audio */}
      {props.audio.music ? <MusicBed src={props.audio.music} volume={props.audio.musicVolume} /> : null}
      {props.audio.ambience ? <MusicBed src={props.audio.ambience} volume={props.audio.ambienceVolume} fadeInSec={0.5} /> : null}
      <SfxTrack cues={cues} masterVolume={props.audio.sfxVolume} />
    </AbsoluteFill>
  );
};
