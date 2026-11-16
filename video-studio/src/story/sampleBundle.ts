/**
 * Default data for the StoryEdit composition in Remotion Studio: the SAMPLE project.
 * Real projects are rendered with `npm run story:render -- <project>`, which passes
 * their own data as props, so you never need to edit this file.
 * (Sample footage is generated, not committed: run `npm run story:sample` first.)
 */
import edit from "../edits/sample-frozen/edit.json";
import footage from "../edits/sample-frozen/footage.json";
import facts from "../edits/sample-frozen/facts.json";
import talking from "../edits/sample-frozen/transcripts/talking-sample.json";
import demo from "../edits/sample-frozen/transcripts/demo-sample.json";
import type { StoryBundle } from "./engine";

const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_")));

export const sampleBundle = {
  edit: clean(edit),
  clips: footage.clips,
  transcripts: { [talking.clip]: talking, [demo.clip]: demo },
  facts: clean(facts),
} as unknown as StoryBundle;
