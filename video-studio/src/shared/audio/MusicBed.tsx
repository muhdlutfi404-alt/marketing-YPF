import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { resolveMedia } from "../utils/media";

/**
 * Background music / ambience with smooth fade-in and fade-out.
 * Loops automatically if the track is shorter than the video.
 */
export const MusicBed: React.FC<{
  src: string;
  volume?: number;
  fadeInSec?: number;
  fadeOutSec?: number;
  loop?: boolean;
  /** Optional "ducking": lower the music between these frames (e.g. under a voiceover) */
  duck?: { from: number; to: number; level: number }[];
}> = ({ src, volume = 0.5, fadeInSec = 1.5, fadeOutSec = 2.5, loop = true, duck = [] }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = Math.max(1, fadeInSec * fps);
  const fadeOut = Math.max(1, fadeOutSec * fps);
  return (
    <Audio
      src={resolveMedia(src)}
      loop={loop}
      loopVolumeCurveBehavior="extend"
      volume={(f) => {
        const envelope = interpolate(
          f,
          [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const ducking = duck.reduce((acc, d) => {
          const k = interpolate(f, [d.from - 8, d.from, d.to, d.to + 8], [1, d.level, d.level, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return acc * k;
        }, 1);
        return volume * envelope * ducking;
      }}
    />
  );
};
