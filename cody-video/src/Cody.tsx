import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Finish, Shake } from "./Backdrop";
import { bar, beatToFrame, DURATION_FRAMES } from "./score";
import { Build } from "./scenes/Build";
import { Burst } from "./scenes/Burst";
import { Drop } from "./scenes/Drop";
import { Final } from "./scenes/Final";
import { Pickup } from "./scenes/Pickup";
import { Slice } from "./scenes/Slice";
import { Solos } from "./scenes/Solos";
import { Stomps } from "./scenes/Stomps";
import { Wall } from "./scenes/Wall";
import { INK } from "./theme";

/** Every cut sits on a bar line of the track. */
const cut = (barNo: number) => Math.round(beatToFrame(bar(barNo)));

export const Cody: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Audio src={staticFile("cody-track.wav")} />
      <Shake>
        <Sequence
          name="Pickup: the dot"
          durationInFrames={cut(1)}
          layout="none"
        >
          <Pickup from={0} />
        </Sequence>
        <Sequence
          name="Bar 1: C / O / D / Y stomps"
          from={cut(1)}
          durationInFrames={cut(2) - cut(1)}
          layout="none"
        >
          <Stomps from={cut(1)} />
        </Sequence>
        <Sequence
          name="Bar 2: the name builds"
          from={cut(2)}
          durationInFrames={cut(3) - cut(2)}
          layout="none"
        >
          <Build from={cut(2)} />
        </Sequence>
        <Sequence
          name="Bar 3: sliced"
          from={cut(3)}
          durationInFrames={cut(4) - cut(3)}
          layout="none"
        >
          <Slice from={cut(3)} />
        </Sequence>
        <Sequence
          name="Bar 4: burst into parts, pulled into the dot"
          from={cut(4)}
          durationInFrames={cut(5) - cut(4)}
          layout="none"
        >
          <Burst from={cut(4)} />
        </Sequence>
        <Sequence
          name="Bar 5: THE DROP"
          from={cut(5)}
          durationInFrames={cut(6) - cut(5)}
          layout="none"
        >
          <Drop from={cut(5)} />
        </Sequence>
        <Sequence
          name="Bar 6: letter solos"
          from={cut(6)}
          durationInFrames={cut(7) - cut(6)}
          layout="none"
        >
          <Solos from={cut(6)} />
        </Sequence>
        <Sequence
          name="Bar 7: wall, then the letters land"
          from={cut(7)}
          durationInFrames={cut(8) - cut(7)}
          layout="none"
        >
          <Wall from={cut(7)} />
        </Sequence>
        <Sequence
          name="Bar 8: clean"
          from={cut(8)}
          durationInFrames={DURATION_FRAMES - cut(8)}
          layout="none"
        >
          <Final from={cut(8)} />
        </Sequence>
      </Shake>
      <Finish />
    </AbsoluteFill>
  );
};
