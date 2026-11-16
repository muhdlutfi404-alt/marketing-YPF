import React from "react";

/**
 * Covers text that was burned into the source footage (e.g. captions added by another app),
 * so our corrected subtitles don't double up. Lives INSIDE the zoomed footage, so it always
 * sits exactly over the old text. Footage elsewhere is untouched.
 */
export const CoverBands: React.FC<{ bands: { y0: number; y1: number }[]; color: string }> = ({ bands, color }) => (
  <>
    {bands.map((b, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${b.y0 * 100}%`,
          height: `${(b.y1 - b.y0) * 100}%`,
          backdropFilter: "blur(28px) saturate(0.8)",
          WebkitBackdropFilter: "blur(28px) saturate(0.8)",
          background: `linear-gradient(180deg, ${color}00 0%, ${color}f0 7%, ${color}f2 50%, ${color}f0 93%, ${color}00 100%)`,
        }}
      />
    ))}
  </>
);
