import React from "react";
import { Composition, Still } from "remotion";
import { Cody } from "./Cody";
import { DURATION_FRAMES, FPS } from "./score";
import { Specimen } from "./Specimen";

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
      <Still id="Specimen" component={Specimen} width={1920} height={1080} />
    </>
  );
};
