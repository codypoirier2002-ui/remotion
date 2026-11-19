import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Finish } from "./Backdrop";
import { CodyPicture } from "./Cody";
import { PoirierPicture } from "./Poirier";
import { DURATION_FRAMES } from "./score";
import { INK } from "./theme";

/**
 * Both names as one 30-second film. The two halves share one beat grid and one
 * soundtrack rendered in a single pass, so nothing is cut at the join: CODY's
 * full stop swallows CODY and becomes the dot POIRIER comes out of, and the
 * film ends on the whole name.
 */
export const CodyPoirier: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Audio src={staticFile("cody-poirier-track.wav")} />
      <Sequence name="CODY" durationInFrames={DURATION_FRAMES}>
        <CodyPicture />
      </Sequence>
      <Sequence
        name="POIRIER"
        from={DURATION_FRAMES}
        durationInFrames={DURATION_FRAMES}
      >
        <PoirierPicture joined />
      </Sequence>
      <Finish />
    </AbsoluteFill>
  );
};
