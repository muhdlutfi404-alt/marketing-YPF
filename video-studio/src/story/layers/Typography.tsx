import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { tokens } from "../engine";
import type { StoryStyle } from "../styles";
import { fitSize, Plate, type PlateSource, useInOut } from "./common";

const isHighlighted = (word: string, highlight: string[] = []) => {
  const t = tokens(word).join(" ");
  return highlight.some((h) => tokens(h).includes(t));
};

/* ───────── KEYWORD POP — big animated words over the footage, synced to speech ───────── */
export const KeywordPop: React.FC<{
  dur: number;
  style: StoryStyle;
  props: { text: string; highlight?: string[]; animation?: "slam" | "pop" | "rise" | "tracking"; position?: "top" | "upper" | "center"; bar?: boolean };
}> = ({ dur, style, props }) => {
  const { frame, fps, exit } = useInOut(dur, 8);
  const words = props.text.split(/\s+/).filter(Boolean);
  const anim = props.animation ?? "slam";
  const size = fitSize(props.text, 150, 72, 10);
  const top = props.position === "center" ? "40%" : props.position === "top" ? "11%" : "20%";
  const bar = spring({ frame: frame - 2, fps, config: { damping: 18, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: "absolute", top, left: 60, right: 60, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", padding: "10px 34px", textAlign: "center" }}>
          {props.bar !== false ? (
            <div style={{ position: "absolute", inset: 0, background: style.colors.dark, opacity: 0.82, transform: `scaleX(${bar}) skewX(-6deg)`, transformOrigin: "left", borderRadius: 10 }} />
          ) : null}
          <div style={{ position: "relative", fontFamily: style.fonts.headline, fontSize: size, lineHeight: 1.02, color: style.colors.text, textTransform: "uppercase" }}>
            {words.map((w, i) => {
              const d = 3 + i * (anim === "slam" ? 4 : 3);
              const p = spring({ frame: frame - d, fps, config: anim === "slam" ? { damping: 13, stiffness: 230, mass: 0.7 } : { damping: 12, stiffness: 170 } });
              const tr =
                anim === "slam"
                  ? `scale(${interpolate(p, [0, 1], [2.2, 1])})`
                  : anim === "pop"
                    ? `scale(${p}) translateY(${(1 - p) * 30}px)`
                    : anim === "rise"
                      ? `translateY(${(1 - p) * 60}px)`
                      : `translateX(${(1 - p) * 40}px)`;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    marginRight: "0.22em",
                    transform: tr,
                    opacity: Math.min(1, p * 1.6),
                    filter: anim === "slam" ? `blur(${(1 - Math.min(1, p)) * 6}px)` : undefined,
                    color: isHighlighted(w, props.highlight) ? style.colors.highlight : undefined,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── STATEMENT — full-screen kinetic typography (the spoken line, big) ───────── */
export const Statement: React.FC<{
  dur: number;
  style: StoryStyle;
  plate: PlateSource;
  fps: number;
  width: number;
  height: number;
  props: { lines: string[]; kicker?: string; highlight?: string[]; plate?: "blur" | "brand" | "dark" };
}> = ({ dur, style, plate, fps, width, height, props }) => {
  const { frame, enter, exit } = useInOut(dur, 10);
  const per = Math.max(6, Math.floor((dur * 0.45) / Math.max(1, props.lines.length)));
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter * 2, exit) }}>
      <Plate kind={props.plate ?? "blur"} source={plate} style={style} fps={fps} width={width} height={height} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
        <div style={{ textAlign: "center", marginTop: -120 }}>
          {props.kicker ? (
            <div style={{ fontFamily: style.fonts.body, fontWeight: 800, fontSize: 36, letterSpacing: 10, color: style.colors.secondary, marginBottom: 26, opacity: enter }}>
              {props.kicker.toUpperCase()}
            </div>
          ) : null}
          {props.lines.map((line, i) => {
            const p = spring({ frame: frame - 4 - i * per, fps, config: { damping: 13, stiffness: 210, mass: 0.7 } });
            return (
              <div
                key={i}
                style={{
                  fontFamily: style.fonts.headline,
                  fontSize: fitSize(line, 160, 80, 9),
                  lineHeight: 1.04,
                  color: style.colors.text,
                  textTransform: "uppercase",
                  transform: `scale(${interpolate(p, [0, 1], [1.9, 1])})`,
                  opacity: Math.min(1, p * 2),
                  filter: `blur(${(1 - Math.min(1, p)) * 6}px)`,
                }}
              >
                {line.split(/\s+/).map((w, j) => (
                  <span key={j} style={{ color: isHighlighted(w, props.highlight) ? style.colors.highlight : undefined }}>
                    {w}{" "}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────── CHAPTER — section title card ("DEMO PRODUK", "CARA MASAK") ───────── */
export const Chapter: React.FC<{
  dur: number;
  style: StoryStyle;
  plate: PlateSource;
  fps: number;
  width: number;
  height: number;
  props: { kicker?: string; title: string; plate?: "blur" | "brand" | "dark" };
}> = ({ dur, style, plate, fps, width, height, props }) => {
  const { frame, enter, exit } = useInOut(dur, 10);
  const line = interpolate(frame, [4, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sweep = interpolate(frame, [6, 36], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t = spring({ frame: frame - 8, fps, config: { damping: 200 }, durationInFrames: 24 });
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter * 2, exit) }}>
      <Plate kind={props.plate ?? "blur"} source={plate} style={style} fps={fps} width={width} height={height} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 70px" }}>
        <div style={{ marginTop: -120 }}>
          {props.kicker ? (
            <div style={{ fontFamily: style.fonts.body, fontWeight: 800, fontSize: 38, letterSpacing: 14, color: style.colors.accent, opacity: enter }}>{props.kicker.toUpperCase()}</div>
          ) : null}
          <div style={{ height: 5, width: `${line * 60}%`, background: style.colors.text, margin: "28px auto", opacity: 0.85 }} />
          <div style={{ position: "relative", overflow: "hidden", padding: "0 10px" }}>
            <div style={{ fontFamily: style.fonts.headline, fontSize: fitSize(props.title, 190, 90, 8), lineHeight: 0.98, color: style.colors.text, textTransform: "uppercase", transform: `translateY(${(1 - t) * 110}%)` }}>
              {props.title}
            </div>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${sweep - 15}%, rgba(255,255,255,0.55) ${sweep}%, transparent ${sweep + 15}%)`, mixBlendMode: "overlay" }} />
          </div>
          <div style={{ height: 5, width: `${line * 60}%`, background: style.colors.text, margin: "28px auto", opacity: 0.85 }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
