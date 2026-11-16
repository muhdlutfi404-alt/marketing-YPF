import React from "react";

/** Simple line icons for feature lists. Add your own by adding a key + SVG path. */
export const ICON_NAMES = ["snowflake", "clock", "flame", "shield", "star", "leaf", "heart", "truck"] as const;
export type IconName = (typeof ICON_NAMES)[number];

const paths: Record<IconName, React.ReactNode> = {
  snowflake: (
    <g>
      <path d="M12 2v20M4.9 7l14.2 10M4.9 17L19.1 7" />
      <path d="M9 4l3 2 3-2M9 20l3-2 3 2" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </g>
  ),
  flame: <path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 2 1.3 3 2.5 3-1.5-3 0-6 0-9z" />,
  shield: (
    <g>
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </g>
  ),
  star: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />,
  leaf: (
    <g>
      <path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" />
      <path d="M5 19l8-8" />
    </g>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z" />,
  truck: (
    <g>
      <path d="M2 6h11v10H2zM13 10h4.5l3 3.2V16H13z" />
      <circle cx="6" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </g>
  ),
};

export const Icon: React.FC<{ name: IconName; size: number; color: string; strokeWidth?: number }> = ({ name, size, color, strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {paths[name]}
  </svg>
);
