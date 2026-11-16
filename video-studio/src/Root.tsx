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
    </>
  );
};
