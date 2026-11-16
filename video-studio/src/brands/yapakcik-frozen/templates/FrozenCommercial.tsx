import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { MusicBed } from "../../../shared/audio/MusicBed";
import { SfxTrack, type SfxCue } from "../../../shared/audio/SoundEffect";
import { MUSIC } from "../../../shared/audio/library";
import { Subtitles } from "../../../shared/components/Subtitles";
import { FPS } from "../../../shared/constants";
import { useLayout } from "../../../shared/hooks/useLayout";
import { makePresentation, makeTiming, TRANSITION_NAMES, type TransitionName } from "../../../shared/transitions/presets";
import { sec } from "../../../shared/utils/time";
import { buildTimeline } from "../../../shared/utils/timeline";
import { CallToAction } from "../components/CallToAction";
import { ComparisonChart } from "../components/ComparisonChart";
import { CookingSteps } from "../components/CookingSteps";
import { FeatureGrid } from "../components/FeatureGrid";
import { ICON_NAMES } from "../components/Icon";
import { KineticHook } from "../components/KineticHook";
import { LifestyleShot } from "../components/LifestyleShot";
import { PriceBurst } from "../components/PriceBurst";
import { ProductHero } from "../components/ProductHero";
import { TemperatureGauge } from "../components/TemperatureGauge";
import { FROZEN_THEME } from "../theme";

/* ───────────────────────────── SETTINGS (editable in the Studio sidebar) ───────────────────────────── */

export const frozenCommercialSchema = z.object({
  brand: z.object({ name: z.string(), tagline: z.string(), logoSrc: z.string().optional().describe("e.g. brand/yapakcik-frozen/logo.png — empty = text logo") }),
  hook: z.object({ lines: z.array(z.string()).min(1).max(4), punchline: z.string() }),
  product: z.object({
    name: z.string(),
    category: z.string(),
    badge: z.string(),
    packColor: zColor(),
    imageSrc: z.string().optional().describe("Transparent PNG of your product, e.g. brand/yapakcik-frozen/product.png — empty = 3D pack"),
  }),
  features: z.object({
    heading: z.string(),
    items: z.array(z.object({ icon: z.enum(ICON_NAMES), title: z.string(), text: z.string() })).min(1).max(4),
  }),
  lifestyle: z.object({
    headline: z.string(),
    clip: z.object({ src: z.string().optional().describe("e.g. footage/ready/cooking.mp4 — empty = warm bokeh placeholder"), trimBeforeSec: z.number().min(0) }),
  }),
  temperature: z.object({ fromC: z.number(), toC: z.number(), caption: z.string() }),
  comparison: z.object({
    heading: z.string(),
    unit: z.string(),
    items: z.array(z.object({ label: z.string(), value: z.number().min(0), highlight: z.boolean().optional() })).min(1).max(4),
  }),
  steps: z.object({ heading: z.string(), items: z.array(z.object({ title: z.string(), caption: z.string() })).min(1).max(4) }),
  price: z.object({ currency: z.string(), price: z.number().min(0), originalPrice: z.number().min(0).optional(), unitLabel: z.string(), note: z.string() }),
  cta: z.object({ headline: z.string(), buttonText: z.string(), contactLines: z.array(z.string()).max(3) }),
  captions: z.array(z.object({ text: z.string(), startSec: z.number().min(0), endSec: z.number().min(0) })),
  timing: z.object({
    hookSec: z.number().min(1.5).max(10),
    productSec: z.number().min(2).max(10),
    featuresSec: z.number().min(2).max(12),
    lifestyleSec: z.number().min(0).max(12).describe("0 = skip this scene"),
    temperatureSec: z.number().min(0).max(10).describe("0 = skip this scene"),
    comparisonSec: z.number().min(0).max(10).describe("0 = skip this scene"),
    stepsSec: z.number().min(0).max(12).describe("0 = skip this scene"),
    priceSec: z.number().min(0).max(8).describe("0 = skip this scene"),
    ctaSec: z.number().min(2).max(10),
  }),
  transition: z.object({ style: z.enum(["mixed", ...TRANSITION_NAMES]), durationSec: z.number().min(0.2).max(1.5) }),
  audio: z.object({ music: z.string(), musicVolume: z.number().min(0).max(1), sfxVolume: z.number().min(0).max(1) }),
});

export type FrozenCommercialProps = z.infer<typeof frozenCommercialSchema>;

/* ───────────────────────────── DEFAULT CONTENT (replace with your own) ───────────────────────────── */

export const frozenCommercialDefaults: FrozenCommercialProps = {
  brand: { name: "YaPakCik", tagline: "FROZEN", logoSrc: "" },
  hook: { lines: ["HUNGRY?", "NO TIME?"], punchline: "WE'VE GOT YOU." },
  product: {
    name: "Crispy Chicken Nuggets",
    category: "Premium frozen range",
    badge: "NEW!",
    packColor: "#1565c0",
    imageSrc: "",
  },
  features: {
    heading: "WHY FAMILIES LOVE IT",
    items: [
      { icon: "snowflake", title: "Frozen fresh", text: "Locked in at -18°C" },
      { icon: "clock", title: "Ready in 8 min", text: "Pan, air-fryer or oven" },
      { icon: "shield", title: "Halal certified", text: "Quality you can trust" },
      { icon: "heart", title: "Kids approved", text: "Crispy outside, juicy inside" },
    ],
  },
  lifestyle: { headline: "Dinner sorted in minutes", clip: { src: "", trimBeforeSec: 0 } },
  temperature: { fromC: 25, toC: -18, caption: "Frozen at peak freshness" },
  comparison: {
    heading: "Faster than delivery",
    unit: "min",
    items: [
      { label: "YaPakCik Frozen", value: 8, highlight: true },
      { label: "Cooking from scratch", value: 40 },
      { label: "Food delivery", value: 45 },
    ],
  },
  steps: {
    heading: "Easy as 1-2-3",
    items: [
      { title: "Heat", caption: "Air-fryer to 180°C" },
      { title: "Cook", caption: "8 minutes, flip once" },
      { title: "Enjoy", caption: "Serve with your sauce" },
    ],
  },
  price: { currency: "RM", price: 12.9, originalPrice: 15.9, unitLabel: "per 500g pack", note: "Limited-time promo" },
  cta: { headline: "Order yours today", buttonText: "Order now", contactLines: ["WhatsApp: 01X-XXX XXXX", "@your.handle"] },
  captions: [],
  timing: {
    hookSec: 3,
    productSec: 4,
    featuresSec: 4.5,
    lifestyleSec: 3,
    temperatureSec: 3.5,
    comparisonSec: 3.5,
    stepsSec: 4,
    priceSec: 3,
    ctaSec: 4,
  },
  transition: { style: "mixed", durationSec: 0.45 },
  audio: { music: MUSIC.frozenUpbeatGroove, musicVolume: 0.5, sfxVolume: 0.9 },
};

/* ───────────────────────────── TIMELINE ───────────────────────────── */

type SceneId = "hook" | "product" | "features" | "lifestyle" | "temperature" | "comparison" | "steps" | "price" | "cta";

const sceneList = (p: FrozenCommercialProps, fps: number) =>
  (
    [
      ["hook", p.timing.hookSec],
      ["product", p.timing.productSec],
      ["features", p.timing.featuresSec],
      ["lifestyle", p.timing.lifestyleSec],
      ["temperature", p.timing.temperatureSec],
      ["comparison", p.timing.comparisonSec],
      ["steps", p.timing.stepsSec],
      ["price", p.timing.priceSec],
      ["cta", p.timing.ctaSec],
    ] as [SceneId, number][]
  )
    .filter(([, s]) => s > 0) // a duration of 0 removes the scene
    .map(([id, s]) => ({ id, durationInFrames: sec(s, fps) }));

export const calculateFrozenMetadata: CalculateMetadataFunction<FrozenCommercialProps> = ({ props }) => {
  const { totalDurationInFrames } = buildTimeline(sceneList(props, FPS), sec(props.transition.durationSec, FPS));
  return { durationInFrames: totalDurationInFrames, fps: FPS };
};

/** "mixed" = a hand-picked rhythm of transitions that suits fast commercials. */
const MIXED: TransitionName[] = ["flash", "zoom-punch", "frost-dissolve", "slide", "wipe", "frost-dissolve", "flash", "zoom-punch"];

/* ───────────────────────────── THE VIDEO ───────────────────────────── */

export const FrozenCommercial: React.FC<FrozenCommercialProps> = (p) => {
  const { fps, width, height } = useLayout();
  const c = FROZEN_THEME.colors;
  const T = sec(p.transition.durationSec, fps);
  const list = sceneList(p, fps);
  const { scenes } = buildTimeline(list, T);
  const sfx = p.audio.sfxVolume;

  const renderScene = (id: SceneId, d: number) => {
    switch (id) {
      case "hook":
        return <KineticHook lines={p.hook.lines} punchline={p.hook.punchline} durationInFrames={d} sfxVolume={sfx} />;
      case "product":
        return <ProductHero brand={p.brand.name} name={p.product.name} category={p.product.category} badge={p.product.badge} packColor={p.product.packColor} imageSrc={p.product.imageSrc || undefined} sfxVolume={sfx} />;
      case "features":
        return <FeatureGrid heading={p.features.heading} features={p.features.items} sfxVolume={sfx} />;
      case "lifestyle":
        return <LifestyleShot clip={p.lifestyle.clip} headline={p.lifestyle.headline} durationInFrames={d} fps={fps} />;
      case "temperature":
        return <TemperatureGauge fromC={p.temperature.fromC} toC={p.temperature.toC} caption={p.temperature.caption} sfxVolume={sfx} />;
      case "comparison":
        return <ComparisonChart heading={p.comparison.heading} unit={p.comparison.unit} items={p.comparison.items} sfxVolume={sfx} />;
      case "steps":
        return <CookingSteps heading={p.steps.heading} steps={p.steps.items} sfxVolume={sfx} />;
      case "price":
        return <PriceBurst currency={p.price.currency} price={p.price.price} originalPrice={p.price.originalPrice} unitLabel={p.price.unitLabel} note={p.price.note} sfxVolume={sfx} />;
      case "cta":
        return <CallToAction brand={p.brand.name} tagline={p.brand.tagline} logoSrc={p.brand.logoSrc || undefined} headline={p.cta.headline} buttonText={p.cta.buttonText} contactLines={p.cta.contactLines} sfxVolume={sfx} />;
    }
  };

  // Whoosh on every transition (scenes also carry their own pops, impacts and sparkles)
  const cues: SfxCue[] = scenes.slice(1).map((s) => ({ sfx: "whoosh", at: s.from - 2, volume: 0.4, playbackRate: 1.15 }));

  return (
    <AbsoluteFill style={{ background: c.navy }}>
      <TransitionSeries>
        {list.flatMap((s, i) => {
          const style: TransitionName = p.transition.style === "mixed" ? MIXED[(i - 1) % MIXED.length] : p.transition.style;
          return [
            i > 0 ? <TransitionSeries.Transition key={`t-${s.id}`} presentation={makePresentation(style, { width, height }, i)} timing={makeTiming(T)} /> : null,
            <TransitionSeries.Sequence key={s.id} durationInFrames={s.durationInFrames} name={s.id}>
              {renderScene(s.id, s.durationInFrames)}
            </TransitionSeries.Sequence>,
          ].filter(Boolean);
        })}
      </TransitionSeries>
      <Subtitles captions={p.captions} font={FROZEN_THEME.fonts.sans} highlight={c.gold} />
      {p.audio.music ? <MusicBed src={p.audio.music} volume={p.audio.musicVolume} fadeInSec={0.3} fadeOutSec={1.5} /> : null}
      <SfxTrack cues={cues} masterVolume={sfx} />
    </AbsoluteFill>
  );
};
