import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../../../shared/components/AnimatedText";
import { AnimatedCounter } from "../../../shared/infographics/AnimatedCounter";
import { useLayout } from "../../../shared/hooks/useLayout";
import { AM_THEME } from "../theme";

/** GPS-style location tag: pin drops, place name types out, coordinates count up. */
export const LocationTag: React.FC<{
  place: string;
  latitude: number;
  longitude: number;
  altitudeM?: number;
  delay?: number;
}> = ({ place, latitude, longitude, altitudeM, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { px, safe, isVertical, width, height } = useLayout();
  const { colors, fonts } = AM_THEME;
  const pin = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 140 } });
  const panel = spring({ frame: frame - delay - 6, fps, config: { damping: 200 }, durationInFrames: 20 });
  const letterboxH = isVertical ? 0 : Math.max(0, (height - width / 2.39) / 2);
  const ns = latitude >= 0 ? "N" : "S";
  const ew = longitude >= 0 ? "E" : "W";
  const mono: React.CSSProperties = { fontFamily: fonts.body, fontSize: px(isVertical ? 30 : 24), color: colors.dim, letterSpacing: px(2) };
  if (frame < delay) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: isVertical ? safe.top : letterboxH + px(40),
        ...(isVertical ? { left: safe.left } : { right: safe.right }),
        display: "flex",
        gap: px(18),
        alignItems: "flex-start",
        flexDirection: isVertical ? "row" : "row-reverse",
        textAlign: isVertical ? "left" : "right",
      }}
    >
      <svg width={px(44)} height={px(60)} viewBox="0 0 24 32" style={{ transform: `translateY(${(1 - pin) * -px(60)}px)`, opacity: Math.min(1, pin * 2) }}>
        <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" fill={colors.ember} />
        <circle cx="12" cy="12" r="4.5" fill={colors.ink} />
      </svg>
      <div style={{ opacity: panel, transform: `translateY(${(1 - panel) * px(10)}px)` }}>
        <AnimatedText
          text={place.toUpperCase()}
          mode="typewriter"
          delay={delay + 8}
          stagger={2}
          style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: px(isVertical ? 40 : 34), color: colors.bone, letterSpacing: px(3) }}
        />
        <div style={{ ...mono, marginTop: px(6) }}>
          <AnimatedCounter to={Math.abs(latitude)} decimals={4} delay={delay + 10} durationInFrames={40} suffix={`° ${ns}`} thousandsSeparator={false} />
          {"   "}
          <AnimatedCounter to={Math.abs(longitude)} decimals={4} delay={delay + 10} durationInFrames={40} suffix={`° ${ew}`} thousandsSeparator={false} />
        </div>
        {altitudeM !== undefined ? (
          <div style={{ ...mono, marginTop: px(4) }}>
            ALT <AnimatedCounter to={altitudeM} delay={delay + 14} durationInFrames={40} suffix=" M" style={{ color: colors.bone }} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
