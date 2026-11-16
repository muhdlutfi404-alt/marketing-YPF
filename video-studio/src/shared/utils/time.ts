import { FPS } from "../constants";

/** Convert seconds → frames. Remotion counts time in frames (30 per second). */
export const sec = (seconds: number, fps: number = FPS): number =>
  Math.round(seconds * fps);
