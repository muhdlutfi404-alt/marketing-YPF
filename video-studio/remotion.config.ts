/**
 * Remotion render settings — applies to `npm run studio` and every `npm run render…`.
 * Docs: https://www.remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

// Final MP4 settings: H.264 is playable everywhere (YouTube, TikTok, WhatsApp, phones).
Config.setCodec("h264");
// CRF = quality. Lower = better & bigger. 18 is visually lossless for social media.
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
// Standard BT.709 "TV range" colour — what phones, YouTube, TikTok & Instagram expect.
// (Remotion 4's default writes untagged full-range "yuvj420p", which some Android
// players and upload pipelines show with washed-out or crushed colours.)
Config.setColorSpace("bt709");
// JPEG frames render faster than PNG and are fine for non-transparent videos.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
// Re-rendering the same file name just replaces it.
Config.setOverwriteOutput(true);
