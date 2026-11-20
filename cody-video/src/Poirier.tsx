import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Finish, Shake, type ShakeHit } from "./Backdrop";
import { Bounce } from "./poirier/Bounce";
import { Dominoes } from "./poirier/Dominoes";
import { DropP } from "./poirier/DropP";
import { FinalP } from "./poirier/FinalP";
import { Juggle } from "./poirier/Juggle";
import { CODY_DOT_X, CODY_DOT_Y, PickupJoined } from "./poirier/PickupJoined";
import { SolosP } from "./poirier/SolosP";
import { Syllables } from "./poirier/Syllables";
import { Tunnel } from "./poirier/Tunnel";
import { bar, beatToFrame, DURATION_FRAMES } from "./score";
import { FILL7_BEATS } from "./score-poirier";
import { Pickup } from "./scenes/Pickup";
import { INK } from "./theme";

const cut = (barNo: number) => Math.round(beatToFrame(bar(barNo)));

const SHAKES: ShakeHit[] = [
  { beat: 1, amp: 16 },
  { beat: 2.5, amp: 10 },
  { beat: 3.5, amp: 10 },
  { beat: 9, amp: 7 },
  { beat: 11, amp: 12 },
  { beat: 13, amp: 10 },
  { beat: 17, amp: 34 },
  { beat: 18, amp: 5 },
  { beat: 19, amp: 5 },
  { beat: 20, amp: 5 },
  { beat: 26, amp: 7 },
  { beat: 27, amp: 8 },
  ...FILL7_BEATS.map((beat) => ({ beat, amp: 4 })),
  { beat: 29, amp: 20 },
];

/**
 * The POIRIER picture. `joined` is the version that follows CODY in the
 * 30-second cut: it starts from CODY's last frame and ends on the full name.
 */
export const PoirierPicture: React.FC<{ joined: boolean }> = ({ joined }) => {
  return (
    <Shake shakes={SHAKES}>
      <Sequence name="Pickup: the dot" durationInFrames={cut(1)} layout="none">
        {joined ? <PickupJoined from={0} /> : <Pickup from={0} />}
      </Sequence>
      <Sequence
        name="Bar 1: POI / RI / ER"
        from={cut(1)}
        durationInFrames={cut(2) - cut(1)}
        layout="none"
      >
        <Syllables
          from={cut(1)}
          irisX={joined ? CODY_DOT_X : 0}
          irisY={joined ? CODY_DOT_Y : 0}
        />
      </Sequence>
      <Sequence
        name="Bar 2: the ball builds the name"
        from={cut(2)}
        durationInFrames={cut(3) - cut(2)}
        layout="none"
      >
        <Bounce from={cut(2)} />
      </Sequence>
      <Sequence
        name="Bar 3: dominoes"
        from={cut(3)}
        durationInFrames={cut(4) - cut(3)}
        layout="none"
      >
        <Dominoes from={cut(3)} />
      </Sequence>
      <Sequence
        name="Bar 4: shaken loose, then through the O"
        from={cut(4)}
        durationInFrames={cut(5) - cut(4)}
        layout="none"
      >
        <Tunnel from={cut(4)} />
      </Sequence>
      <Sequence
        name="Bar 5: THE DROP"
        from={cut(5)}
        durationInFrames={cut(6) - cut(5)}
        layout="none"
      >
        <DropP from={cut(5)} />
      </Sequence>
      <Sequence
        name="Bar 6: syllable solos"
        from={cut(6)}
        durationInFrames={cut(7) - cut(6)}
        layout="none"
      >
        <SolosP from={cut(6)} />
      </Sequence>
      <Sequence
        name="Bar 7: juggled, then landed in order"
        from={cut(7)}
        durationInFrames={cut(8) - cut(7)}
        layout="none"
      >
        <Juggle from={cut(7)} joined={joined} />
      </Sequence>
      <Sequence
        name="Bar 8: clean"
        from={cut(8)}
        durationInFrames={DURATION_FRAMES - cut(8)}
        layout="none"
      >
        <FinalP from={cut(8)} joined={joined} />
      </Sequence>
    </Shake>
  );
};

export const Poirier: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Audio src={staticFile("poirier-track.wav")} />
      <PoirierPicture joined={false} />
      <Finish />
    </AbsoluteFill>
  );
};
