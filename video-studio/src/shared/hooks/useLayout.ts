import { useVideoConfig } from "remotion";

/**
 * One hook that every component uses to adapt to landscape (16:9) or vertical (9:16).
 *
 * - `px(n)` scales a size designed for a 1080px short side, so designs look identical
 *   in 1080p, vertical or 4K.
 * - `safe` = margins that keep text away from edges and, in vertical, away from the
 *   TikTok/Reels buttons (right side) and caption area (bottom).
 */
export const useLayout = () => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const isVertical = height > width;
  const unit = Math.min(width, height) / 1080;
  const px = (n: number) => n * unit;
  const safe = isVertical
    ? { top: px(220), bottom: px(420), left: px(72), right: px(120) }
    : { top: px(80), bottom: px(90), left: px(120), right: px(120) };
  return { width, height, fps, durationInFrames, isVertical, unit, px, safe };
};
