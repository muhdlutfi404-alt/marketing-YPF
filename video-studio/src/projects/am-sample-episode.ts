/**
 * EXAMPLE PROJECT — how a real Project A.M episode plugs footage into the template.
 *
 * 1. Run `npm run samples` (creates demo clips) and `npm run prepare-footage`.
 *    For a real episode, put YOUR clips in public/footage/raw and run `npm run prepare-footage`.
 * 2. Point each `clip.src` at a file in public/footage/ready/.
 * 3. Set `trimBeforeSec` to the second where the good part of the clip starts.
 *
 * Copy this file for every new episode (e.g. am-episode-02.ts) and register it in Root.tsx.
 */
import { projectAMDefaults, type ProjectAMProps } from "../brands/project-am/templates/ProjectAMDocumentary";

export const amSampleEpisode: ProjectAMProps = {
  ...projectAMDefaults,
  episodeLabel: "PROJECT A.M · SAMPLE",
  title: "FOOTAGE TEST",
  subtitle: "This version uses real video files instead of placeholders.",
  coldOpen: {
    ...projectAMDefaults.coldOpen,
    clip: { src: "footage/ready/sample-landscape-60fps.mp4", trimBeforeSec: 0, placeholder: "night-camp" },
  },
  chapters: projectAMDefaults.chapters.map((chapter, i) => ({
    ...chapter,
    clip: {
      ...chapter.clip,
      // chapter 2 uses the vertical phone clip to show it is cropped automatically
      src: i === 1 ? "footage/ready/sample-vertical-phone.mp4" : "footage/ready/sample-landscape-60fps.mp4",
      trimBeforeSec: i * 2,
    },
  })),
  quote: {
    ...projectAMDefaults.quote,
    clip: { src: "footage/ready/sample-kitchen.mp4", trimBeforeSec: 1, placeholder: "golden-ridge" },
  },
};
