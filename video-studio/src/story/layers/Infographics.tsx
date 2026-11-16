import React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { AnimatedCounter } from "../../shared/infographics/AnimatedCounter";
import { ProgressRing } from "../../shared/infographics/ProgressRing";
import type { StoryStyle } from "../styles";
import { fitSize, Plate, type PlateSource, useInOut } from "./common";

type PlateProps = { plate: PlateSource; fps: number; width: number; height: number };

/* ───────── COUNTER — a spoken number, animated (e.g. "8 MINIT") ───────── */
export const Counter: React.FC<
  { dur: number; style: StoryStyle; props: { value: number; from?: number; count?: boolean; decimals?: number; prefix?: string; suffix?: string; label?: string; fullscreen?: boolean; plate?: "blur" | "brand" | "dark" } } & PlateProps
> = ({ dur, style, props, plate, fps, width, height }) => {
  const { frame, enter, exit } = useInOut(dur, 10);
  const full = props.fullscreen ?? false;
  const ring = full ? 560 : 330;
  const body = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`, opacity: Math.min(1, enter * 1.5) }}>
      <div style={{ background: full ? "transparent" : `${style.colors.dark}d9`, borderRadius: "50%", padding: full ? 0 : 14, boxShadow: full ? undefined : "0 18px 40px rgba(0,0,0,0.4)" }}>
        <ProgressRing size={ring} stroke={full ? 26 : 18} value={100} color={style.colors.accent} trackColor="rgba(255,255,255,0.15)" delay={2} durationInFrames={Math.min(40, dur - 10)}>
          <div style={{ textAlign: "center", lineHeight: 0.95 }}>
            <AnimatedCounter
              from={props.count === false ? props.value : props.from ?? 0}
              to={props.value}
              decimals={props.decimals ?? 0}
              prefix={props.prefix ?? ""}
              delay={2}
              durationInFrames={Math.min(36, dur - 12)}
              style={{ fontFamily: style.fonts.headline, fontSize: full ? 260 : 150, color: style.colors.text }}
            />
            {props.suffix ? <div style={{ fontFamily: style.fonts.headline, fontSize: full ? 90 : 56, color: style.colors.highlight }}>{props.suffix.toUpperCase()}</div> : null}
          </div>
        </ProgressRing>
      </div>
      {props.label ? (
        <div style={{ marginTop: 26, fontFamily: style.fonts.body, fontWeight: 800, fontSize: full ? 52 : 40, color: style.colors.text, textAlign: "center", background: full ? "transparent" : `${style.colors.dark}d9`, padding: "8px 26px", borderRadius: 12, opacity: interpolate(frame, [14, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {props.label}
        </div>
      ) : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {full ? <Plate kind={props.plate ?? "blur"} source={plate} style={style} fps={fps} width={width} height={height} /> : null}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: full ? "center" : "flex-start", paddingTop: full ? 0 : 230, marginTop: full ? -110 : 0 }}>{body}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────── CHART — numbers that were SPOKEN (or confirmed facts), as animated columns ───────── */
export const Chart: React.FC<
  { dur: number; style: StoryStyle; props: { title?: string; unit?: string; items: { label: string; value: number; highlight?: boolean }[]; plate?: "blur" | "brand" | "dark" } } & PlateProps
> = ({ dur, style, props, plate, fps, width, height }) => {
  const { frame, enter, exit } = useInOut(dur, 10);
  const max = Math.max(...props.items.map((i) => i.value), 1);
  const colW = Math.min(260, 820 / props.items.length - 40);
  const areaH = 760;
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter * 2, exit) }}>
      <Plate kind={props.plate ?? "blur"} source={plate} style={style} fps={fps} width={width} height={height} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        {props.title ? (
          <div style={{ fontFamily: style.fonts.headline, fontSize: fitSize(props.title, 110, 64, 14), color: style.colors.text, textTransform: "uppercase", textAlign: "center", padding: "0 70px", marginBottom: 40, transform: `translateY(${(1 - enter) * 40}px)` }}>
            {props.title}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 50, height: areaH, borderBottom: `5px solid ${style.colors.text}55`, paddingBottom: 6 }}>
          {props.items.map((it, i) => {
            const start = 10 + i * 12;
            const p = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 90 } });
            const h = (it.value / max) * (areaH - 200) * Math.min(1, p);
            const color = it.highlight ? style.colors.accent : `${style.colors.text}88`;
            return (
              <div key={i} style={{ width: colW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <AnimatedCounter to={it.value} delay={start} durationInFrames={36} suffix={props.unit ? ` ${props.unit}` : ""} style={{ fontFamily: style.fonts.headline, fontSize: Math.min(84, (colW * 1.7) / Math.max(3, `${it.value}${props.unit ? " " + props.unit : ""}`.length)), whiteSpace: "nowrap", color: it.highlight ? style.colors.highlight : style.colors.text, opacity: Math.min(1, p * 2), marginBottom: 14 }} />
                <div style={{ width: "100%", height: h, background: color, borderRadius: "16px 16px 0 0", boxShadow: it.highlight ? `0 0 40px ${style.colors.accent}88` : undefined }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 50, marginTop: 18 }}>
          {props.items.map((it, i) => (
            <div key={i} style={{ width: colW, textAlign: "center", fontFamily: style.fonts.body, fontWeight: 800, fontSize: 38, color: style.colors.text, opacity: interpolate(frame, [14 + i * 12, 26 + i * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              {it.label}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────── STEPS — a spoken how-to, ticked off as the presenter says each step ───────── */
export const Steps: React.FC<
  { dur: number; style: StoryStyle; props: { title?: string; items: string[]; revealAt?: number[]; fullscreen?: boolean; position?: "top" | "middle"; plate?: "blur" | "brand" | "dark" } } & PlateProps
> = ({ dur, style, props, plate, fps, width, height }) => {
  const { frame, enter, exit } = useInOut(dur, 10);
  const full = props.fullscreen ?? false;
  const reveal = props.items.map((_, i) => (props.revealAt?.[i] !== undefined ? Math.round(props.revealAt[i] * fps) : 6 + Math.floor((i * (dur * 0.6)) / Math.max(1, props.items.length))));
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {full ? <Plate kind={props.plate ?? "blur"} source={plate} style={style} fps={fps} width={width} height={height} /> : null}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          // "middle" keeps the presenter's face clear (panel sits at chest height)
          top: full ? 330 : props.position === "middle" ? 880 : 170,
          background: full ? "transparent" : `${style.colors.dark}e6`,
          borderRadius: 28,
          padding: full ? 0 : "34px 40px",
          boxShadow: full ? undefined : "0 20px 50px rgba(0,0,0,0.4)",
          transform: `translateY(${(1 - enter) * -60}px)`,
          opacity: Math.min(1, enter * 1.5),
        }}
      >
        {props.title ? <div style={{ fontFamily: style.fonts.headline, fontSize: full ? 110 : 70, color: style.colors.text, textTransform: "uppercase", marginBottom: full ? 50 : 22, textAlign: full ? "center" : "left" }}>{props.title}</div> : null}
        {props.items.map((it, i) => {
          const p = spring({ frame: frame - reveal[i], fps, config: { damping: 12, stiffness: 170 } });
          const done = frame >= reveal[i];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, marginBottom: full ? 40 : 18, opacity: done ? Math.min(1, p * 1.5) : 0.25, transform: `translateX(${(1 - Math.min(1, p)) * -40}px)` }}>
              <div style={{ flex: "none", width: full ? 100 : 74, height: full ? 100 : 74, borderRadius: "50%", background: done ? style.colors.accent : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: style.fonts.headline, fontSize: full ? 60 : 44, color: "#fff", transform: `scale(${done ? interpolate(p, [0, 1], [0.5, 1]) : 1})` }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: style.fonts.body, fontWeight: 800, fontSize: full ? 58 : 46, color: style.colors.text, lineHeight: 1.15 }}>{it}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ───────── PROGRESS — simple animated bar (e.g. cooking time elapsing) ───────── */
export const ProgressBar: React.FC<{ dur: number; style: StoryStyle; props: { label?: string } }> = ({ dur, style, props }) => {
  const { frame, exit } = useInOut(dur, 8);
  const p = interpolate(frame, [4, dur - 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 210 }}>
        {props.label ? <div style={{ fontFamily: style.fonts.body, fontWeight: 800, fontSize: 40, color: style.colors.text, marginBottom: 14, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{props.label}</div> : null}
        <div style={{ height: 26, borderRadius: 13, background: "rgba(0,0,0,0.45)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${p * 100}%`, background: style.colors.accent, borderRadius: 13 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
