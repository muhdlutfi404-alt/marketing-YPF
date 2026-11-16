/**
 * Works out when every scene starts once transitions are taken into account.
 *
 * In a <TransitionSeries>, a transition OVERLAPS the end of one scene and the
 * start of the next, so the video is shorter than the sum of its scenes.
 * We use the result to (a) set the composition length automatically and
 * (b) place whoosh sound-effects exactly on each transition.
 */
export type TimelineInput = { id: string; durationInFrames: number };
export type TimelineEntry = TimelineInput & { from: number };

export const buildTimeline = (
  scenes: TimelineInput[],
  transitionFrames: number,
): { scenes: TimelineEntry[]; totalDurationInFrames: number } => {
  let cursor = 0;
  const out: TimelineEntry[] = [];
  scenes.forEach((scene, i) => {
    out.push({ ...scene, from: cursor });
    const isLast = i === scenes.length - 1;
    cursor += scene.durationInFrames - (isLast ? 0 : transitionFrames);
  });
  return { scenes: out, totalDurationInFrames: Math.max(1, cursor) };
};
