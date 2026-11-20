/**
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
// Flat colour and hard vector edges: PNG frames avoid JPEG ringing around the letters.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
