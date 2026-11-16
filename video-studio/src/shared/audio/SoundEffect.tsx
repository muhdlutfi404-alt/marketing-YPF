import React from "react";
import { Sequence } from "remotion";
import { Audio } from "@remotion/media";
import { resolveMedia } from "../utils/media";
import { SFX, type SfxName } from "./library";

export type SfxCue = {
  /** Name from the sound library, e.g. "whoosh" */
  sfx: SfxName;
  /** Frame (relative to the parent sequence) the sound starts on */
  at: number;
  /** 0 – 1 */
  volume?: number;
  /** Speed / pitch. 0.8 = deeper, 1.2 = higher */
  playbackRate?: number;
};

/** Plays a single sound effect at a given frame. */
export const SoundEffect: React.FC<SfxCue & { masterVolume?: number }> = ({
  sfx,
  at,
  volume = 0.8,
  playbackRate = 1,
  masterVolume = 1,
}) => (
  <Sequence from={Math.max(0, Math.round(at))} layout="none" name={`SFX · ${sfx}`}>
    <Audio src={resolveMedia(SFX[sfx])} volume={volume * masterVolume} playbackRate={playbackRate} />
  </Sequence>
);

/** Plays a list of cues — the "sound design track" of a template. */
export const SfxTrack: React.FC<{ cues: SfxCue[]; masterVolume?: number }> = ({
  cues,
  masterVolume = 1,
}) => (
  <>
    {cues.map((cue, i) => (
      <SoundEffect key={`${cue.sfx}-${cue.at}-${i}`} {...cue} masterVolume={masterVolume} />
    ))}
  </>
);
