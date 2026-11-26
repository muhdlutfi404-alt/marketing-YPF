import React from "react";
import { Composition, Folder } from "remotion";
import { FORMATS, FPS } from "./shared/constants";
import {
  ProjectAMDocumentary,
  calculateProjectAMMetadata,
  projectAMDefaults,
  projectAMSchema,
} from "./brands/project-am/templates/ProjectAMDocumentary";
import {
  FrozenCommercial,
  calculateFrozenMetadata,
  frozenCommercialDefaults,
  frozenCommercialSchema,
} from "./brands/yapakcik-frozen/templates/FrozenCommercial";
import { amSampleEpisode } from "./projects/am-sample-episode";
import { frozenSampleReelBM } from "./projects/frozen-sample-reel-bm";
import { StoryEdit, calculateStoryMetadata } from "./story/StoryEdit";
import { sampleBundle } from "./story/sampleBundle";
import { Animatic, calculateAnimaticMetadata, type AnimaticProps } from "./story/Animatic";

/**
 * THE MENU OF VIDEOS shown in Remotion Studio's left sidebar.
 * Every template is registered twice: Landscape (16:9) and Vertical (9:16).
 * The `id` is what you type in `npx remotion render <id>`.
 * Durations are calculated automatically from each template's settings.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Project-AM">
        <Composition
          id="ProjectAM-Documentary-Landscape"
          component={ProjectAMDocumentary}
          schema={projectAMSchema}
          defaultProps={projectAMDefaults}
          calculateMetadata={calculateProjectAMMetadata}
          durationInFrames={FPS * 45}
          fps={FPS}
          {...FORMATS.landscape}
        />
        <Composition
          id="ProjectAM-Documentary-Vertical"
          component={ProjectAMDocumentary}
          schema={projectAMSchema}
          defaultProps={projectAMDefaults}
          calculateMetadata={calculateProjectAMMetadata}
          durationInFrames={FPS * 45}
          fps={FPS}
          {...FORMATS.vertical}
        />
      </Folder>

      <Folder name="YaPakCik-Frozen">
        <Composition
          id="YaPakCikFrozen-Commercial-Landscape"
          component={FrozenCommercial}
          schema={frozenCommercialSchema}
          defaultProps={frozenCommercialDefaults}
          calculateMetadata={calculateFrozenMetadata}
          durationInFrames={FPS * 30}
          fps={FPS}
          {...FORMATS.landscape}
        />
        <Composition
          id="YaPakCikFrozen-Commercial-Vertical"
          component={FrozenCommercial}
          schema={frozenCommercialSchema}
          defaultProps={frozenCommercialDefaults}
          calculateMetadata={calculateFrozenMetadata}
          durationInFrames={FPS * 30}
          fps={FPS}
          {...FORMATS.vertical}
        />
      </Folder>

      {/* Real projects using your footage. Run `npm run samples && npm run prepare-footage` first for these demos. */}
      <Folder name="Projects">
        <Composition
          id="Sample-AM-Episode-Landscape"
          component={ProjectAMDocumentary}
          schema={projectAMSchema}
          defaultProps={amSampleEpisode}
          calculateMetadata={calculateProjectAMMetadata}
          durationInFrames={FPS * 45}
          fps={FPS}
          {...FORMATS.landscape}
        />
        <Composition
          id="Sample-Frozen-Reel-BM-Vertical"
          component={FrozenCommercial}
          schema={frozenCommercialSchema}
          defaultProps={frozenSampleReelBM}
          calculateMetadata={calculateFrozenMetadata}
          durationInFrames={FPS * 30}
          fps={FPS}
          {...FORMATS.vertical}
        />
      </Folder>

      {/* RAW-FOOTAGE STORY EDITS — one composition for every project.
          `npm run story:render -- <project>` passes that project's edit as props.
          In the Studio it previews the sample project. */}
      <Folder name="Story-Edits">
        <Composition
          id="StoryEdit"
          component={StoryEdit}
          defaultProps={sampleBundle}
          calculateMetadata={calculateStoryMetadata}
          durationInFrames={FPS * 30}
          fps={FPS}
          {...FORMATS.vertical}
        />
      </Folder>
      {/* ANIMATION PROJECTS — story & timing animatics (character art + voice-over). */}
      <Folder name="Animation">
        <Composition
          id="Animatic"
          component={Animatic}
          defaultProps={{ title: "sample", duration: 3, master: "characters/ayoh-mad/00-master/master-cutout.png", vo: { src: "sfx/pop.mp3", at: 0 }, music: { src: "music/story-documentary-bed.mp3", volume: 0.3, duckTo: 0.2 }, words: [], scenes: [{ id: "s", from: 0, to: 3, pose: 1, bg: "brand" }], layers: [] } as AnimaticProps}
          calculateMetadata={calculateAnimaticMetadata}
          durationInFrames={FPS * 3}
          fps={FPS}
          {...FORMATS.vertical}
        />
      </Folder>
    </>
  );
};
