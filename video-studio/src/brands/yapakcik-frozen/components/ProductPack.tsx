import React from "react";
import { FROZEN_THEME } from "../theme";
import { Snowflake } from "./FrostBackdrop";

/**
 * A 3D product box drawn in code — used when you haven't supplied a product photo.
 * `rotateY` turns it, `shine` (0–1) sweeps a highlight across the front.
 */
export const ProductPack: React.FC<{
  width: number;
  brand: string;
  productName: string;
  category: string;
  color: string;
  rotateY: number;
  rotateX?: number;
  shine: number;
}> = ({ width, brand, productName, category, color, rotateY, rotateX = 8, shine }) => {
  const h = width * 1.3;
  const depth = width * 0.32;
  const c = FROZEN_THEME.colors;
  const f = FROZEN_THEME.fonts;
  const face: React.CSSProperties = { position: "absolute", backfaceVisibility: "hidden", borderRadius: width * 0.03, overflow: "hidden" };
  return (
    <div style={{ width, height: h, perspective: width * 5 }}>
      <div style={{ position: "relative", width, height: h, transformStyle: "preserve-3d", transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}>
        {/* FRONT */}
        <div style={{ ...face, width, height: h, transform: `translateZ(${depth / 2}px)`, background: `linear-gradient(160deg, ${color} 0%, ${c.navy} 100%)`, boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.15)" }}>
          <div style={{ background: c.white, color: c.navy, padding: `${width * 0.05}px ${width * 0.07}px`, fontFamily: f.sans, fontWeight: 900, fontSize: width * 0.078, whiteSpace: "nowrap" }}>
            {brand.toUpperCase()}
            <span style={{ color: c.cyan, marginLeft: width * 0.025 }}>FROZEN</span>
          </div>
          {/* "window" showing the food */}
          <div style={{ margin: `${width * 0.07}px auto 0`, width: width * 0.78, height: width * 0.55, borderRadius: width * 0.06, background: "radial-gradient(circle at 50% 40%, #ffe2a6, #e9a24a 60%, #b8651f)", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 30px rgba(0,0,0,0.35)" }}>
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${8 + ((i * 37) % 70)}%`,
                  top: `${12 + ((i * 53) % 60)}%`,
                  width: width * 0.17,
                  height: width * 0.13,
                  borderRadius: "45% 55% 50% 50%",
                  background: "radial-gradient(circle at 35% 35%, #ffd27a, #d98a2b 70%, #a8571a)",
                  transform: `rotate(${i * 47}deg)`,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
                }}
              />
            ))}
          </div>
          <div style={{ padding: `${width * 0.06}px ${width * 0.07}px 0`, fontFamily: f.impact, color: c.white, fontSize: width * 0.13, lineHeight: 0.95, textTransform: "uppercase" }}>{productName}</div>
          <div style={{ padding: `${width * 0.02}px ${width * 0.07}px`, fontFamily: f.sans, fontWeight: 600, color: c.ice, fontSize: width * 0.05 }}>{category}</div>
          <div style={{ position: "absolute", right: width * 0.06, bottom: width * 0.06, display: "flex", alignItems: "center", gap: width * 0.02, background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: `${width * 0.015}px ${width * 0.035}px`, fontFamily: f.sans, fontWeight: 800, color: c.white, fontSize: width * 0.045 }}>
            <Snowflake size={width * 0.06} color={c.ice} /> -18°C
          </div>
          {/* shine sweep */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${shine * 140 - 40}%, rgba(255,255,255,0.55) ${shine * 140 - 25}%, transparent ${shine * 140 - 10}%)` }} />
        </div>
        {/* SIDE */}
        <div style={{ ...face, width: depth, height: h, left: width / 2 - depth / 2, transform: `rotateY(90deg) translateZ(${width / 2}px)`, background: `linear-gradient(180deg, ${color}, #041022)`, filter: "brightness(0.7)" }} />
        {/* TOP */}
        <div style={{ ...face, width, height: depth, top: h / 2 - depth / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)`, background: c.white, filter: "brightness(0.9)" }} />
      </div>
    </div>
  );
};
