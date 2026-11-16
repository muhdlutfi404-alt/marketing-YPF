import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Animated typography — the workhorse text component for both brands.
 *
 * Modes:
 *  - "rise"       words slide up from behind a mask (classic documentary title)
 *  - "fade"       soft fade per word
 *  - "blur"       words come into focus (dreamy / cinematic)
 *  - "slam"       words punch in from big to normal (commercial / hype)
 *  - "tracking"   letters start wide apart and tighten (luxury / epic title)
 *  - "typewriter" characters appear one by one with a blinking cursor
 *  - "pop"        bouncy scale-in per character (playful / product)
 */
export type TextAnimation = "rise" | "fade" | "blur" | "slam" | "tracking" | "typewriter" | "pop";

export type AnimatedTextProps = {
  text: string;
  mode?: TextAnimation;
  /** Frame (relative to the parent sequence) the animation starts */
  delay?: number;
  /** Frames between each word / letter */
  stagger?: number;
  /** Optional frame where the text fades out */
  exitAt?: number;
  exitDuration?: number;
  style?: React.CSSProperties;
  /** Style applied to each word (e.g. highlight colours) */
  wordStyle?: (word: string, index: number) => React.CSSProperties | undefined;
  align?: "left" | "center" | "right";
  /** "tracking" mode only: how wide (in em) the letters start apart */
  trackingSpread?: number;
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  mode = "rise",
  delay = 0,
  stagger,
  exitAt,
  exitDuration = 12,
  style,
  wordStyle,
  align = "left",
  trackingSpread = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exit =
    exitAt === undefined
      ? 1
      : interpolate(frame, [exitAt, exitAt + exitDuration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  const container: React.CSSProperties = {
    textAlign: align,
    opacity: exit,
    transform: `translateY(${(1 - exit) * -12}px)`,
    ...style,
  };

  // ── Typewriter: character based with cursor ──
  if (mode === "typewriter") {
    const speed = stagger ?? 2;
    const chars = Math.max(0, Math.floor((frame - delay) / speed));
    const visible = text.slice(0, chars);
    const done = chars >= text.length;
    const cursorOn = Math.floor(frame / 15) % 2 === 0;
    return (
      <div style={container}>
        {visible}
        <span style={{ opacity: !done || cursorOn ? 1 : 0, marginLeft: "0.05em" }}>▍</span>
      </div>
    );
  }

  // ── Tracking: whole line, letter-spacing tightens ──
  if (mode === "tracking") {
    const p = interpolate(frame - delay, [0, 45], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    const baseSpacing = typeof style?.letterSpacing === "number" ? style.letterSpacing : 0;
    return (
      <div
        style={{
          ...container,
          letterSpacing: `calc(${baseSpacing}px + ${(1 - p) * trackingSpread}em)`,
          opacity: p * exit,
          filter: `blur(${(1 - p) * 8}px)`,
        }}
      >
        {text}
      </div>
    );
  }

  // ── Per-character pop ──
  if (mode === "pop") {
    const s = stagger ?? 1.5;
    return (
      <div style={container}>
        {Array.from(text).map((ch, i) => {
          const p = spring({ frame: frame - delay - i * s, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                transform: `scale(${p}) translateY(${(1 - p) * 30}px)`,
                opacity: Math.min(1, p * 1.5),
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    );
  }

  // ── Word based modes ──
  const words = text.split(/\s+/).filter(Boolean);
  const s = stagger ?? (mode === "slam" ? 6 : 4);

  return (
    <div style={container}>
      {words.map((word, i) => {
        const local = frame - delay - i * s;
        const p =
          mode === "slam"
            ? spring({ frame: local, fps, config: { damping: 14, stiffness: 220, mass: 0.7 } })
            : spring({ frame: local, fps, config: { damping: 200 }, durationInFrames: 22 });

        let inner: React.CSSProperties = {};
        if (mode === "rise") inner = { transform: `translateY(${(1 - p) * 110}%)` };
        if (mode === "fade") inner = { opacity: p };
        if (mode === "blur") inner = { opacity: p, filter: `blur(${(1 - p) * 14}px)` };
        if (mode === "slam")
          inner = {
            opacity: Math.min(1, p * 2),
            transform: `scale(${interpolate(p, [0, 1], [2.4, 1])})`,
            filter: `blur(${(1 - Math.min(1, p)) * 6}px)`,
          };

        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              overflow: mode === "rise" ? "hidden" : "visible",
              verticalAlign: "top",
              paddingBottom: mode === "rise" ? "0.08em" : 0,
              marginRight: "0.25em",
            }}
          >
            <span style={{ display: "inline-block", ...inner, ...wordStyle?.(word, i) }}>{word}</span>
          </span>
        );
      })}
    </div>
  );
};
