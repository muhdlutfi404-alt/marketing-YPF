import { Easing } from "remotion";
import { linearTiming, type TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { iris } from "@remotion/transitions/iris";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { flash, frostDissolve, lightLeak, zoomPunch } from "./custom";

/**
 * Every transition available to the templates, by name.
 * Names are used in template settings so you can switch style from the Studio sidebar.
 */
export const TRANSITION_NAMES = [
  "fade",
  "slide",
  "wipe",
  "iris",
  "clock-wipe",
  "flash",
  "zoom-punch",
  "light-leak",
  "frost-dissolve",
] as const;
export type TransitionName = (typeof TRANSITION_NAMES)[number];

export const makePresentation = (
  name: TransitionName,
  size: { width: number; height: number },
  index = 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TransitionPresentation<any> => {
  const directions = ["from-right", "from-bottom", "from-left", "from-top"] as const;
  switch (name) {
    case "fade":
      return fade();
    case "slide":
      return slide({ direction: directions[index % 4] });
    case "wipe":
      return wipe({ direction: index % 2 === 0 ? "from-left" : "from-top-right" });
    case "iris":
      return iris({ width: size.width, height: size.height });
    case "clock-wipe":
      return clockWipe({ width: size.width, height: size.height });
    case "flash":
      return flash();
    case "zoom-punch":
      return zoomPunch();
    case "light-leak":
      return lightLeak();
    case "frost-dissolve":
      return frostDissolve();
  }
};

export const makeTiming = (durationInFrames: number) =>
  linearTiming({ durationInFrames, easing: Easing.inOut(Easing.cubic) });
