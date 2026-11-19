import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_STACKS } from "../../shared/fonts";
import { CANVAS } from "../Canvas";

/**
 * YAPAKCIK FROZEN SCENES: the brand's motion-graphics kit.
 *
 * Every scene is drawn (vector illustration + type); there are NO pictures of products here.
 * The real product only ever appears in the real footage (the presenter window / tracked callout).
 * Every element appears when it is SPOKEN (rv = frames from the layer start, from revealQuotes).
 *
 *   hook        kinetic headline words, one by one
 *   chicken     whole chicken → breast highlight → RUGI → fillet pieces → FILLET (one story)
 *   list        numbered product cards
 *   plates      15–20 pinggan gauge
 *   prep        belah dua (knife split) → katok (mallet hits) → tepung roti (crumbs) → goreng (heat)
 *   count       "23–26 keping" with a fillet grid
 *   price       big price + chips
 *   tiers       price ladder (sepaket → sekotak → 5 kotak ke atas)
 *   bulk        boxes stacking, 10 → 20 kotak
 *   endcard     wordmark + schematic map of the branches
 *   nametag     lower-third name tag (over the footage)
 *   labels      FRY | GRILL labels (over the footage)
 *   track       circle + arrow + label following the real pack (from scripts/story/track.py)
 */

export const YPF = {
  navy: "#06182f",
  deep: "#0b2a52",
  blue: "#1565c0",
  cyan: "#29b6f6",
  ice: "#cdeeff",
  white: "#ffffff",
  red: "#ff4d2e",
  gold: "#ffc531",
  orange: "#ff8a1f",
  skin: "#f6cdb0",
  skinDark: "#e7a98a",
  crumb: "#e8a53c",
};
const HEAD = FONT_STACKS.montserrat;
const GOLD_TEXT: React.CSSProperties = { background: `linear-gradient(180deg, #ffe08a 0%, ${YPF.gold} 45%, ${YPF.orange} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
const ICE_TEXT: React.CSSProperties = { background: `linear-gradient(180deg, #ffffff 0%, ${YPF.ice} 60%, ${YPF.cyan} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };

export type SceneProps = { dur: number; rv: number[]; props: Record<string, any>; split: boolean }; // eslint-disable-line @typescript-eslint/no-explicit-any

/* ───────────── motion helpers ───────────── */
const useP = (at: number, len = 14, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 170, mass: 0.7 }, durationInFrames: len });
};
const lin = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** pops in: scale overshoot + blur → sharp */
const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ at, children, style, from = 0.6 }) => {
  const p = useP(at, 16, 11);
  const frame = useCurrentFrame();
  const vis = frame >= at ? 1 : 0;
  return <div style={{ opacity: Math.min(1, p * 1.4) * vis, transform: `scale(${from + (1 - from) * p})`, filter: `blur(${Math.max(0, (1 - p) * 10)}px)`, ...style }}>{children}</div>;
};
/** slides in from a side */
const Slide: React.FC<{ at: number; children: React.ReactNode; dx?: number; dy?: number; style?: React.CSSProperties }> = ({ at, children, dx = 0, dy = 40, style }) => {
  const p = useP(at, 18, 15);
  const frame = useCurrentFrame();
  return <div style={{ opacity: frame >= at ? Math.min(1, p * 1.5) : 0, transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px)`, ...style }}>{children}</div>;
};
/** light sweep across a headline */
const Shine: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame - at, [0, 18], [-60, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      <span style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, transparent ${x - 20}%, rgba(255,255,255,0.75) ${x}%, transparent ${x + 20}%)`, mixBlendMode: "overlay", pointerEvents: "none" }} />
    </span>
  );
};

/** region above the presenter window (split) or the whole frame */
const Region: React.FC<{ split: boolean; dur: number; children: React.ReactNode }> = ({ split, dur, children }) => {
  const frame = useCurrentFrame();
  const fadeIn = lin(frame, 0, 6);
  const fadeOut = split ? 1 - lin(frame, dur - 24, dur - 15) : 1 - lin(frame, dur - 8, dur);
  const top = split ? CANVAS.regionTop - 10 : 0;
  const h = split ? CANVAS.regionBottom - CANVAS.regionTop + 30 : 1920;
  return <div style={{ position: "absolute", left: 0, top, width: 1080, height: h, opacity: Math.min(fadeIn, fadeOut) }}>{children}</div>;
};

const Kicker: React.FC<{ at: number; text?: string; top?: number }> = ({ at, text, top = 0 }) =>
  text ? (
    <Slide at={at} dy={-14} style={{ position: "absolute", top, width: 1080, textAlign: "center" }}>
      <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 30, letterSpacing: 7, color: YPF.ice, textTransform: "uppercase", opacity: 0.85 }}>{text}</span>
    </Slide>
  ) : null;

/* ───────────── illustrations (vector, clearly drawn) ───────────── */
/**
 * Whole raw chicken, BREAST SIDE UP, seen from the side (how it sits on a tray or in a roasting pan):
 * the big top dome is the breast (isi dada), legs/drumsticks at the cavity end, wing tucked at the front.
 * `lift` raises the breast slightly off the bird (exploded view) so viewers see exactly which part it is.
 */
const BREAST_PATH = "M 150 122 C 200 94, 300 84, 372 116 C 406 140, 420 178, 418 204 C 360 214, 252 218, 168 208 C 154 182, 148 150, 150 122 Z";
const Chicken: React.FC<{ glow: number; dim: number; lift: number }> = ({ glow, dim, lift }) => (
  <svg viewBox="0 0 480 330" width={480} height={330} style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="ck-skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbe3d3" />
        <stop offset="55%" stopColor="#f3c7ae" />
        <stop offset="100%" stopColor="#dc9d80" />
      </linearGradient>
      <linearGradient id="ck-leg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f7d2bd" />
        <stop offset="100%" stopColor="#d99478" />
      </linearGradient>
      <linearGradient id="ck-breast-hi" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe9a8" />
        <stop offset="100%" stopColor="#f6b94a" />
      </linearGradient>
      <radialGradient id="ck-sheen" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* tray shadow */}
    <ellipse cx={245} cy={292} rx={205} ry={20} fill="rgba(0,0,0,0.35)" />
    <g style={{ filter: `saturate(${1 - dim * 0.85}) brightness(${1 - dim * 0.4})` }}>
      {/* far drumstick (behind) */}
      <g transform="translate(26 -8)" opacity={0.85}>
        <path d="M 92 206 C 74 170, 60 134, 52 106 C 48 92, 64 82, 76 94 C 94 120, 118 158, 136 194 Z" fill="#d99478" stroke="#b9745a" strokeWidth={3} />
        <circle cx={54} cy={92} r={10} fill="#f3e3d3" stroke="#d9b9a2" strokeWidth={2} />
        <circle cx={66} cy={84} r={9} fill="#f3e3d3" stroke="#d9b9a2" strokeWidth={2} />
      </g>
      {/* near drumstick + knuckle bone (cavity end) */}
      <path d="M 92 206 C 74 170, 60 134, 52 106 C 48 92, 64 82, 76 94 C 94 120, 118 158, 136 194 Z" fill="url(#ck-leg)" stroke="#c88466" strokeWidth={3} />
      <circle cx={54} cy={92} r={10} fill="#fff4e8" stroke="#d9b9a2" strokeWidth={2} />
      <circle cx={66} cy={84} r={9} fill="#fff4e8" stroke="#d9b9a2" strokeWidth={2} />
      {/* body (back flat on the tray, breast dome on top) */}
      <path d="M 70 250 C 60 170, 120 96, 240 88 C 360 82, 432 150, 426 230 C 423 262, 400 280, 360 284 L 120 286 C 90 284, 72 270, 70 250 Z" fill="url(#ck-skin)" stroke="#c88466" strokeWidth={3} />
      {/* thigh */}
      <ellipse cx={132} cy={222} rx={64} ry={52} transform="rotate(-12 132 222)" fill="url(#ck-leg)" stroke="#c88466" strokeWidth={3} />
      {/* wing tucked at the front */}
      <path d="M 300 222 C 338 204, 392 210, 412 238 C 384 252, 340 258, 304 252 C 297 243, 296 231, 300 222 Z" fill="url(#ck-leg)" stroke="#c88466" strokeWidth={3} />
      <path d="M 412 238 C 424 236, 432 244, 428 252 C 420 254, 414 248, 412 238 Z" fill="#e8ab8f" />
      {/* neck end */}
      <path d="M 421 206 C 446 200, 456 226, 441 240 C 432 246, 424 240, 422 232 Z" fill="#eab298" stroke="#c88466" strokeWidth={3} />
      {/* skin texture + sheen */}
      {Array.from({ length: 55 }).map((_, i) => (
        <circle key={i} cx={110 + random(`pp${i}`) * 300} cy={110 + random(`pq${i}`) * 160} r={1.6} fill="#c98a6e" opacity={0.35} />
      ))}
      <ellipse cx={270} cy={120} rx={120} ry={34} fill="url(#ck-sheen)" />
    </g>
    {/* the breast — highlighted and gently lifted */}
    <path d={BREAST_PATH} fill="none" stroke={YPF.gold} strokeWidth={4} strokeDasharray="10 8" opacity={glow * lift} />
    <g transform={`translate(${12 * lift} ${-34 * lift})`} opacity={glow}>
      <path d={BREAST_PATH} fill="url(#ck-skin)" stroke="#c88466" strokeWidth={3} />
      <path d={BREAST_PATH} fill="url(#ck-breast-hi)" opacity={0.55 + 0.25 * glow} />
      <path d="M 170 140 C 240 112, 320 110, 398 150" stroke="#fff6e0" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d={BREAST_PATH} fill="none" stroke={YPF.gold} strokeWidth={6} style={{ filter: `drop-shadow(0 0 ${14 * glow}px ${YPF.gold})` }} />
    </g>
  </svg>
);

export const Fillet: React.FC<{ w?: number; crumbs?: number; golden?: number; flat?: number; style?: React.CSSProperties }> = ({ w = 220, crumbs = 0, golden = 0, flat = 0, style }) => {
  const sx = 1 + flat * 0.28, sy = 1 - flat * 0.22;
  const base = golden > 0 ? `color-mix(in srgb, ${YPF.skin} ${100 - golden * 100}%, #c97b2a)` : YPF.skin;
  return (
    <svg viewBox="0 0 220 140" width={w} height={(w * 140) / 220} style={{ overflow: "visible", ...style }}>
      <g transform={`translate(110 70) scale(${sx} ${sy}) translate(-110 -70)`}>
        <path d="M 18 82 C 10 40, 70 12, 130 18 C 185 22, 212 52, 200 80 C 188 112, 120 128, 70 120 C 38 114, 22 100, 18 82 Z" fill={base} stroke="#fff" strokeWidth={5} />
        <path d="M 60 60 C 90 48, 130 46, 168 58" stroke="#fff" strokeOpacity={0.55} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M 52 84 C 90 76, 128 78, 172 84" stroke="#fff" strokeOpacity={0.35} strokeWidth={4} fill="none" strokeLinecap="round" />
        {crumbs > 0
          ? Array.from({ length: 70 }).map((_, i) => {
              const x = 30 + random(`cx${i}`) * 165, y = 30 + random(`cy${i}`) * 85;
              const show = random(`cs${i}`) < crumbs;
              return show ? <circle key={i} cx={x} cy={y} r={2.5 + random(`cr${i}`) * 3.5} fill={i % 3 ? YPF.crumb : "#f6c76a"} /> : null;
            })
          : null}
      </g>
    </svg>
  );
};

const Knife: React.FC = () => (
  <svg viewBox="0 0 300 70" width={300} height={70}>
    <path d="M 10 40 L 200 18 L 210 52 L 20 52 Z" fill="#e8eef5" stroke="#fff" strokeWidth={3} />
    <path d="M 20 48 L 205 40" stroke="#b9c6d4" strokeWidth={3} />
    <rect x={205} y={22} width={88} height={30} rx={12} fill="#2b2f36" stroke="#fff" strokeWidth={3} />
    <circle cx={235} cy={37} r={4} fill="#c7ced8" />
    <circle cx={262} cy={37} r={4} fill="#c7ced8" />
  </svg>
);
const Mallet: React.FC = () => (
  <svg viewBox="0 0 120 260" width={120} height={260}>
    <rect x={52} y={70} width={16} height={185} rx={8} fill="#a8703f" stroke="#fff" strokeWidth={3} />
    <rect x={8} y={8} width={104} height={70} rx={14} fill="#d7dde5" stroke="#fff" strokeWidth={4} />
    {Array.from({ length: 4 }).map((_, i) => <line key={i} x1={20 + i * 26} y1={16} x2={20 + i * 26} y2={70} stroke="#9aa6b5" strokeWidth={3} />)}
  </svg>
);
export const PanIcon: React.FC<{ s?: number }> = ({ s = 64 }) => (
  <svg viewBox="0 0 100 60" width={s} height={(s * 60) / 100}>
    <ellipse cx={40} cy={34} rx={36} ry={18} fill="#2b2f36" stroke="#fff" strokeWidth={4} />
    <rect x={72} y={28} width={26} height={9} rx={4} fill="#2b2f36" stroke="#fff" strokeWidth={3} />
  </svg>
);
export const FlameIcon: React.FC<{ s?: number }> = ({ s = 64 }) => (
  <svg viewBox="0 0 60 80" width={(s * 60) / 80} height={s}>
    <path d="M 30 4 C 40 22, 56 32, 54 52 C 52 70, 40 78, 30 78 C 18 78, 6 68, 6 52 C 6 38, 16 30, 20 20 C 24 30, 28 32, 30 34 C 32 24, 30 14, 30 4 Z" fill={YPF.orange} stroke="#fff" strokeWidth={3} />
    <path d="M 30 44 C 36 52, 42 56, 40 64 C 38 72, 22 72, 21 63 C 20 56, 26 52, 30 44 Z" fill={YPF.gold} />
  </svg>
);
const Plate: React.FC<{ s?: number }> = ({ s = 90 }) => (
  <svg viewBox="0 0 100 100" width={s} height={s}>
    <circle cx={50} cy={50} r={46} fill="#f4f8fc" stroke="#fff" strokeWidth={3} />
    <circle cx={50} cy={50} r={32} fill="none" stroke="#c9d6e3" strokeWidth={3} />
    <path d="M 30 56 C 28 40, 52 34, 66 40 C 76 46, 72 62, 56 64 C 44 66, 32 64, 30 56 Z" fill="#d48a3a" />
  </svg>
);
const BoxIcon: React.FC<{ s?: number }> = ({ s = 110 }) => (
  <svg viewBox="0 0 120 100" width={s} height={(s * 100) / 120}>
    <rect x={6} y={18} width={108} height={76} rx={6} fill="#c8955a" stroke="#fff" strokeWidth={4} />
    <rect x={6} y={6} width={108} height={22} rx={5} fill="#d9a86c" stroke="#fff" strokeWidth={4} />
    <rect x={52} y={6} width={16} height={88} fill="#e9c48f" />
    <text x={60} y={72} textAnchor="middle" fontFamily={HEAD} fontWeight={900} fontSize={18} fill="#7a4c1f">YPF</text>
  </svg>
);

/* ───────────── scenes ───────────── */

const HookScene: React.FC<SceneProps> = ({ rv, props, split }) => {
  // props.words: [{ text, size: "s"|"m"|"xl", style?: "gold"|"ice"|"script" }]
  const words: { text: string; size?: string; style?: string }[] = props.words ?? [];
  const SZ: Record<string, number> = { s: 42, m: 70, l: 120, xl: 146 };
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: split ? 0 : (props.y ?? 170), height: split ? "100%" : (props.h ?? 520), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
      {words.map((w, i) => (
        <Pop key={i} at={rv[i] ?? i * 6} from={w.size === "xl" ? 1.35 : 0.6}>
          <div
            style={{
              fontFamily: w.style === "script" ? FONT_STACKS.playfairItalic : HEAD,
              fontStyle: w.style === "script" ? "italic" : "normal",
              fontWeight: w.style === "script" ? 500 : w.size === "s" ? 700 : 900,
              fontSize: SZ[w.size ?? "m"],
              lineHeight: 0.98,
              letterSpacing: w.size === "xl" ? -3 : w.size === "s" ? 4 : -1,
              textTransform: w.style === "script" ? "none" : "uppercase",
              color: YPF.white,
              ...(w.style === "gold" ? GOLD_TEXT : w.style === "ice" ? ICE_TEXT : {}),
              textShadow: w.style === "gold" || w.style === "ice" ? undefined : "0 6px 30px rgba(0,0,0,0.45)",
            }}
          >
            {w.style === "gold" ? <Shine at={(rv[i] ?? 0) + 6}>{w.text}</Shine> : w.text}
          </div>
        </Pop>
      ))}
    </div>
  );
};

const ChickenScene: React.FC<SceneProps> = ({ rv, props, dur }) => {
  const frame = useCurrentFrame();
  const [tAppear = 0, tBreast = 20, tRugi = 40, tRight = 70, tFillet = 90] = rv;
  const glow = useP(tBreast, 16, 12);
  const rugi = useP(tRugi, 14, 9);
  const right = useP(tRight, 20, 16);
  const pulse = 0.85 + 0.15 * Math.sin((frame - tBreast) / 4);
  const shift = right; // chicken moves left when the fillet side arrives
  const stampShake = frame >= tRugi && frame < tRugi + 8 ? Math.sin(frame * 3) * 8 * (1 - (frame - tRugi) / 8) : 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* LEFT: ayam seekor */}
      <div style={{ position: "absolute", top: 40, left: 130 - shift * 210, transform: `scale(${1.18 - shift * 0.55}) translateX(${stampShake}px)`, transformOrigin: "50% 30%" }}>
        <Pop at={tAppear}>
          <div style={{ width: 480, textAlign: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: YPF.ice, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>{props.leftTitle ?? "Ayam seekor"}</div>
          <Chicken glow={frame >= tBreast ? glow * (frame >= tRugi ? 1 : pulse) : 0} dim={rugi * 0.8} lift={glow} />
        </Pop>
        {/* breast label */}
        <div style={{ position: "absolute", top: 40, left: 500, opacity: frame >= tBreast ? glow * (1 - shift) : 0, transform: `translateX(${(1 - glow) * 30}px)`, whiteSpace: "nowrap" }}>
          <svg width={150} height={110} style={{ position: "absolute", left: -150, top: 44 }}>
            <path d="M 140 10 C 90 10, 50 30, 22 86" stroke={YPF.gold} strokeWidth={5} fill="none" strokeLinecap="round" />
            <path d="M 10 72 L 20 92 L 38 78" stroke={YPF.gold} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 50, color: YPF.gold, lineHeight: 1 }}>{props.breastLabel ?? "ISI DADA"}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 30, color: YPF.white, marginTop: 4 }}>{props.breastSub ?? "sahaja"}</div>
        </div>
        {/* RUGI stamp (over the rest of the bird) */}
        {frame >= tRugi ? (
          <div style={{ position: "absolute", top: 230, left: 40, transform: `rotate(-10deg) scale(${2.2 - 1.2 * rugi})`, opacity: Math.min(1, rugi * 2) }}>
            <div style={{ border: `8px solid ${YPF.red}`, borderRadius: 18, padding: "4px 28px", fontFamily: HEAD, fontWeight: 900, fontSize: 96, color: YPF.red, letterSpacing: 6, background: "rgba(6,24,47,0.6)" }}>{props.lossLabel ?? "RUGI"}</div>
          </div>
        ) : null}
      </div>
      {/* RIGHT: isi ayam fillet */}
      {frame >= tRight ? (
        <div style={{ position: "absolute", top: 40, left: 470, width: 560, textAlign: "center", opacity: Math.min(1, right * 1.5), transform: `translateX(${(1 - right) * 120}px)` }}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: YPF.ice, letterSpacing: 3, textTransform: "uppercase" }}>{props.rightKicker ?? "nak untung?"}</div>
          <div style={{ position: "relative", height: 250, marginTop: 6 }}>
            {[0, 1, 2].map((i) => (
              <Pop key={i} at={tRight + 4 + i * 4} style={{ position: "absolute", left: 120 + i * 40 - 20, top: 20 + i * 52 }}>
                <Fillet w={240} />
              </Pop>
            ))}
          </div>
          <Pop at={tFillet} from={1.6}>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 132, letterSpacing: -2, lineHeight: 0.95, ...GOLD_TEXT }}>
              <Shine at={tFillet + 6}>{props.hero ?? "FILLET"}</Shine>
            </div>
            <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 36, color: YPF.white, letterSpacing: 4 }}>{props.heroSub ?? "ISI AYAM"}</div>
          </Pop>
        </div>
      ) : null}
      <span style={{ display: "none" }}>{dur}</span>
    </div>
  );
};

const ListScene: React.FC<SceneProps> = ({ rv, props }) => {
  const items: string[] = props.items ?? [];
  const icons = props.icons ?? [];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Kicker at={0} text={props.kicker} top={10} />
      <div style={{ position: "absolute", top: 70, left: 90, right: 150, display: "grid", gap: 18 }}>
        {items.map((it, i) => (
          <Slide key={i} at={rv[i] ?? i * 10} dx={160} dy={0}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, background: "linear-gradient(90deg, rgba(205,238,255,0.16), rgba(205,238,255,0.04))", border: "2px solid rgba(205,238,255,0.25)", borderRadius: 26, padding: "16px 26px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 36, background: `linear-gradient(180deg, ${YPF.gold}, ${YPF.orange})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 900, fontSize: 38, color: YPF.navy, flex: "none" }}>{i + 1}</div>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 50, color: YPF.white, whiteSpace: "nowrap", flex: 1 }}>{it}</div>
              {icons[i] === "fillet" ? <Fillet w={96} golden={0.8} crumbs={0.9} /> : icons[i] === "strips" ? <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map((k) => <div key={k} style={{ width: 22, height: 70, borderRadius: 11, background: "#d79a4e", border: "3px solid #fff", transform: `rotate(${(k - 1) * 12}deg)` }} />)}</div> : icons[i] === "popcorn" ? <div style={{ position: "relative", width: 90, height: 64 }}>{[0, 1, 2, 3, 4].map((k) => <div key={k} style={{ position: "absolute", left: (k % 3) * 26, top: Math.floor(k / 3) * 26 + (k % 2) * 6, width: 34, height: 30, borderRadius: 14, background: "#dd9a45", border: "3px solid #fff" }} />)}</div> : icons[i] === "skewer" ? <svg width={96} height={64} viewBox="0 0 96 64"><line x1={4} y1={58} x2={92} y2={6} stroke="#d8b98a" strokeWidth={4} />{[0, 1, 2].map((k) => <ellipse key={k} cx={28 + k * 22} cy={44 - k * 13} rx={13} ry={10} fill="#dd9a45" stroke="#fff" strokeWidth={3} />)}</svg> : null}
            </div>
          </Slide>
        ))}
      </div>
    </div>
  );
};

const PlatesScene: React.FC<SceneProps> = ({ rv, props }) => {
  const frame = useCurrentFrame();
  const [t0 = 0, tHi = 15, tLo = 30] = rv;
  const hi = Number(props.high ?? 20), lo = Number(props.low ?? 15);
  const n = Math.round(interpolate(frame - tHi, [0, 18], [0, hi], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const ring = interpolate(frame - t0, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const showRange = frame >= tLo;
  const R = 170, C = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Kicker at={t0} text={props.kicker} top={0} />
      <div style={{ position: "absolute", top: 60, left: 70, width: 420, height: 420 }}>
        <svg width={420} height={420} viewBox="0 0 420 420" style={{ position: "absolute", inset: 0 }}>
          <circle cx={210} cy={210} r={R} stroke="rgba(205,238,255,0.15)" strokeWidth={22} fill="none" />
          <circle cx={210} cy={210} r={R} stroke="url(#pl-g)" strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray={`${C * ring * (showRange ? 1 : n / Math.max(1, hi))} ${C}`} transform="rotate(-90 210 210)" />
          <defs>
            <linearGradient id="pl-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={YPF.gold} />
              <stop offset="100%" stopColor={YPF.orange} />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: showRange ? 118 : 150, letterSpacing: -4, lineHeight: 1, ...GOLD_TEXT }}>{showRange ? `${lo}–${hi}` : frame >= tHi ? n : ""}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: YPF.white, letterSpacing: 6, marginTop: 6 }}>{props.unit ?? "PINGGAN"}</div>
        </div>
      </div>
      {/* plates stacking */}
      <div style={{ position: "absolute", top: 120, left: 560, width: 420, height: 360 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const at = tHi + i * 3;
          return (
            <Pop key={i} at={at} style={{ position: "absolute", left: (i % 3) * 120, top: Math.floor(i / 3) * 130 }}>
              <Plate s={110} />
            </Pop>
          );
        })}
        <Pop at={tLo} style={{ position: "absolute", top: 280, width: 360, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_STACKS.playfairItalic, fontStyle: "italic", fontSize: 50, color: YPF.ice }}>{props.caption ?? "chicken chop"}</div>
        </Pop>
      </div>
    </div>
  );
};

/**
 * Side view of ONE breast fillet for the preparation steps.
 *   cut  0→1  knife slices HORIZONTALLY through the middle, stopping before the far edge (butterfly cut)
 *   open 0→1  the top half opens over the uncut "hinge" like a book → one wide, thinner piece (never two pieces)
 *   thin 0→1  tenderiser hits make it wider and thinner
 */
const W_PIECE = 330, H_HALF = 52, HINGE = 0.93;
const lensTop = `M 0 0 C ${W_PIECE * 0.12} ${-H_HALF * 1.35}, ${W_PIECE * 0.8} ${-H_HALF * 1.4}, ${W_PIECE} 0 Z`;
const lensBot = `M 0 0 C ${W_PIECE * 0.12} ${H_HALF * 1.3}, ${W_PIECE * 0.8} ${H_HALF * 1.35}, ${W_PIECE} 0 Z`;
const ButterflyPiece: React.FC<{ cut: number; open: number; thin: number; crumbs: number; golden: number }> = ({ cut, open, thin, crumbs, golden }) => {
  const meat = golden > 0 ? `color-mix(in srgb, #f3bea2 ${100 - golden * 100}%, #c4762b)` : "#f3bea2";
  const inner = golden > 0 ? `color-mix(in srgb, #f8d6c4 ${100 - golden * 100}%, #d08a3c)` : "#f8d6c4";
  const hx = W_PIECE * HINGE;
  const wTotal = W_PIECE + (hx - 0) * open; // width once opened
  return (
    <g transform={`translate(${-wTotal / 2} 0) scale(${1 + 0.14 * thin} ${1 - 0.38 * thin})`}>
      <g transform={`translate(${(wTotal * 0.14 * thin) / -2 / (1 + 0.14 * thin)} 0)`}>
        {/* once fully opened it is ONE wide, thinner piece (folded open at the hinge, never two pieces) */}
        {open > 0.85 ? (
          <g opacity={lin(open, 0.85, 1)}>
            <path d={`M 0 ${-H_HALF * 0.1} C ${hx * 0.2} ${H_HALF * 1.15}, ${hx * 1.8} ${H_HALF * 1.15}, ${hx * 2} ${-H_HALF * 0.1} C ${hx * 1.5} ${-H_HALF * 0.32}, ${hx * 0.5} ${-H_HALF * 0.32}, 0 ${-H_HALF * 0.1} Z`} fill={inner} stroke="#fff" strokeWidth={4} />
            <path d={`M ${hx} ${-H_HALF * 0.2} L ${hx} ${H_HALF * 0.55}`} stroke="#e0a688" strokeWidth={3} strokeDasharray="6 6" />
            <path d={`M 30 ${H_HALF * 0.3} C ${hx * 0.6} ${H_HALF * 0.55}, ${hx * 1.4} ${H_HALF * 0.55}, ${hx * 2 - 30} ${H_HALF * 0.3}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" />
          </g>
        ) : null}
        <g opacity={1 - lin(open, 0.85, 1)}>
        {/* bottom half stays on the board */}
        <path d={lensBot} fill={meat} stroke="#fff" strokeWidth={4} />
        <path d={`M 20 ${H_HALF * 0.45} C 120 ${H_HALF * 0.7}, 220 ${H_HALF * 0.7}, 300 ${H_HALF * 0.4}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" />
        {/* top half: hinged at the uncut edge, opens like a book */}
        <g transform={`rotate(${180 * open} ${hx} 0)`}>
          <path d={lensTop} fill={open > 0.5 ? inner : meat} stroke="#fff" strokeWidth={4} />
          <path d={`M 24 ${-H_HALF * 0.5} C 120 ${-H_HALF * 0.8}, 220 ${-H_HALF * 0.8}, 300 ${-H_HALF * 0.45}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} fill="none" />
        </g>
        </g>
        {/* the cut line (stops before the hinge) */}
        {cut > 0 && open < 0.05 ? <line x1={0} y1={0} x2={W_PIECE * HINGE * 0.95 * cut} y2={0} stroke={YPF.navy} strokeWidth={4} strokeLinecap="round" /> : null}
        {crumbs > 0
          ? Array.from({ length: 90 }).map((_, i) => {
              const x = 10 + random(`bx${i}`) * (wTotal - 20);
              return random(`bs${i}`) < crumbs ? <circle key={i} cx={x} cy={-4 - random(`by${i}`) * 8} r={3 + random(`br${i}`) * 3.5} fill={i % 3 ? YPF.crumb : "#f6c76a"} /> : null;
            })
          : null}
      </g>
    </g>
  );
};

const PrepScene: React.FC<SceneProps> = ({ rv, props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps: string[] = props.steps ?? ["Belah untuk lebarkan", "Katok-katok", "Tepung roti", "Goreng"];
  const [tSplit = 0, tKatok = 40, tCrumb = 80, tFry = 110] = rv;
  const hits: number[] = (props.hits ?? []).map((s: number) => Math.round(s * fps));
  const active = frame >= tFry ? 3 : frame >= tCrumb ? 2 : frame >= tKatok ? 1 : 0;
  // step 1 timing scales to the time available before "katok-katok" is spoken
  const T1 = Math.max(36, tKatok - tSplit);
  const s0 = tSplit;
  const cut = interpolate(frame, [s0 + T1 * 0.1, s0 + T1 * 0.42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const open = interpolate(frame, [s0 + T1 * 0.46, s0 + T1 * 0.74], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const result = lin(frame, s0 + T1 * 0.74, s0 + T1 * 0.84);
  const lastHit = [...hits].reverse().find((h) => frame >= h - 4);
  const swing = lastHit !== undefined ? interpolate(frame - lastHit, [-4, 0, 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const hitCount = hits.filter((h) => frame >= h).length;
  const thin = Math.min(1, hitCount / Math.max(1, hits.length));
  const impact = lastHit !== undefined && frame >= lastHit ? 1 - lin(frame, lastHit, lastHit + 10) : 0;
  const crumbs = lin(frame, tCrumb + 4, tCrumb + 26);
  const golden = lin(frame, tFry + 4, tFry + 40);
  const shake = impact > 0.5 ? Math.sin(frame * 5) * 6 * impact : 0;
  const CX = 540, CY = 250, K = 1.22; // piece cut-line position in the stage, piece scale
  const knifeX = interpolate(cut, [0, 1], [CX - (W_PIECE / 2) * K - 330, CX - (W_PIECE / 2) * K + W_PIECE * HINGE * 0.95 * K - 300]);
  const compare = frame >= s0 + T1 * 0.8 && frame < tKatok + 24 ? Math.min(lin(frame, s0 + T1 * 0.8, s0 + T1 * 0.9), 1 - lin(frame, tKatok + 14, tKatok + 24)) : 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* step chips */}
      <div style={{ position: "absolute", top: 4, left: 30, right: 30, display: "flex", justifyContent: "center", gap: 10 }}>
        {steps.map((st, i) => {
          const on = i === active, done = i < active;
          return (
            <Slide key={i} at={[tSplit, tKatok, tCrumb, tFry][i] ?? 0} dy={-20}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: on ? `linear-gradient(180deg, ${YPF.gold}, ${YPF.orange})` : "rgba(205,238,255,0.12)", border: `2px solid ${on ? "transparent" : "rgba(205,238,255,0.3)"}`, transform: `scale(${on ? 1.05 : 1})` }}>
                <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 21, color: on ? YPF.navy : YPF.ice }}>{done ? "✓" : i + 1}</span>
                <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 21, color: on ? YPF.navy : YPF.white, whiteSpace: "nowrap", textTransform: "uppercase" }}>{st}</span>
              </div>
            </Slide>
          );
        })}
      </div>
      {/* stage */}
      <div style={{ position: "absolute", top: 90, left: 0, width: 1080, height: 470, transform: `translateX(${shake}px)` }}>
        <svg width={1080} height={470} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* frying pan (side view) under the piece */}
          {frame >= tFry ? (
            <g opacity={lin(frame, tFry, tFry + 8)}>
              <ellipse cx={CX} cy={CY + 40} rx={360} ry={46} fill="rgba(255,138,31,0.28)" />
              <path d={`M ${CX - 380} ${CY + 18} L ${CX + 380} ${CY + 18} L ${CX + 330} ${CY + 70} L ${CX - 330} ${CY + 70} Z`} fill="#2b2f36" stroke="#fff" strokeWidth={4} />
              <rect x={CX + 380} y={CY + 22} width={150} height={20} rx={10} fill="#2b2f36" stroke="#fff" strokeWidth={3} />
              {Array.from({ length: 6 }).map((_, k) => {
                const x = CX - 250 + k * 100, ph = frame / 6 + k;
                return <path key={k} d={`M ${x} ${CY - 50} C ${x + 14 * Math.sin(ph)} ${CY - 90}, ${x - 14 * Math.sin(ph + 1)} ${CY - 130}, ${x + 10 * Math.sin(ph + 2)} ${CY - 170}`} stroke={k % 2 ? YPF.gold : YPF.orange} strokeWidth={6} strokeLinecap="round" fill="none" opacity={(0.5 + 0.35 * Math.sin(ph)) * lin(frame, tFry + 6, tFry + 16)} />;
              })}
            </g>
          ) : (
            /* cutting board */
            <rect x={CX - 400} y={CY + 52} width={800} height={26} rx={13} fill="#c9a27a" stroke="#fff" strokeWidth={3} opacity={0.9} />
          )}
          <g transform={`translate(${CX} ${CY}) scale(${K})`}>
            <ButterflyPiece cut={cut} open={open} thin={thin} crumbs={crumbs} golden={golden} />
          </g>
          {/* width arrows once opened */}
          {result > 0 && frame < tKatok ? (
            <g opacity={result}>
              <path d={`M ${CX - 300} ${CY - 70} L ${CX + 300} ${CY - 70}`} stroke={YPF.ice} strokeWidth={4} />
              <path d={`M ${CX - 284} ${CY - 82} L ${CX - 300} ${CY - 70} L ${CX - 284} ${CY - 58} M ${CX + 284} ${CY - 82} L ${CX + 300} ${CY - 70} L ${CX + 284} ${CY - 58}`} stroke={YPF.ice} strokeWidth={4} fill="none" />
            </g>
          ) : null}
          {/* breadcrumbs falling */}
          {frame >= tCrumb && frame < tFry + 10
            ? Array.from({ length: 60 }).map((_, k) => {
                const st = tCrumb + random(`fd${k}`) * 26;
                const pr = (frame - st) / 18;
                if (pr < 0 || pr > 1) return null;
                return <circle key={k} cx={CX - 300 + random(`fx${k}`) * 600} cy={CY - 230 + pr * 220} r={3 + random(`fr${k}`) * 4} fill={k % 3 ? YPF.crumb : "#f6c76a"} opacity={1 - pr * 0.3} />;
              })
            : null}
          {/* impact rings */}
          {impact > 0 && frame < tCrumb ? (
            <g>
              {[0, 1].map((k) => <ellipse key={k} cx={CX} cy={CY - 10} rx={(150 + k * 70) * (1.5 - impact * 0.5)} ry={(30 + k * 16) * (1.5 - impact * 0.5)} fill="none" stroke={YPF.ice} strokeWidth={5 - k * 2} opacity={impact * (1 - k * 0.4)} />)}
              {Array.from({ length: 6 }).map((_, k) => {
                const ang = (k / 6) * Math.PI * 2, r0 = 200 + (1 - impact) * 60;
                return <line key={k} x1={CX + Math.cos(ang) * r0} y1={CY - 10 + Math.sin(ang) * r0 * 0.35} x2={CX + Math.cos(ang) * (r0 + 40)} y2={CY - 10 + Math.sin(ang) * (r0 + 40) * 0.35} stroke={YPF.gold} strokeWidth={6} strokeLinecap="round" opacity={impact} />;
              })}
            </g>
          ) : null}
        </svg>
        {/* knife slides in horizontally through the middle */}
        {frame >= s0 && open < 0.3 ? (
          <div style={{ position: "absolute", left: knifeX, top: CY - 40, transform: "scaleX(-1)", opacity: 1 - lin(open, 0, 0.3) }}>
            <Knife />
          </div>
        ) : null}
        {/* mallet */}
        {frame >= tKatok - 6 && frame < tCrumb ? (
          <div style={{ position: "absolute", left: CX + 60, top: CY - 300, transformOrigin: "60px 240px", transform: `rotate(${30 - swing * 55}deg)`, opacity: lin(frame, tKatok - 6, tKatok) }}>
            <Mallet />
          </div>
        ) : null}
      </div>
      {/* "this, not that" — butterfly vs cutting in two */}
      {compare > 0 ? (
        <div style={{ position: "absolute", top: 432, width: 1080, display: "flex", justifyContent: "center", gap: 22, opacity: compare }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 999, border: `3px solid ${YPF.red}`, background: "rgba(6,24,47,0.6)" }}>
            <svg width={74} height={34} viewBox="0 0 74 34"><ellipse cx={18} cy={17} rx={16} ry={11} fill="#f3bea2" stroke="#fff" strokeWidth={2} /><ellipse cx={54} cy={17} rx={16} ry={11} fill="#f3bea2" stroke="#fff" strokeWidth={2} /><path d="M 6 4 L 68 30 M 68 4 L 6 30" stroke={YPF.red} strokeWidth={5} strokeLinecap="round" /></svg>
            <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 27, color: YPF.white, whiteSpace: "nowrap" }}>BUKAN POTONG DUA</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 999, border: `3px solid ${YPF.gold}`, background: "rgba(6,24,47,0.6)" }}>
            <svg width={84} height={34} viewBox="0 0 84 34"><path d="M 4 20 C 10 30, 34 30, 42 20 C 50 30, 74 30, 80 20 Z" fill="#f8d6c4" stroke="#fff" strokeWidth={2} /><path d="M 30 8 L 38 16 L 54 2" stroke={YPF.gold} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 27, color: YPF.white, whiteSpace: "nowrap" }}>BELAH & BUKA</span>
          </div>
        </div>
      ) : null}
      {/* big step word */}
      <div style={{ position: "absolute", top: 500, width: 1080, textAlign: "center" }}>
        <Pop key={active} at={[tSplit, tKatok, tCrumb, tFry][active]}>
          <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: active === 0 ? 56 : 64, color: YPF.white, letterSpacing: 1, textTransform: "uppercase" }}>{steps[active]}</span>
        </Pop>
        {active === 0 && result > 0 ? <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 30, color: YPF.ice, letterSpacing: 3, opacity: result, marginTop: 4 }}>LEBAR &amp; NIPIS</div> : null}
      </div>
    </div>
  );
};

const CountScene: React.FC<SceneProps> = ({ rv, props }) => {
  const frame = useCurrentFrame();
  const [t0 = 0] = rv;
  const n = Number(props.max ?? 26);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Kicker at={t0} text={props.kicker} top={0} />
      <div style={{ position: "absolute", top: 70, left: 60, width: 470, textAlign: "center" }}>
        <Pop at={t0 + 2} from={1.4}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 150, letterSpacing: -5, lineHeight: 1, ...GOLD_TEXT }}>{props.value}</div>
        </Pop>
        <Pop at={t0 + 8}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 64, color: YPF.white, letterSpacing: 4 }}>{props.unit}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 38, color: YPF.ice, letterSpacing: 3, marginTop: 6 }}>{props.label}</div>
        </Pop>
      </div>
      <div style={{ position: "absolute", top: 80, left: 560, width: 430, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{ opacity: frame >= t0 + 4 + i ? 1 : 0, transform: `scale(${frame >= t0 + 4 + i ? 1 : 0.4})` }}>
            <Fillet w={64} />
          </div>
        ))}
      </div>
    </div>
  );
};

const PriceScene: React.FC<SceneProps> = ({ rv, props }) => {
  const [t0 = 0, t1 = 10, t2 = 20] = rv;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {props.kicker ? <Pop at={t0}><div style={{ fontFamily: FONT_STACKS.playfairItalic, fontStyle: "italic", fontSize: 54, color: YPF.ice }}>{props.kicker}</div></Pop> : null}
      <Pop at={t1} from={1.5}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 230, letterSpacing: -8, lineHeight: 0.95, ...GOLD_TEXT }}>
          <Shine at={t1 + 8}>{props.price}</Shine>
        </div>
      </Pop>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        {(props.chips ?? []).map((c: string, i: number) => (
          <Slide key={i} at={t2 + i * 5} dy={24}>
            <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 44, color: YPF.navy, background: i === 0 ? YPF.white : YPF.ice, padding: "10px 28px", borderRadius: 999, letterSpacing: 2, whiteSpace: "nowrap" }}>{c}</div>
          </Slide>
        ))}
      </div>
    </div>
  );
};

const TiersScene: React.FC<SceneProps> = ({ rv, props }) => {
  const frame = useCurrentFrame();
  // props.tiers: [{ price, unit, chip?, big?: boolean (text-only line) }]
  const tiers: { price: string; unit?: string; chip?: string; note?: string }[] = props.tiers ?? [];
  const active = Math.max(0, tiers.reduce((a, _t, i) => (frame >= (rv[i] ?? 0) ? i : a), 0));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Kicker at={0} text={props.kicker} top={0} />
      {/* earlier tiers become small chips */}
      <div style={{ position: "absolute", top: 60, width: 1080, display: "flex", justifyContent: "center", gap: 14 }}>
        {tiers.slice(0, active).map((t, i) => (
          <Slide key={i} at={rv[i + 1] ?? 0} dy={-30}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 30, color: YPF.ice, background: "rgba(205,238,255,0.12)", border: "2px solid rgba(205,238,255,0.3)", borderRadius: 999, padding: "8px 20px", whiteSpace: "nowrap" }}>
              {t.price} <span style={{ opacity: 0.8 }}>{t.unit}</span>
            </div>
          </Slide>
        ))}
      </div>
      {tiers.map((t, i) =>
        i === active ? (
          <div key={i} style={{ position: "absolute", top: 140, width: 1080, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Pop at={rv[i] ?? 0} from={1.4}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 18, justifyContent: "center" }}>
                <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: t.note ? 110 : 190, letterSpacing: -5, lineHeight: 1, whiteSpace: "nowrap", ...(t.note ? { color: YPF.white } : GOLD_TEXT) }}>
                  <Shine at={(rv[i] ?? 0) + 8}>{t.price}</Shine>
                </div>
                {t.unit ? <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 54, color: YPF.white, whiteSpace: "nowrap" }}>{t.unit}</div> : null}
              </div>
            </Pop>
            {t.chip ? (
              <Slide at={(rv[i] ?? 0) + 8} dy={24}>
                <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 44, color: YPF.navy, background: YPF.ice, padding: "10px 30px", borderRadius: 999, letterSpacing: 2, marginTop: 18 }}>{t.chip}</div>
              </Slide>
            ) : null}
            {t.note ? (
              <Pop at={(rv[i] ?? 0) + 10}>
                <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 74, marginTop: 10, ...GOLD_TEXT }}>
                  <Shine at={(rv[i] ?? 0) + 16}>{t.note}</Shine>
                </div>
              </Pop>
            ) : null}
          </div>
        ) : null,
      )}
    </div>
  );
};

const BulkScene: React.FC<SceneProps> = ({ rv, props }) => {
  const frame = useCurrentFrame();
  const [t0 = 0, t1 = 20] = rv;
  const from = Number(props.from ?? 10), to = Number(props.to ?? 20);
  const n = frame < t1 ? Math.round(interpolate(frame - t0, [0, 14], [1, from], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : Math.round(interpolate(frame - t1, [0, 14], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Kicker at={t0} text={props.kicker} top={0} />
      <div style={{ position: "absolute", top: 60, left: 70, width: 420, textAlign: "center" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 180, letterSpacing: -6, lineHeight: 1, ...GOLD_TEXT }}>{frame >= t0 ? n : ""}</div>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 60, color: YPF.white, letterSpacing: 4 }}>{props.unit ?? "KOTAK"}</div>
        {props.note ? <Pop at={t1 + 10}><div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 36, color: YPF.ice, marginTop: 12 }}>{props.note}</div></Pop> : null}
      </div>
      <div style={{ position: "absolute", top: 40, left: 520, width: 480, height: 480 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const at = (i < 6 ? t0 : t1) + (i % 6) * 2;
          const col = i % 3, row = Math.floor(i / 3);
          const drop = interpolate(frame - at, [0, 8], [-120, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
          return frame >= at ? (
            <div key={i} style={{ position: "absolute", left: col * 140 + (row % 2) * 20, top: 380 - row * 95 + drop }}>
              <BoxIcon s={130} />
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
};

const EndScene: React.FC<SceneProps> = ({ rv, props }) => {
  const frame = useCurrentFrame();
  const [t0 = 0, tMap = 12, tPin1 = 30, tPin2 = 50] = rv;
  const pins: { name: string; area?: string }[] = props.pins ?? [];
  const P = [
    { x: 300, y: 330 },
    { x: 760, y: 250 },
  ];
  const road = lin(frame, tMap, tMap + 20);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* wordmark (logo file goes here when supplied) */}
      <div style={{ position: "absolute", top: 0, width: 1080, textAlign: "center" }}>
        <Pop at={t0} from={1.3}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, color: YPF.white, letterSpacing: -2, lineHeight: 1 }}>YaPakCik</div>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 40, letterSpacing: 18, marginTop: 4, ...ICE_TEXT }}>FROZEN</div>
        </Pop>
      </div>
      {/* schematic map card */}
      <Slide at={tMap} dy={40} style={{ position: "absolute", top: 160, left: 70, width: 940, height: 430 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "linear-gradient(180deg, rgba(205,238,255,0.13), rgba(205,238,255,0.05))", border: "2px solid rgba(205,238,255,0.28)", overflow: "hidden" }}>
          <svg width={940} height={430} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 9 }).map((_, i) => <line key={`v${i}`} x1={i * 118} y1={0} x2={i * 118 - 60} y2={430} stroke="rgba(205,238,255,0.07)" strokeWidth={2} />)}
            {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 100 + 20} x2={940} y2={i * 100 - 10} stroke="rgba(205,238,255,0.07)" strokeWidth={2} />)}
            <path d="M -20 380 C 200 300, 380 420, 560 300 S 860 170, 980 130" stroke="rgba(41,182,246,0.35)" strokeWidth={26} fill="none" strokeLinecap="round" />
            <path d={`M ${P[0].x - 70} ${P[0].y - 20} C ${P[0].x + 120} ${P[0].y - 60}, ${P[1].x - 160} ${P[1].y + 60}, ${P[1].x - 70} ${P[1].y - 20}`} stroke={YPF.ice} strokeWidth={5} strokeDasharray="14 12" fill="none" pathLength={1} strokeDashoffset={0} opacity={road} />
          </svg>
          {pins.map((p, i) => {
            const at = i === 0 ? tPin1 : tPin2;
            const pp = P[i] ?? P[0];
            return (
              <div key={i} style={{ position: "absolute", left: pp.x - 70 - 110, top: pp.y - 20 - 120, width: 220, textAlign: "center" }}>
                <Pop at={at} from={0.2}>
                  <svg width={70} height={92} viewBox="0 0 70 92">
                    <path d="M 35 90 C 35 90, 4 52, 4 34 A 31 31 0 1 1 66 34 C 66 52, 35 90, 35 90 Z" fill={YPF.red} stroke="#fff" strokeWidth={4} />
                    <circle cx={35} cy={34} r={12} fill="#fff" />
                  </svg>
                  <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 34, color: YPF.white, lineHeight: 1.05, marginTop: 6 }}>{p.name}</div>
                  {p.area ? <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 28, color: YPF.ice }}>{p.area}</div> : null}
                </Pop>
              </div>
            );
          })}
          <div style={{ position: "absolute", right: 24, bottom: 16, fontFamily: HEAD, fontWeight: 600, fontSize: 20, color: "rgba(205,238,255,0.55)", letterSpacing: 2 }}>PETA RINGKAS · BUKAN SKALA</div>
        </div>
      </Slide>
      <Pop at={tMap + 6} style={{ position: "absolute", top: 120, width: 1080, textAlign: "center" }}>
        <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 34, color: YPF.navy, background: YPF.gold, padding: "6px 22px", borderRadius: 999, letterSpacing: 3 }}>{props.badge ?? "2 CAWANGAN"}</span>
      </Pop>
    </div>
  );
};

/* overlays (no canvas) */
const NameTag: React.FC<SceneProps> = ({ props, dur }) => {
  const frame = useCurrentFrame();
  const p = useP(0, 16, 15);
  const out = 1 - lin(frame, dur - 10, dur);
  return (
    <div style={{ position: "absolute", left: 60, top: props.top ?? 1120, opacity: out, transform: `translateX(${(1 - p) * -500}px)` }}>
      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 22, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ width: 14, background: `linear-gradient(180deg, ${YPF.gold}, ${YPF.orange})` }} />
        <div style={{ background: "rgba(6,24,47,0.92)", padding: "16px 30px 18px 24px" }}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: YPF.white, letterSpacing: 1, lineHeight: 1 }}>{props.name}</div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 30, color: YPF.ice, letterSpacing: 3, marginTop: 8, textTransform: "uppercase" }}>{props.role}</div>
        </div>
      </div>
    </div>
  );
};

const Labels: React.FC<SceneProps> = ({ rv, props, dur }) => {
  const frame = useCurrentFrame();
  const out = 1 - lin(frame, dur - 10, dur);
  const items: { text: string; icon: "pan" | "flame" }[] = props.items ?? [];
  return (
    <div style={{ position: "absolute", top: props.top ?? 250, width: 1080, display: "flex", justifyContent: "center", gap: 26, opacity: out }}>
      {items.map((it, i) => (
        <Pop key={i} at={rv[i] ?? i * 8}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(6,24,47,0.88)", border: `3px solid ${it.icon === "flame" ? YPF.orange : YPF.ice}`, borderRadius: 999, padding: "12px 30px 12px 18px", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
            {it.icon === "flame" ? <FlameIcon s={60} /> : <PanIcon s={86} />}
            <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 56, color: YPF.white, letterSpacing: 3 }}>{it.text}</span>
          </div>
        </Pop>
      ))}
    </div>
  );
};

/** circle + arrow + label following the real pack (track = [[t, x, y, w, h], …] in SOURCE frame px, t from layer start) */
const TrackCallout: React.FC<SceneProps & { map: (x: number, y: number) => { x: number; y: number; s: number } }> = ({ props, dur, map }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tr: number[][] = props.track ?? [];
  if (!tr.length) return null;
  const t = frame / fps;
  let i = tr.findIndex((r) => r[0] > t);
  if (i <= 0) i = i === 0 ? 1 : tr.length - 1;
  const a = tr[Math.max(0, i - 1)], b = tr[Math.min(tr.length - 1, i)];
  const k = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
  const L = (j: number) => a[j] + (b[j] - a[j]) * k;
  const c = map(L(1), L(2));
  const rr = Math.max(L(3), L(4)) * 0.62 * c.s;
  const p = useP(0, 18, 13);
  const out = 1 - lin(frame, dur - 10, dur);
  const C = 2 * Math.PI * rr;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={c.x} cy={c.y} r={rr} fill="none" stroke={YPF.gold} strokeWidth={8} strokeDasharray={`${C * p} ${C}`} transform={`rotate(-90 ${c.x} ${c.y})`} strokeLinecap="round" />
        <path d={`M ${c.x - rr - 150} ${c.y - rr - 90} Q ${c.x - rr - 40} ${c.y - rr - 100} ${c.x - rr * 0.75} ${c.y - rr * 0.7}`} stroke={YPF.white} strokeWidth={7} fill="none" strokeLinecap="round" opacity={p} />
      </svg>
      <div style={{ position: "absolute", left: Math.max(40, c.x - rr - 380), top: Math.max(230, c.y - rr - 170), opacity: p, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "100% 100%" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 46, color: YPF.navy, background: YPF.gold, padding: "8px 22px", borderRadius: 16, whiteSpace: "nowrap" }}>{props.label}</div>
        {props.sub ? <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 28, color: YPF.white, textShadow: "0 2px 10px rgba(0,0,0,0.6)", marginTop: 6 }}>{props.sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── dispatcher ───────────── */
export const YpfScene: React.FC<SceneProps & { map?: (x: number, y: number) => { x: number; y: number; s: number } }> = (sp) => {
  const kind = sp.props.kind as string;
  if (kind === "nametag") return <NameTag {...sp} />;
  if (kind === "labels") return <Labels {...sp} />;
  if (kind === "track") return sp.map ? <TrackCallout {...sp} map={sp.map} /> : null;
  const body =
    kind === "hook" ? <HookScene {...sp} /> :
    kind === "chicken" ? <ChickenScene {...sp} /> :
    kind === "list" ? <ListScene {...sp} /> :
    kind === "plates" ? <PlatesScene {...sp} /> :
    kind === "prep" ? <PrepScene {...sp} /> :
    kind === "count" ? <CountScene {...sp} /> :
    kind === "price" ? <PriceScene {...sp} /> :
    kind === "tiers" ? <TiersScene {...sp} /> :
    kind === "bulk" ? <BulkScene {...sp} /> :
    kind === "endcard" ? <EndScene {...sp} /> : null;
  return <Region split={sp.split} dur={sp.dur}>{body}</Region>;
};

/** sound design for each scene, frames from the layer start */
export const sceneSfx = (kind: string, rv: number[], props: Record<string, any>, fps: number, dur: number): { sfx: string; at: number; volume: number; playbackRate?: number }[] => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const out: { sfx: string; at: number; volume: number; playbackRate?: number }[] = [];
  const R = (i: number, d = 0) => (rv[i] ?? d);
  switch (kind) {
    case "hook":
      rv.forEach((r, i) => out.push({ sfx: i === rv.length - 1 ? "impact" : "pop", at: r, volume: i === rv.length - 1 ? 0.35 : 0.4, playbackRate: i === rv.length - 1 ? 1.3 : 1 + i * 0.08 }));
      break;
    case "chicken":
      out.push({ sfx: "pop", at: R(0), volume: 0.45 });
      out.push({ sfx: "ding", at: R(1), volume: 0.35 });
      out.push({ sfx: "impact", at: R(2), volume: 0.55, playbackRate: 1.1 });
      out.push({ sfx: "whoosh", at: R(3) - 2, volume: 0.35, playbackRate: 1.3 });
      out.push({ sfx: "shimmer", at: R(4) + 4, volume: 0.45 });
      out.push({ sfx: "pop", at: R(4), volume: 0.45, playbackRate: 0.9 });
      break;
    case "list":
      rv.forEach((r, i) => out.push({ sfx: "whoosh", at: r - 1, volume: 0.22, playbackRate: 1.8 }, { sfx: "click", at: r + 4, volume: 0.5, playbackRate: 1 + i * 0.06 }));
      break;
    case "plates":
      for (let k = 0; k < 8; k++) out.push({ sfx: "tick", at: R(1) + k * 2, volume: 0.3, playbackRate: 1 + k * 0.05 });
      out.push({ sfx: "pop", at: R(2), volume: 0.5 });
      break;
    case "prep":
      out.push({ sfx: "slice", at: R(0) + 4, volume: 0.7 });
      (props.hits ?? []).forEach((s: number) => out.push({ sfx: "thud", at: Math.round(s * fps), volume: 0.75 }));
      out.push({ sfx: "crumble", at: R(2), volume: 0.8 });
      out.push({ sfx: "sizzle", at: R(3), volume: 0.42 });
      [0, 1, 2, 3].forEach((i) => out.push({ sfx: "click", at: R(i), volume: 0.35 }));
      break;
    case "count":
      out.push({ sfx: "pop", at: R(0) + 2, volume: 0.5 });
      for (let k = 0; k < 6; k++) out.push({ sfx: "tick", at: R(0) + 4 + k * 4, volume: 0.25, playbackRate: 1.2 });
      break;
    case "price":
      out.push({ sfx: "impact", at: R(1), volume: 0.4, playbackRate: 1.2 }, { sfx: "ding", at: R(1) + 6, volume: 0.45 });
      (props.chips ?? []).forEach((_: string, i: number) => out.push({ sfx: "click", at: R(2) + i * 5, volume: 0.45 }));
      break;
    case "tiers":
      rv.forEach((r, i) => out.push({ sfx: "whoosh", at: r - 2, volume: 0.3, playbackRate: 1.4 }, { sfx: i === 0 ? "ding" : "pop", at: r + 2, volume: 0.45 }));
      break;
    case "bulk":
      for (let i = 0; i < 12; i++) out.push({ sfx: "box", at: (i < 6 ? R(0) : R(1)) + (i % 6) * 2 + 8, volume: 0.35, playbackRate: 0.95 + (i % 3) * 0.06 });
      break;
    case "endcard":
      out.push({ sfx: "shimmer", at: R(0) + 2, volume: 0.45 }, { sfx: "whoosh", at: R(1) - 2, volume: 0.3 });
      out.push({ sfx: "pop", at: R(2), volume: 0.5 }, { sfx: "pop", at: R(3), volume: 0.5, playbackRate: 1.15 });
      break;
    case "nametag":
      out.push({ sfx: "whoosh", at: 0, volume: 0.3, playbackRate: 1.6 }, { sfx: "click", at: 8, volume: 0.45 });
      break;
    case "labels":
      rv.forEach((r) => out.push({ sfx: "pop", at: r, volume: 0.45 }));
      break;
    case "track":
      out.push({ sfx: "shimmer", at: 4, volume: 0.35 });
      break;
  }
  return out.filter((c) => c.at >= 0 && c.at < dur + 30);
};
