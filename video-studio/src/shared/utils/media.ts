import { staticFile } from "remotion";

/**
 * Turns a path like "footage/ready/clip.mp4" (relative to /public)
 * into a URL Remotion can load. Full http(s) URLs are passed through.
 */
export const resolveMedia = (src: string): string =>
  /^https?:\/\//.test(src) ? src : staticFile(src.replace(/^\/+/, ""));
