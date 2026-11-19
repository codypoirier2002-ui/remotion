import React from "react";
import { Composition, Still } from "remotion";
import { Cody } from "./Cody";
import { CodyPoirier } from "./CodyPoirier";
import { Poirier } from "./Poirier";
import { DURATION_FRAMES, FPS } from "./score";
import { Specimen, SpecimenPoirier } from "./Specimen";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Cody"
        component={Cody}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Poirier"
        component={Poirier}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="CodyPoirier"
        component={CodyPoirier}
        durationInFrames={DURATION_FRAMES * 2}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Still id="Specimen" component={Specimen} width={1920} height={1080} />
      <Still
        id="SpecimenPoirier"
        component={SpecimenPoirier}
        width={1920}
        height={1080}
      />
    </>
  );
};
