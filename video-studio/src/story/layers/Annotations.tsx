import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { Icon, ICON_NAMES, type IconName } from "../../brands/yapakcik-frozen/components/Icon";
import type { StoryStyle } from "../styles";
import { fitSize, Plate, type PlateSource, useInOut } from "./common";

/* ───────── CALLOUT — points at something in the REAL footage (e.g. the product on the plate) ───────── */
export const Callout: React.FC<{ dur: number; style: StoryStyle; props: { text: string; x: number; y: number; side?: "left" | "right" } }> = ({ dur, style, props }) => {
  const { frame, fps, exit } = useInOut(dur, 8);
  const W = 1080;
  const H = 1920;
  const px = props.x * W;
  const py = props.y * H;
  const side = props.side ?? (props.x > 0.5 ? "left" : "right");
  const fontSize = fitSize(props.text, 52, 34, 14);
  const labelW = props.text.length * fontSize * 0.62 + 70; // estimated pill width
  // keep the label fully inside the frame
  const labelX = side === "left" ? Math.max(60 + labelW, Math.min(px - 120, W - 60)) : Math.min(W - 60 - labelW, Math.max(px + 120, 60));
  const labelY = Math.max(260, py - 260);
  const dot = spring({ frame, fps, config: { damping: 9, stiffness: 200 } });
  const line = interpolate(frame, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const label = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 160 } });
  const ex = px + (labelX - px) * line;
  const ey = py + (labelY - py) * line;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <circle cx={px} cy={py} r={34 + (frame % 30)} fill="none" stroke={style.colors.highlight} strokeWidth={4} opacity={1 - (frame % 30) / 30} />
        <circle cx={px} cy={py} r={16 * dot} fill={style.colors.highlight} stroke="#000" strokeOpacity={0.4} strokeWidth={3} />
        <line x1={px} y1={py} x2={ex} y2={ey} stroke={style.colors.highlight} strokeWidth={5} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: labelY - 50,
          ...(side === "left" ? { right: W - labelX } : { left: labelX }),
          transform: `scale(${label})`,
          transformOrigin: side === "left" ? "right center" : "left center",
          background: style.colors.dark,
          border: `4px solid ${style.colors.highlight}`,
          color: style.colors.text,
          fontFamily: style.fonts.body,
          fontWeight: 900,
          fontSize,
          padding: "14px 28px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        }}
      >
        {props.text}
      </div>
    </AbsoluteFill>
  );
};

/* ───────── BADGE — e.g. "HALAL" — ONLY from confirmed facts ───────── */
export const Badge: React.FC<{ dur: number; style: StoryStyle; props: { text: string; icon?: IconName; position?: "top-left" | "top-right" } }> = ({ dur, style, props }) => {
  const { enter, exit } = useInOut(dur, 8);
  const icon = props.icon && (ICON_NAMES as readonly string[]).includes(props.icon) ? props.icon : "shield";
  const right = (props.position ?? "top-right") === "top-right";
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div
        style={{
          position: "absolute",
          top: 220,
          ...(right ? { right: 60 } : { left: 60 }),
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: style.colors.text,
          color: style.colors.dark,
          padding: "16px 30px 16px 20px",
          borderRadius: 999,
          fontFamily: style.fonts.body,
          fontWeight: 900,
          fontSize: 40,
          transform: `scale(${enter}) rotate(${(1 - enter) * -12}deg)`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: style.colors.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={40} color="#fff" strokeWidth={2.2} />
        </div>
        {props.text.toUpperCase()}
      </div>
    </AbsoluteFill>
  );
};

/* ───────── LOWER THIRD — presenter name (from facts) ───────── */
export const LowerThirdLayer: React.FC<{ dur: number; style: StoryStyle; props: { name: string; role?: string } }> = ({ dur, style, props }) => {
  const { frame, fps, exit } = useInOut(dur, 10);
  const bar = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  const t = spring({ frame: frame - 6, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: "absolute", left: 60, top: 1010, display: "flex", gap: 20 }}>
        <div style={{ width: 10, background: style.colors.accent, transform: `scaleY(${bar})`, transformOrigin: "bottom", borderRadius: 4 }} />
        <div style={{ overflow: "hidden" }}>
          <div style={{ background: style.colors.dark, padding: "10px 24px", transform: `translateX(${(1 - t) * -110}%)` }}>
            <div style={{ fontFamily: style.fonts.headline, fontSize: 70, color: style.colors.text, lineHeight: 1 }}>{props.name.toUpperCase()}</div>
            {props.role ? <div style={{ fontFamily: style.fonts.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: style.colors.highlight, marginTop: 6 }}>{props.role.toUpperCase()}</div> : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────── CTA — closing call to action (contact details ONLY from facts) ───────── */
export const CTA: React.FC<
  { dur: number; style: StoryStyle; plate: PlateSource; fps: number; width: number; height: number; props: { headline: string; lines?: string[]; button?: string; fullscreen?: boolean; plate?: "blur" | "brand" | "dark" } }
> = ({ dur, style, plate, fps, width, height, props }) => {
  const { frame, enter, exit } = useInOut(dur, 10);
  const full = props.fullscreen ?? true;
  const btn = spring({ frame: frame - 14, fps, config: { damping: 9, stiffness: 180 } });
  const pulse = frame > 30 ? 1 + Math.sin((frame - 30) / 5) * 0.035 : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(full ? enter * 2 : 1, exit) }}>
      {full ? <Plate kind={props.plate ?? "brand"} source={plate} style={style} fps={fps} width={width} height={height} /> : null}
      <AbsoluteFill style={{ justifyContent: full ? "center" : "flex-start", alignItems: "center", paddingTop: full ? 0 : 200, textAlign: "center", padding: "0 70px" }}>
        <div style={{ marginTop: full ? -120 : 0 }}>
          <div style={{ fontFamily: style.fonts.headline, fontSize: fitSize(props.headline, 140, 76, 10), color: style.colors.text, textTransform: "uppercase", lineHeight: 1.02, transform: `translateY(${(1 - enter) * 50}px)` }}>{props.headline}</div>
          {props.button ? (
            <div style={{ display: "inline-block", marginTop: 46, background: style.colors.accent, color: "#fff", fontFamily: style.fonts.body, fontWeight: 900, fontSize: 52, padding: "24px 64px", borderRadius: 999, transform: `scale(${btn * pulse})` }}>
              {props.button.toUpperCase()}
            </div>
          ) : null}
          {(props.lines ?? []).map((l, i) => (
            <div key={i} style={{ marginTop: 22, fontFamily: style.fonts.body, fontWeight: 700, fontSize: 44, color: style.colors.text, opacity: interpolate(frame, [20 + i * 6, 30 + i * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              {l}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
