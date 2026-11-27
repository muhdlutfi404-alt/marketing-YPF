/**
 * STORY ENGINE — the brain of the raw-footage editing system.
 *
 * Pure functions with NO imports, so the exact same code runs:
 *   • inside the video (Remotion)            → src/story/StoryEdit.tsx
 *   • in the safety checker on the command line → scripts/story/check.mjs (node runs .ts directly)
 *
 * Time is in SECONDS everywhere in edit files. Frames are only used at render time.
 */

/* ───────────────────────────── TYPES ───────────────────────────── */

export type Word = { text: string; start: number; end: number; prob?: number };
export type TranscriptSegment = { start: number; end: number; text: string; words: Word[] };
export type ClipTranscript = {
  clip: string;
  source: "whisper" | "srt" | "manual";
  language?: string;
  model?: string;
  /** true when word timings were estimated (e.g. from an SRT without word timing) */
  estimatedWordTiming?: boolean;
  segments: TranscriptSegment[];
};

export type ClipInfo = {
  id: string;
  /** path inside /public of the prepared (editor-friendly) copy */
  src: string;
  original: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  /** measured integrated loudness of the original audio (LUFS), if any */
  loudnessLufs?: number | null;
  createdAt?: string | null;
  location?: { lat: number; lon: number; alt?: number } | null;
  device?: string | null;
};

/** Point in time given either as seconds or as a spoken quote. */
export type Anchor = {
  /** Exact words from the transcript (case & punctuation don't matter) */
  quote: string;
  /** Only search inside this shot */
  shot?: string;
  /** 1 = first time the words are spoken (default), 2 = second time… */
  occurrence?: number;
  /** "start" (default) = when the first word starts, "end" = when the last word ends */
  edge?: "start" | "end";
  /** Seconds to add (can be negative) */
  offset?: number;
};
export type TimeRef = number | Anchor;

export type ZoomType = "punch-in" | "punch-out" | "zoom-in" | "zoom-out" | "push" | "reset";
export type Zoom = {
  /** seconds from the START OF THE SHOT, or a spoken quote */
  at: TimeRef;
  type: ZoomType;
  /** target scale, e.g. 1.25 (punch-in default 1.22, zoom-in 1.15) */
  scale?: number;
  /** seconds the move takes (punch default 0.12s, zoom default 1.2s, push = rest of shot) */
  duration?: number;
};

export type Focus = { x: number; y: number };

export type ShotTransition = {
  type: "cut" | "fade" | "slide" | "wipe" | "flash" | "zoom-punch" | "light-leak" | "frost-dissolve" | "iris" | "clock-wipe";
  duration?: number;
  /** The two shots are back-to-back in the original recording: crossfade between the SAME moment
      in both (one continuous voice, nothing overlaps or repeats) instead of overlapping two moments. */
  continuous?: boolean;
};

export type Shot = {
  id: string;
  clip: string;
  in: number;
  out: number;
  label?: string;
  audio?: "keep" | "mute";
  /** extra voice gain in dB on top of automatic loudness levelling */
  gainDb?: number;
  /** where the important subject is (0–1). Zooms push towards it; landscape clips are cropped around it */
  focus?: Focus;
  zooms?: Zoom[];
  /** gentle continuous push-in for life (0 = off). Default from edit.look.breathing */
  breathing?: number;
  /** transition INTO this shot from the previous one */
  transition?: ShotTransition;
  /** CINEMATIC COMPOSITE: real subject (matte) over a generated environment. Omit = original background. */
  composite?: {
    plate: string;
    dof?: number;
    plateTint?: string;
    plateBrightness?: number;
    light?: { exposure?: number; warmth?: number; saturation?: number };
    rim?: string;
    shadow?: boolean;
    atmosphere?: "frost" | "warm" | "none";
    parallax?: number;
    floorShadeFrom?: number;
    floorShade?: number;
  };
};

export type Evidence = { quote?: string; fact?: string; note?: string };
export type LayerSource = "transcript" | "facts" | "design" | "placeholder";

export type Layer = {
  id: string;
  type:
    | "broll"
    | "fullscreen"
    | "keyword"
    | "statement"
    | "lowerThird"
    | "counter"
    | "chart"
    | "steps"
    | "callout"
    | "badge"
    | "cta"
    | "chapter"
    | "progress"
    | "dial"
    | "board"
    | "typeset"
    | "scene";
  at: TimeRef;
  /** seconds, or "quote" = until the anchored words finish (+ 0.6s) */
  duration?: number | "quote";
  /** where the content comes from — drives the safety checks */
  source: LayerSource;
  evidence?: Evidence;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
};

export type Facts = Record<string, { value: string | number; label?: string; confirmed: boolean; note?: string }>;

export type EditFile = {
  project: string;
  brand: "yapakcik-frozen" | "project-am";
  title?: string;
  shots: Shot[];
  layers: Layer[];
  captions: {
    enabled: boolean;
    style: "bold" | "documentary" | "minimal";
    /** minimal style: words to set larger ("big") or in elegant italic ("script") */
    emphasis?: Record<string, "big" | "script">;
    /** words grouped on screen within this many ms */
    combineMs?: number;
    uppercase?: boolean;
    /** 0–1 from top */
    position?: number;
    /** Unclear speech: audio kept, NO subtitles. Clip-time ranges. */
    hide?: { clip: string; from: number; to: number; reason?: string }[];
  };
  look: {
    grade: string;
    gradeIntensity?: number;
    grain?: boolean;
    vignette?: boolean;
    breathing?: number;
    /** Bars that cover text burned into the source footage (e.g. old app captions).
        y0/y1 = 0–1 of the SOURCE frame height; they move with every zoom. */
    coverBands?: { y0: number; y1: number; clips?: string[] }[];
    /** small "LATAR: VISUAL AI" disclosure on scenes with generated backgrounds */
    aiLabel?: boolean;
    /** ONE CANVAS stage behind split graphics: "paper" (minimal white) or "brand" (YaPakCik navy) */
    canvas?: "paper" | "brand";
  };
  audio: {
    /** extra hand-placed sound effects, e.g. { "sfx": "riser", "at": { "quote": "Offal Exp" }, "volume": 0.4 } */
    cues?: { sfx: string; at: TimeRef; volume?: number; playbackRate?: number }[];
    /** path in /public or null for no music */
    music: string | null;
    musicVolume: number;
    /** music level while someone speaks (0–1, relative) */
    duckTo: number;
    sfx: "auto" | "off";
    sfxVolume: number;
    /** target speech loudness for automatic levelling */
    voiceTargetLufs: number;
  };
};

export type MatteInfo = { clip: string; from: number; to: number; fg: string; suspectJumps: number[]; stats: { t: number; area: number; bottom?: number; left?: number; right?: number; top?: number }[] };
export type GeneratedAsset = { file: string; prompt: string; model: string; license: string; reviewed: boolean; reviewNote?: string };

export type StoryBundle = {
  edit: EditFile;
  clips: Record<string, ClipInfo>;
  transcripts: Record<string, ClipTranscript>;
  facts: Facts;
  /** cut-outs made by scripts/story/matte.py, by clip id */
  mattes?: Record<string, MatteInfo>;
  /** AI-generated supporting visuals (public/generated/<project>/manifest.json), by name */
  generated?: Record<string, GeneratedAsset>;
};

/* ───────────────────────────── TEXT HELPERS ───────────────────────────── */

export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/'/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const tokens = (s: string): string[] => normalize(s).split(" ").filter(Boolean);

/* ───────────────────────────── TIMELINE ───────────────────────────── */

export const DEFAULT_TRANSITION_SEC = 0.4;

export type ResolvedShot = Shot & { start: number; duration: number; transitionSec: number };

/** Places shots on the timeline. Non-cut transitions overlap the previous shot. */
export const resolveShots = (shots: Shot[]): { shots: ResolvedShot[]; total: number } => {
  let cursor = 0;
  const out: ResolvedShot[] = [];
  shots.forEach((s, i) => {
    const duration = Math.max(0.1, s.out - s.in);
    const t = i === 0 || !s.transition || s.transition.type === "cut" ? 0 : (s.transition.duration ?? DEFAULT_TRANSITION_SEC);
    const transitionSec = Math.min(t, duration / 2, i > 0 ? out[i - 1].duration / 2 : 0);
    const start = Math.max(0, cursor - transitionSec);
    if (s.transition?.continuous && transitionSec > 0 && i > 0) {
      // begin this shot transitionSec earlier in the source so both shots show the same moment during the blend
      out.push({ ...s, in: Math.max(0, s.in - transitionSec), start, duration: duration + transitionSec, transitionSec });
      cursor = start + duration + transitionSec;
    } else {
      out.push({ ...s, start, duration, transitionSec });
      cursor = start + duration;
    }
  });
  return { shots: out, total: cursor };
};

export type TimelineWord = Word & { shot: string; clip: string; t0: number; t1: number; norm: string };

/** Every spoken word, mapped from clip time to timeline time (muted shots excluded). */
export const timelineWords = (bundle: StoryBundle, shots: ResolvedShot[]): TimelineWord[] => {
  const out: TimelineWord[] = [];
  for (const s of shots) {
    if (s.audio === "mute") continue;
    const tr = bundle.transcripts[s.clip];
    if (!tr) continue;
    for (const seg of tr.segments) {
      for (const w of seg.words) {
        const mid = (w.start + w.end) / 2;
        if (mid < s.in || mid > s.out) continue;
        const t0 = s.start + Math.max(0, w.start - s.in);
        const t1 = s.start + Math.min(s.duration, w.end - s.in);
        const norm = normalize(w.text);
        if (!norm) continue;
        out.push({ ...w, shot: s.id, clip: s.clip, t0, t1, norm });
      }
    }
  }
  // continuous transitions show the same moment twice → keep one copy of each word; keep timeline order
  out.sort((a, b) => a.t0 - b.t0);
  return out.filter((w, i) => !out.slice(Math.max(0, i - 6), i).some((p) => p.norm === w.norm && p.shot !== w.shot && Math.abs(p.t0 - w.t0) < 0.3));
};

/** Finds where a quote is spoken. Returns timeline seconds of its first/last word. */
export const findQuote = (
  words: TimelineWord[],
  anchor: Anchor,
): { start: number; end: number; shot: string } | null => {
  const q = tokens(anchor.quote);
  if (q.length === 0) return null;
  const pool = anchor.shot ? words.filter((w) => w.shot === anchor.shot) : words;
  // tokens of the pool (a Whisper "word" can occasionally contain 2 tokens)
  const flat: { tok: string; w: TimelineWord }[] = [];
  for (const w of pool) for (const tok of w.norm.split(" ")) flat.push({ tok, w });
  let found = 0;
  for (let i = 0; i + q.length <= flat.length; i++) {
    let ok = true;
    for (let j = 0; j < q.length; j++) {
      if (flat[i + j].tok !== q[j]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      found++;
      if (found === (anchor.occurrence ?? 1)) {
        return { start: flat[i].w.t0, end: flat[i + q.length - 1].w.t1, shot: flat[i].w.shot };
      }
    }
  }
  return null;
};

export type ResolvedLayer = Layer & { start: number; dur: number; anchorFound: boolean };

const resolveTime = (ref: TimeRef, words: TimelineWord[]): { t: number; end?: number; ok: boolean } => {
  if (typeof ref === "number") return { t: ref, ok: true };
  const hit = findQuote(words, ref);
  if (!hit) return { t: 0, ok: false };
  const base = ref.edge === "end" ? hit.end : hit.start;
  return { t: Math.max(0, base + (ref.offset ?? 0)), end: hit.end, ok: true };
};

export const resolveLayers = (layers: Layer[], words: TimelineWord[], total: number): ResolvedLayer[] =>
  layers.map((l) => {
    const r = resolveTime(l.at, words);
    let dur: number;
    if (l.duration === "quote") {
      // last as long as the words this graphic is based on: the evidence sentence if it's longer than the anchor
      let end = r.end;
      const ev = l.evidence?.quote;
      if (ev && r.ok) {
        for (let occ = 1; occ < 20; occ++) {
          const hit = findQuote(words, { quote: ev, occurrence: occ });
          if (!hit) break;
          if (hit.end >= r.t && hit.start <= r.t + 0.5) {
            end = Math.max(end ?? 0, hit.end);
            break;
          }
        }
      }
      dur = end !== undefined ? end - r.t + 0.6 : 2.5;
    }
    else dur = l.duration ?? 2.5;
    const start = Math.min(Math.max(0, r.t), Math.max(0, total - 0.2));
    return { ...l, start, dur: Math.max(0.3, Math.min(dur, total - start)), anchorFound: r.ok };
  });

/** Steps/lists: props.revealQuotes → seconds from the layer start when each item is SPOKEN */
export const resolveRevealTimes = (l: ResolvedLayer, words: TimelineWord[]): (number | null)[] | undefined => {
  const qs: string[] | undefined = l.props.revealQuotes;
  if (!qs) return undefined;
  return qs.map((q) => {
    // "words#2" = the 2nd time those words are spoken (e.g. after a cold open repeats a line)
    const m = /^(.*)#(\d+)$/.exec(q);
    const hit = m ? findQuote(words, { quote: m[1], occurrence: Number(m[2]) }) : findQuote(words, { quote: q });
    return hit ? Math.max(0, hit.start - l.start) : null;
  });
};

/** Zoom times inside a shot → seconds from the shot start */
export const resolveZoomTime = (z: Zoom, shot: ResolvedShot, words: TimelineWord[]): number | null => {
  if (typeof z.at === "number") return z.at;
  const hit = findQuote(words, { ...z.at, shot: z.at.shot ?? shot.id });
  if (!hit) return null;
  const base = z.at.edge === "end" ? hit.end : hit.start;
  return base + (z.at.offset ?? 0) - shot.start;
};

/** Speech regions on the timeline (for ducking music under the voice). */
export const speechRegions = (words: TimelineWord[], gap = 0.6): { from: number; to: number }[] => {
  const out: { from: number; to: number }[] = [];
  for (const w of words) {
    const last = out[out.length - 1];
    if (last && w.t0 - last.to <= gap) last.to = Math.max(last.to, w.t1);
    else out.push({ from: w.t0, to: w.t1 });
  }
  return out;
};

/* ───────────────────────────── ZOOM CURVE ───────────────────────────── */

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutBack = (x: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Scale of a shot at `t` seconds from its start, given resolved zoom events. */
export const zoomScaleAt = (
  t: number,
  events: { at: number; type: ZoomType; scale?: number; duration?: number }[],
  shotDuration: number,
  breathing = 0,
): number => {
  const sorted = [...events].filter((e) => e.at >= -0.001).sort((a, b) => a.at - b.at);
  let value = 1;
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (t < e.at) break;
    const from = value;
    const defaults: Record<ZoomType, { scale: number; duration: number }> = {
      "punch-in": { scale: 1.22, duration: 0.12 },
      "punch-out": { scale: 1, duration: 0.12 },
      "zoom-in": { scale: 1.15, duration: 1.2 },
      "zoom-out": { scale: 1, duration: 1.2 },
      push: { scale: 1.12, duration: Math.max(0.5, (sorted[i + 1]?.at ?? shotDuration) - e.at) },
      reset: { scale: 1, duration: 0.01 },
    };
    const to = e.scale ?? defaults[e.type].scale;
    const d = Math.max(0.01, e.duration ?? defaults[e.type].duration);
    const p = Math.min(1, (t - e.at) / d);
    const eased =
      e.type === "punch-in" || e.type === "punch-out" ? easeOutBack(p) : e.type === "push" ? p : easeInOut(p);
    value = from + (to - from) * eased;
  }
  // gentle "breathing" push across the whole shot
  return value * (1 + breathing * Math.min(1, Math.max(0, t / Math.max(0.1, shotDuration))));
};

/* ───────────────────────────── CAPTIONS ───────────────────────────── */

export type CaptionPage = { start: number; end: number; words: { text: string; t0: number; t1: number }[] };

/**
 * Groups spoken words into short caption "pages".
 * Breaks on pauses, sentence ends, or when a page gets too long.
 * Words are shown EXACTLY as transcribed (dialect preserved).
 */
export const buildCaptionPages = (
  words: TimelineWord[],
  opts: { maxWords?: number; maxChars?: number; pauseBreak?: number; maxPageSec?: number } = {},
): CaptionPage[] => {
  const maxWords = opts.maxWords ?? 4;
  const maxChars = opts.maxChars ?? 22;
  const pauseBreak = opts.pauseBreak ?? 0.45;
  const maxPageSec = opts.maxPageSec ?? 2.4;
  const pages: CaptionPage[] = [];
  let cur: CaptionPage | null = null;
  for (const w of words) {
    const text = w.text.trim();
    if (!text) continue;
    const chars = cur ? cur.words.map((x) => x.text).join(" ").length + 1 + text.length : text.length;
    const brk =
      !cur ||
      w.t0 - cur.end > pauseBreak ||
      cur.words.length >= maxWords ||
      chars > maxChars ||
      w.t1 - cur.start > maxPageSec ||
      /[.!?]$/.test(cur.words[cur.words.length - 1]?.text ?? "");
    if (brk) {
      cur = { start: w.t0, end: w.t1, words: [] };
      pages.push(cur);
    }
    // reduplication written by Whisper as "siapa" + "-siapa" → show "siapa-siapa"
    const last = cur!.words[cur!.words.length - 1];
    if (text.startsWith("-") && last && !brk) {
      last.text += text;
      last.t1 = w.t1;
    } else cur!.words.push({ text, t0: w.t0, t1: w.t1 });
    cur!.end = w.t1;
  }
  // keep each page on screen until the next one starts (max +0.5s)
  for (let i = 0; i < pages.length; i++) {
    const next = pages[i + 1];
    pages[i].end = next ? Math.min(next.start, pages[i].end + 0.5) : pages[i].end + 0.5;
  }
  return pages;
};

/* ───────────────────────────── NUMBERS (Malay incl. Kelantan, English) ───────────────────────────── */

const UNITS: Record<string, number> = {
  kosong: 0, sifar: 0, zero: 0,
  satu: 1, sa: 1, se: 1, one: 1,
  dua: 2, duo: 2, two: 2,
  tiga: 3, tigo: 3, three: 3,
  empat: 4, ampat: 4, pat: 4, four: 4,
  lima: 5, limo: 5, five: 5,
  enam: 6, anam: 6, nam: 6, six: 6,
  tujuh: 7, tujoh: 7, seven: 7,
  lapan: 8, delapan: 8, eight: 8,
  sembilan: 9, sembile: 9, smile: 9, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SPECIAL: Record<string, number> = { sepuluh: 10, sepuloh: 10, sebelas: 11, seratus: 100, seratuh: 100, seribu: 1000, sejuta: 1_000_000 };
const MULT: Record<string, number> = {
  belas: 10, puluh: 10, puloh: 10, ratus: 100, ratuh: 100, ribu: 1000, juta: 1_000_000,
  hundred: 100, thousand: 1000, million: 1_000_000,
};

/** Extracts every number spoken or written in a text: "lapan minit" → [8], "RM12.90" → [12.9], "dua ratus" → [200] */
export const extractNumbers = (text: string): number[] => {
  const out: number[] = [];
  // digits (12, 12.90, 12,90, 1,000)
  for (const m of text.matchAll(/\d+(?:[.,]\d+)*/g)) {
    const raw = m[0];
    const v = /^\d{1,3}(,\d{3})+$/.test(raw) ? Number(raw.replace(/,/g, "")) : Number(raw.replace(",", "."));
    if (!Number.isNaN(v)) out.push(v);
  }
  // words — each comma/full-stop separated chunk is parsed on its own
  for (const chunk of text.split(/[,.;:!?\n]+/)) {
    const toks = tokens(chunk);
    let total = 0; // thousands and above
    let current = 0; // below a thousand
    let pending = 0; // last single unit (1–9) waiting for belas/puluh/ratus
    let hasPending = false;
    let active = false;
    const flush = () => {
      if (active) out.push(total + current + (hasPending ? pending : 0));
      total = 0;
      current = 0;
      pending = 0;
      hasPending = false;
      active = false;
    };
    for (const t of toks) {
      const isAmbiguous = t === "sa" || t === "se" || t === "pat" || t === "nam" || t === "smile";
      if (t in SPECIAL) {
        const v = SPECIAL[t];
        if (hasPending) flush();
        if (v >= 1000) {
          total += v;
        } else current += v;
        active = true;
      } else if (t in UNITS && !isAmbiguous) {
        const v = UNITS[t];
        if (v >= 10) {
          // English teens/tens: "twenty" then maybe "five"
          if (hasPending) flush();
          current += v;
        } else {
          if (hasPending) flush(); // "dua tiga" = two separate numbers
          pending = v;
          hasPending = true;
        }
        active = true;
      } else if (t in MULT && active) {
        if (t === "belas") {
          current += 10 + (hasPending ? pending : 1);
        } else if (t === "puluh" || t === "puloh") {
          current += (hasPending ? pending : 1) * 10;
        } else if (t === "ratus" || t === "ratuh" || t === "hundred") {
          current += (hasPending ? pending : 1) * 100;
        } else {
          // ribu / juta / thousand / million
          total += (current + (hasPending ? pending : 0) || 1) * MULT[t];
          current = 0;
        }
        pending = 0;
        hasPending = false;
      } else flush();
    }
    flush();
  }
  return out;
};

/* ───────────────────────────── CLAIM GUARDRAILS ───────────────────────────── */

/** Words that make a graphic a factual/business CLAIM needing proof. */
const CLAIM_PATTERNS: RegExp[] = [
  /\d/,
  /\brm\b|ringgit|\$|harga|price|diskaun|discount|promo|percuma|free\b/i,
  /halal|jakim|kkm|mesti\b|haccp|gmp|iso\s?\d|sijil|certif|lulus|approved|lesen|license/i,
  /organi[ck]|tanpa\s+msg|no\s+msg|bebas\s+msg|pengawet|preservative|semula\s+jadi|natural|asli|100\s*%/i,
  /terbaik|paling|nombor\s+(satu|1)|no\.?\s*1\b|best|#1|top|terlaris|best\s*seller|award|anugerah/i,
  /\bkg\b|\bgram\b|\bg\b|\bml\b|\bminit\b|minute|kalori|calorie|protein|°c|celsius/i,
];

export const isClaim = (text: string): boolean => CLAIM_PATTERNS.some((r) => r.test(text));

/** All human-readable text a layer will show on screen. */
export const layerTexts = (l: Layer): string[] => {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (typeof v === "number") out.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => {
      // non-visible technical fields
      if (["clip", "src", "image", "icon", "plate", "kind", "style", "position", "color", "align", "focus", "zooms", "in", "variant", "revealQuotes", "revealAt", "highlight", "animation", "transition", "x", "y", "side", "volume", "breathing", "hideCaptions", "fullscreen", "bar", "decimals", "behind", "card", "count", "size", "floorShadeFrom", "floorShade", "variant", "dark", "image", "dim", "layout", "kind", "icons", "track", "hits", "top", "icon", "y", "h", "scale", "backdrop"].includes(k)) return;
      walk(x);
    });
  };
  walk(l.props);
  return out;
};

export type Issue = { level: "error" | "warning" | "info"; where: string; message: string };

/**
 * THE SAFETY CHECK. Blocks the final export when graphics could show something
 * that wasn't actually said or confirmed:
 *  - missing clips / cut points outside the clip
 *  - quotes (anchors / evidence) that are not in the transcript
 *  - numbers on screen that don't appear in the quoted speech or the confirmed fact
 *  - claims (price, halal, specs, "best"…) without evidence
 *  - placeholders still in the edit (blocked in final mode)
 *  - zooms that would make the footage blurry
 */
export const checkBundle = (bundle: StoryBundle, opts: { final: boolean }): Issue[] => {
  const issues: Issue[] = [];
  const add = (level: Issue["level"], where: string, message: string) => issues.push({ level, where, message });
  const { edit, clips, transcripts, facts } = bundle;

  if (edit.shots.length === 0) add("error", "timeline", "The timeline has no shots.");

  // shots
  for (const s of edit.shots) {
    const c = clips[s.clip];
    if (!c) {
      add("error", `shot ${s.id}`, `clip "${s.clip}" not found — run ingest, or check the name in footage.json`);
      continue;
    }
    if (s.in < 0 || s.out <= s.in) add("error", `shot ${s.id}`, `in (${s.in}) must be ≥ 0 and smaller than out (${s.out})`);
    if (s.out > c.duration + 0.05) add("error", `shot ${s.id}`, `out ${s.out}s is past the end of "${s.clip}" (${c.duration.toFixed(2)}s)`);
    if (s.audio !== "mute" && !c.hasAudio) add("warning", `shot ${s.id}`, `"${s.clip}" has no audio track`);
    if (s.audio !== "mute" && !transcripts[s.clip]) add("warning", `shot ${s.id}`, `no transcript for "${s.clip}" — subtitles and quote anchors won't work for this shot`);
  }

  const { shots, total } = resolveShots(edit.shots);
  const words = timelineWords(bundle, shots);

  // zoom quality: scale beyond the source's native resolution
  for (const s of shots) {
    const c = clips[s.clip];
    if (!c) continue;
    const coverScale = Math.max(1080 / c.width, 1920 / c.height); // scale needed to fill 1080x1920
    const maxZoom = Math.max(1, ...(s.zooms ?? []).map((z) => z.scale ?? (z.type === "punch-in" ? 1.22 : z.type === "zoom-in" ? 1.15 : z.type === "push" ? 1.12 : 1)));
    const upscale = coverScale * maxZoom * (1 + (s.breathing ?? edit.look.breathing ?? 0));
    if (upscale > 1.6) add("warning", `shot ${s.id}`, `zoom upscales the source ${upscale.toFixed(2)}× — may look soft (source ${c.width}x${c.height})`);
    for (const z of s.zooms ?? []) {
      const t = resolveZoomTime(z, s, words);
      if (t === null) add("error", `shot ${s.id} zoom`, `quote "${(z.at as Anchor).quote}" not found in this shot's transcript`);
      else if (t < 0 || t > s.duration) add("warning", `shot ${s.id} zoom`, `zoom at ${t.toFixed(2)}s is outside the shot (0–${s.duration.toFixed(2)}s)`);
    }
  }

  // layers
  const layers = resolveLayers(edit.layers, words, total);
  const transcriptText = (shotFilter?: string) =>
    words.filter((w) => !shotFilter || w.shot === shotFilter).map((w) => w.norm).join(" ");

  for (const l of layers) {
    const where = `layer ${l.id} (${l.type})`;
    if (!l.anchorFound) add("error", where, `quote "${(l.at as Anchor).quote}" not found in the transcript — check the exact words`);
    if (l.type === "broll" && !l.props.image) {
      const c = clips[l.props.clip];
      if (!c) add("error", where, `b-roll clip "${l.props.clip}" not found`);
      else if ((l.props.in ?? 0) + l.dur > c.duration + 0.05) add("error", where, `b-roll needs ${l.dur.toFixed(1)}s from ${l.props.in ?? 0}s but "${l.props.clip}" is only ${c.duration.toFixed(1)}s`);
    }

    const reveals = resolveRevealTimes(l, words);
    reveals?.forEach((r, i) => {
      if (r === null) add("error", where, `revealQuotes[${i}] "${l.props.revealQuotes[i]}" not found in the transcript`);
      else if (r > l.dur) add("warning", where, `item ${i + 1} is spoken after this layer ends (${r.toFixed(1)}s > ${l.dur.toFixed(1)}s)`);
    });
    const texts = layerTexts(l);
    const joined = texts.join(" ");
    const hasPlaceholder = /placeholder|\[.*?\]|xxx/i.test(joined);
    if (l.source === "placeholder" || hasPlaceholder) {
      add(opts.final ? "error" : "warning", where, `contains a PLACEHOLDER — replace it with real content before the final export`);
      continue;
    }

    if (l.source === "transcript") {
      const q = l.evidence?.quote ?? (typeof l.at === "object" ? l.at.quote : undefined);
      if (!q) {
        add("error", where, `source "transcript" needs evidence.quote (the exact spoken words this graphic is based on)`);
        continue;
      }
      if (!transcriptText().includes(tokens(q).join(" "))) {
        add("error", where, `evidence quote "${q}" is not in the transcript`);
        continue;
      }
      const spokenNums = extractNumbers(q);
      for (const n of extractNumbers(joined)) {
        if (!spokenNums.some((x) => Math.abs(x - n) < 1e-9)) add("error", where, `shows the number ${n}, but the quote "${q}" doesn't contain it`);
      }
    } else if (l.source === "facts") {
      const key = l.evidence?.fact;
      const f = key ? facts[key] : undefined;
      if (!key || !f) {
        add("error", where, `source "facts" needs evidence.fact pointing to an entry in facts.json`);
        continue;
      }
      if (!f.confirmed) {
        add(opts.final ? "error" : "warning", where, `fact "${key}" is not confirmed yet in facts.json`);
        continue;
      }
      const factNums = extractNumbers(String(f.value));
      for (const n of extractNumbers(joined)) {
        if (!factNums.some((x) => Math.abs(x - n) < 1e-9)) add("error", where, `shows the number ${n}, but fact "${key}" is "${f.value}"`);
      }
    } else if (l.source === "design") {
      // design text = labels/titles. It must not make claims.
      for (const t of texts) {
        if (isClaim(t)) add("error", where, `"${t}" looks like a claim (number/price/certification/spec/superlative) — use source "transcript" or "facts" with evidence`);
      }
    }
  }

  // ── CINEMATIC COMPOSITING RULES ──
  const genFiles = new Map(Object.values(bundle.generated ?? {}).map((g) => [g.file, g]));
  for (const s of edit.shots) {
    if (!s.composite) continue;
    const where = `shot ${s.id} (composite)`;
    const g = genFiles.get(s.composite.plate);
    if (s.composite.plate === "original") {
      /* depth layering over the real footage itself — nothing generated */
    } else if (!g) add("error", where, `background "${s.composite.plate}" is not in the generated-assets manifest`);
    else if (!g.reviewed) add(opts.final ? "error" : "warning", where, `background "${s.composite.plate}" has not been reviewed yet (must contain no people, food or products)`);
    const m = bundle.mattes?.[s.clip];
    if (!m) add("error", where, `no cut-out for clip "${s.clip}" — run story:matte first`);
    else {
      if (s.in < m.from - 0.05 || s.out > m.to + 0.05) add("error", where, `cut-out covers ${m.from}–${m.to.toFixed(2)}s but the shot needs ${s.in}–${s.out}s`);
      const bad = m.suspectJumps.filter((t) => t >= s.in && t <= s.out);
      if (bad.length) add("warning", where, `${bad.length} frame(s) with sudden mask changes at ${bad.slice(0, 5).map((t) => t.toFixed(2) + "s").join(", ")} — check edges, or use the original background for this shot`);
    }
    const L = s.composite.light ?? {};
    if (Math.abs(L.exposure ?? 0) > 0.3) add("error", where, `subject exposure ${L.exposure} is outside the natural range (±0.3)`);
    if (Math.abs(L.warmth ?? 0) > 0.3) add("error", where, `subject warmth ${L.warmth} is outside the natural range (±0.3)`);
    if (L.saturation !== undefined && (L.saturation < 0.85 || L.saturation > 1.15)) add("error", where, `subject saturation ${L.saturation} is outside the natural range (0.85–1.15)`);
  }
  for (const l of edit.layers) {
    const img: string | undefined = l.props?.image;
    if (l.type === "broll" && img && (img.startsWith("generated/") || genFiles.has(img)))
      add("error", `layer ${l.id}`, `b-roll must be REAL footage/photos — "${img}" is AI-generated (use it only as a background plate)`);
  }

  // overlapping full-picture layers
  const pictures = layers.filter((l) => l.type === "broll" || l.type === "fullscreen" || l.type === "chapter").sort((a, b) => a.start - b.start);
  for (let i = 1; i < pictures.length; i++) {
    if (pictures[i].start < pictures[i - 1].start + pictures[i - 1].dur - 0.05)
      add("warning", `layer ${pictures[i].id}`, `overlaps full-screen layer ${pictures[i - 1].id}`);
  }

  // transcript review hints
  for (const [clip, tr] of Object.entries(transcripts)) {
    const low = tr.segments.flatMap((s) => s.words).filter((w) => (w.prob ?? 1) < 0.5);
    if (low.length) add("info", `transcript ${clip}`, `${low.length} low-confidence word(s) to review: ${low.slice(0, 8).map((w) => `"${w.text.trim()}"@${w.start.toFixed(1)}s`).join(", ")}${low.length > 8 ? "…" : ""}`);
    if (tr.estimatedWordTiming) add("info", `transcript ${clip}`, `word timing estimated from SRT lines (karaoke highlight approximate)`);
  }
  if (edit.captions.enabled && words.length === 0) add("warning", "captions", "captions are on but no spoken words were found");
  const hidden = words.length - captionWords(words, edit.captions.hide).length;
  if (hidden) add("info", "captions", `${hidden} unclear word(s) have NO subtitles (audio kept): ${(edit.captions.hide ?? []).map((h) => `${h.clip}@${h.from}-${h.to}s${h.reason ? " (" + h.reason + ")" : ""}`).join(", ")}`);
  for (const l of layers.filter((x) => x.type === "broll" && x.props.image)) {
    if (!/\.(jpe?g|png|webp)$/i.test(l.props.image)) add("error", `layer ${l.id}`, `image "${l.props.image}" must be a .jpg/.png/.webp inside public/`);
  }

  return issues;
};

/** Words shown as subtitles (timeline words minus ranges marked unclear in captions.hide). */
export const captionWords = (words: TimelineWord[], hide: EditFile["captions"]["hide"] = []): TimelineWord[] =>
  words.filter((w) => !hide.some((h) => h.clip === w.clip && (w.start + w.end) / 2 >= h.from && (w.start + w.end) / 2 <= h.to));

/** Everything the video component needs, computed once. */
export const resolveStory = (bundle: StoryBundle) => {
  const { shots, total } = resolveShots(bundle.edit.shots);
  const words = timelineWords(bundle, shots);
  const layers = resolveLayers(bundle.edit.layers, words, total);
  return { shots, total, words, layers, speech: speechRegions(words) };
};
