import React from "react";
import { useCurrentFrame } from "remotion";
import { Backdrop, Dust, Ring, Stage } from "../Backdrop";
import { clamp, hash, ring, since, useBeat } from "../motion";
import { BONE, THEMES, VERMILION } from "../theme";

/**
 * Beat 0. A dot drops in, thuds, and charges up.
 * The whole video grows out of this dot and ends on it.
 */
export const Pickup: React.FC<{ from: number }> = ({ from }) => {
  const beat = useBeat(from);
  const frame = useCurrentFrame();
  const theme = THEMES.ink;
  const R = 40;
  const LAND = 0.5;

  const tLand = since(beat, LAND);
  const fall = clamp(beat / LAND);
  const charge = clamp((beat - 0.58) / 0.42);

  let y = 0;
  let sx = 1;
  let sy = 1;
  if (beat < LAND) {
    // falling: accelerate, stretch along the motion
    y = -455 * (1 - fall * fall);
    sy = 1 + 1.2 * fall;
    sx = 1 / Math.sqrt(sy);
  } else {
    // contact: squash flat against the floor, ring back
    const q = 0.52 * ring(tLand, 6.5, 0.3);
    sy = 1 - q;
    sx = 1 + q * 0.9;
    y = R * q;
  }
  const shrink = 1 - 0.38 * charge * charge;
  const jx = (hash(frame) - 0.5) * 12 * charge;
  const jy = (hash(frame + 77) - 0.5) * 12 * charge;
  const dust = tLand / 0.19;

  return (
    <Stage>
      <Backdrop
        theme={theme}
        beat={beat}
        ripples={[{ beat: LAND, strength: 0.7 }]}
        suck={charge * 0.8}
        gridOpacity={1}
      />
      {/* energy pulled into the dot while it charges */}
      {[0, 1, 2, 3].map((k) => {
        const p = clamp((beat - 0.55 - k * 0.09) / 0.28);
        return (
          <Ring
            key={k}
            r={p > 0 && p < 1 ? 820 * Math.pow(1 - p, 1.5) + 46 : 0}
            width={2 + 7 * p}
            color={BONE}
            opacity={p}
            cx={0}
            cy={0}
          />
        );
      })}
      {/* dust ring from the landing */}
      <Dust p={dust} size={300} color={BONE} cx={0} cy={R} />
      {/* streak behind the falling dot */}
      {beat < LAND ? (
        <line
          x1={0}
          y1={y - 380 * fall}
          x2={0}
          y2={y}
          stroke={VERMILION}
          strokeWidth={R * 1.3 * sx}
          strokeLinecap="round"
          opacity={0.4}
        />
      ) : null}
      <ellipse
        cx={jx}
        cy={y + jy}
        rx={R * sx * shrink}
        ry={R * sy * shrink}
        fill={VERMILION}
      />
    </Stage>
  );
};
