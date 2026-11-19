import { CAP_HALF, POIRIER_SPEC, WORD_WIDTH } from "../Glyph";
import { WORD_R } from "../scenes/Build";

export const SPEC = POIRIER_SPEC;
/** Same letter size as CODY, so the two names match when they share a frame. */
export const P_R = WORD_R;
/** The drop: as wide as the frame allows once the overshoot is counted in. */
export const P_BIG = 1660 / SPEC.width;
export const P_CAP = CAP_HALF * P_R;

export const DOT_R = 0.42 * P_R;
/** Gap between the last R and the full stop. */
export const DOT_GAP = 0.24 * P_R;
/** The lockup is the word plus a full stop: nudge left so the pair is centred. */
export const LOCK_DX = -(DOT_GAP + 2 * DOT_R) / 2;
/** Joined cut: CODY on the line above, POIRIER on the line below, flush left. */
export const LINE_Y = 188;
export const CODY_DX = LOCK_DX - ((SPEC.width - WORD_WIDTH) / 2) * P_R - 5;
