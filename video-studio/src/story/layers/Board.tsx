import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_STACKS } from "../../shared/fonts";
import { resolveMedia } from "../../shared/utils/media";
import type { StoryStyle } from "../styles";
import { useInOut } from "./common";
import { CANVAS } from "../Canvas";

/**
 * BOARD — full-screen "whiteboard" explainer scene (premium-explainer style):
 * white paper, black type, thin lines that draw themselves, every element appearing
 * exactly when it is SPOKEN (revealAt = seconds from the layer start, from revealQuotes).
 *
 *   tree      root word → two branches → a footer line          (definitions)
 *   compare   two columns + verdict                              (A vs B)
 *   flow      numbered steps joined by drawn arrows              (processes)
 *   checklist real product still + ticked items                  (trust points)
 *   quote     one bracketed line                                 (key message)
 *   number    one big number + unit + label                      (spoken numbers)
 *   map       N places joined by a dashed line                   (branches / locations)
 */
export type BoardProps = {
  variant: "tree" | "compare" | "flow" | "checklist" | "quote" | "number" | "map";
  kicker?: string;
  title?: string;
  root?: string;
  children?: string[];
  footer?: string;
  left?: { title: string; items: string[] };
  right?: { title: string; items: string[] };
  verdict?: string;
  steps?: string[];
  items?: string[];
  image?: string; // REAL footage still (never generated)
  text?: string;
  value?: number;
  unit?: string;
  label?: string;
  pins?: string[];
  revealAt?: number[];
  dark?: boolean;
  /** "split" = ONE CANVAS mode: drawn on the paper above the presenter window (see Canvas.tsx) */
  layout?: "full" | "split";
};

const INK = "#111315";
const SOFT = "#8a9096";
const PAPER = "#f7f7f5";

/** text that sharpens in (blur → crisp), like the reference */
const Reveal: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 12 });
  return (
    <div style={{ opacity: p, filter: `blur(${(1 - p) * 8}px)`, transform: `translateY(${(1 - p) * 14}px)`, ...style }}>{children}</div>
  );
};

/** a line that draws from 0 to full length */
const Draw: React.FC<{ d: string; at: number; dur?: number; width?: number; color?: string; dash?: boolean }> = ({ d, at, dur = 12, width = 5, color = INK, dash }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={dash ? "0.02 0.025" : "1"} strokeDashoffset={dash ? 0 : 1 - p} opacity={dash ? p : 1} />
  );
};

export const Board: React.FC<{ dur: number; style: StoryStyle; props: BoardProps }> = ({ dur, style, props }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { exit, enter } = useInOut(dur, 8);
  const split = props.layout === "split";
  // split: graphics clear away BEFORE the presenter window opens back to full screen
  const splitExit = interpolate(frame, [dur - 24, dur - 15], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const big = split ? 1.25 : 1; // compare/flow text a size up in split (the layout is scaled to fit)
  const R = (i: number, fallback: number) => Math.round(((props.revealAt?.[i] ?? fallback) as number) * fps);
  const fg = props.dark ? "#f4f4f2" : INK;
  const bg = props.dark ? "#0e1012" : PAPER;
  const accent = style.colors.accent;
  const H = (size: number, weight = 800): React.CSSProperties => ({ fontFamily: FONT_STACKS.inter, fontWeight: weight, fontSize: size, color: fg, letterSpacing: -0.5, lineHeight: 1.05 });
  const small: React.CSSProperties = { fontFamily: FONT_STACKS.inter, fontWeight: 500, fontSize: 34, color: SOFT, letterSpacing: 0.5 };
  const W = 1080;

  const header = (props.kicker || props.title) && props.variant !== "tree" ? (
    <div style={{ position: "absolute", top: 300, left: 90, right: 90, textAlign: "center" }}>
      {props.kicker ? <Reveal at={2}><div style={{ ...small, textTransform: "uppercase", letterSpacing: 6, fontSize: 28 }}>{props.kicker}</div></Reveal> : null}
      {props.title ? <Reveal at={5}><div style={{ ...H(78), marginTop: 10 }}>{props.title}</div></Reveal> : null}
    </div>
  ) : null;

  let body: React.ReactNode = null;

  if (props.variant === "tree") {
    const [c1, c2] = props.children ?? [];
    const tRoot = R(0, 0.1), t1 = R(1, 0.8), t2 = R(2, 1.4), tF = R(3, 2.2);
    body = (
      <>
        <div style={{ position: "absolute", top: 520, width: W, textAlign: "center" }}>
          {props.kicker ? <Reveal at={tRoot}><div style={small}>{props.kicker}</div></Reveal> : null}
          <Reveal at={tRoot + 3}><div style={H(150, 900)}>{props.root}</div></Reveal>
        </div>
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          <Draw d={`M ${W / 2} 730 L ${W / 2} 820`} at={t1 - 8} />
          <Draw d={`M ${W / 2} 820 L 270 820 L 270 900`} at={t1 - 4} />
          <Draw d={`M ${W / 2} 820 L 810 820 L 810 900`} at={t2 - 4} />
        </svg>
        <div style={{ position: "absolute", top: 930, left: 60, width: 420, textAlign: "center" }}><Reveal at={t1}><div style={H(66)}>{c1}</div></Reveal></div>
        <div style={{ position: "absolute", top: 930, right: 60, width: 420, textAlign: "center" }}><Reveal at={t2}><div style={H(66)}>{c2}</div></Reveal></div>
        {props.footer ? (
          <div style={{ position: "absolute", top: 1130, left: 90, right: 90, textAlign: "center" }}>
            <Reveal at={tF}><div style={{ fontFamily: FONT_STACKS.playfairItalic, fontStyle: "italic", fontSize: 72, color: fg }}>{props.footer}</div></Reveal>
          </div>
        ) : null}
      </>
    );
  }

  if (props.variant === "compare" && props.left && props.right) {
    const L = props.left, Rt = props.right;
    let k = 0;
    const lt = L.items.map(() => R(k++, 0.6 + k * 0.5));
    const rt = Rt.items.map(() => R(k++, 0.6 + k * 0.5));
    const tv = R(k, 0.6 + (k + 1) * 0.5);
    body = (
      <>
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          <Draw d={`M ${W / 2} 560 L ${W / 2} 1240`} at={2} dur={16} width={4} color={SOFT} />
        </svg>
        {[{ c: L, ts: lt, x: 40, muted: true }, { c: Rt, ts: rt, x: W / 2 + 20, muted: false }].map(({ c, ts, x, muted }, ci) => (
          <div key={ci} style={{ position: "absolute", top: 560, left: x, width: W / 2 - 60, textAlign: "center" }}>
            <Reveal at={ci === 0 ? 3 : 8}>
              <div style={{ ...small, textTransform: "uppercase", letterSpacing: 4, fontSize: 30 * big, color: muted ? SOFT : accent }}>{c.title}</div>
            </Reveal>
            <div style={{ display: "grid", gap: 26, marginTop: 40 }}>
              {c.items.map((it, i) => (
                <Reveal key={i} at={ts[i]}>
                  <div style={{ ...H(58 * big, 700), color: muted ? SOFT : fg, textDecoration: muted ? "line-through" : undefined, textDecorationThickness: 4 }}>{it}</div>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
        {props.verdict ? (
          <div style={{ position: "absolute", top: 1310, width: W, display: "flex", justifyContent: "center" }}>
            <Reveal at={tv}>
              <div style={{ background: fg, color: bg, fontFamily: FONT_STACKS.inter, fontWeight: 900, fontSize: 64, padding: "18px 48px", borderRadius: 999, letterSpacing: 2 }}>{props.verdict}</div>
            </Reveal>
          </div>
        ) : null}
      </>
    );
  }

  if (props.variant === "flow" && props.steps) {
    const n = props.steps.length;
    const gap = split ? 150 : Math.min(250, 900 / Math.max(1, n));
    const top0 = 560;
    body = (
      <>
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          {props.steps.slice(1).map((_, i) => {
            const y0 = top0 + i * gap + 90, y1 = top0 + (i + 1) * gap - 20;
            const t = R(i + 1, 0.8 + (i + 1) * 0.7);
            return (
              <g key={i}>
                <Draw d={`M 250 ${y0} L 250 ${y1}`} at={t - 10} dur={10} />
                <Draw d={`M 232 ${y1 - 18} L 250 ${y1} L 268 ${y1 - 18}`} at={t - 2} dur={5} />
              </g>
            );
          })}
        </svg>
        {props.steps.map((s, i) => {
          const t = R(i, 0.6 + i * 0.7);
          return (
            <div key={i} style={{ position: "absolute", top: top0 + i * gap, left: 180, right: 80, display: "flex", alignItems: "center", gap: 36 }}>
              <Reveal at={t}>
                <div style={{ width: 140, height: 80, borderRadius: 40, border: `5px solid ${fg}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_STACKS.inter, fontWeight: 800, fontSize: 40, color: fg }}>{i + 1}</div>
              </Reveal>
              <Reveal at={t + 2}><div style={H(66 * big)}>{s}</div></Reveal>
            </div>
          );
        })}
      </>
    );
  }

  if (props.variant === "checklist" && props.items) {
    body = (
      <>
        {props.image && props.layout !== "split" ? (
          <div style={{ position: "absolute", top: 420, left: 140, right: 140, height: 560, borderRadius: 36, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.18)", transform: `scale(${0.94 + 0.06 * enter})`, opacity: Math.min(1, enter * 1.5) }}>
            <Img src={resolveMedia(props.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : null}
        <div style={{ position: "absolute", top: props.image && props.layout !== "split" ? 1040 : 640, left: 160, right: 100, display: "grid", gap: 30 }}>
          {props.items.map((it, i) => {
            const t = R(i, 0.6 + i * 0.6);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <svg width={64} height={64} viewBox="0 0 64 64">
                  <circle cx={32} cy={32} r={28} stroke={fg} strokeWidth={4} fill="none" opacity={0.25} />
                  <Draw d="M 18 33 L 28 43 L 47 22" at={t} dur={8} width={6} color={accent} />
                </svg>
                <Reveal at={t + 1}><div style={H(62, 700)}>{it}</div></Reveal>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  if (props.variant === "quote") {
    body = (
      <div style={{ position: "absolute", top: 760, left: 80, right: 80, textAlign: "center" }}>
        <Reveal at={R(0, 0.1)}>
          <div style={{ fontFamily: FONT_STACKS.inter, fontWeight: 500, fontSize: 70, color: fg, letterSpacing: -0.5 }}>
            <span style={{ color: SOFT }}>[ </span>
            {props.text}
            <span style={{ color: SOFT }}> ]</span>
          </div>
        </Reveal>
      </div>
    );
  }

  if (props.variant === "number") {
    const t = R(0, 0.1);
    body = (
      <div style={{ position: "absolute", top: 600, width: W, textAlign: "center" }}>
        <Reveal at={t}><div style={{ ...H(330, 900), letterSpacing: -8 }}>{props.text ?? props.value}</div></Reveal>
        {props.unit ? <Reveal at={t + 6}><div style={{ fontFamily: FONT_STACKS.playfairItalic, fontStyle: "italic", fontSize: 90, color: fg, marginTop: -10 }}>{props.unit}</div></Reveal> : null}
        {props.label ? <Reveal at={t + 12}><div style={{ ...small, marginTop: 30 }}>{props.label}</div></Reveal> : null}
      </div>
    );
  }

  if (props.variant === "map" && props.pins) {
    const n = props.pins.length;
    const xs = props.pins.map((_, i) => (n === 1 ? W / 2 : 220 + (i * (W - 440)) / (n - 1)));
    const y = 1020;
    body = (
      <>
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          {n > 1 ? <Draw d={`M ${xs[0]} ${y} L ${xs[n - 1]} ${y}`} at={R(1, 1.2) - 6} dur={14} width={4} color={SOFT} dash /> : null}
          {xs.map((x, i) => (
            <g key={i}>
              <Draw d={`M ${x} ${y - 70} m -26 0 a 26 26 0 1 0 52 0 a 26 26 0 1 0 -52 0 M ${x} ${y - 44} L ${x} ${y - 6}`} at={R(i, 0.6 + i * 0.8)} dur={10} width={6} color={accent} />
            </g>
          ))}
        </svg>
        {props.pins.map((p, i) => (
          <div key={i} style={{ position: "absolute", top: y + 30, left: xs[i] - 230, width: 460, textAlign: "center" }}>
            <Reveal at={R(i, 0.6 + i * 0.8) + 4}><div style={H(50, 700)}>{p}</div></Reveal>
          </div>
        ))}
      </>
    );
  }

  if (props.layout === "split") {
    // fit the full-screen layout's content box into the paper area above the presenter window
    const n = (props.steps ?? props.items ?? []).length;
    const gapF = props.variant === "flow" ? 150 : Math.min(250, 900 / Math.max(1, n));
    const box: Record<BoardProps["variant"], [number, number]> = {
      tree: [500, props.footer ? 1220 : 1010],
      compare: [540, props.verdict ? 1420 : 1250],
      flow: [540, 560 + (n - 1) * gapF + 90],
      checklist: [620, 640 + n * 94],
      number: [590, 940 + (props.unit ? 110 : 0) + (props.label ? 70 : 0)],
      map: [930, 1120],
      quote: [740, 860],
    };
    let [y0, y1] = box[props.variant];
    if (header) y0 = Math.min(y0, 290);
    const regionH = CANVAS.regionBottom - CANVAS.regionTop;
    const k = Math.min(1, regionH / (y1 - y0));
    const ty = CANVAS.regionTop + (regionH - (y1 - y0) * k) / 2 - y0 * k;
    return (
      <AbsoluteFill style={{ opacity: Math.min(enter * 2.5, splitExit) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1920, transform: `translateY(${ty}px) scale(${k})`, transformOrigin: "50% 0" }}>
          {header}
          {body}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, opacity: Math.min(enter * 2.5, exit) }}>
      {header}
      {body}
    </AbsoluteFill>
  );
};
