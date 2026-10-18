import type { ReactElement } from 'react';

const PATHS = {
  'chevron-left': ['M10 3.5 5.5 8l4.5 4.5'],
  'chevron-right': ['M6 3.5 10.5 8 6 12.5'],
  calendar: [
    'M2 6.5h12',
    'M5.5 1.5v3',
    'M10.5 1.5v3',
    'M4 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
  ],
  close: ['M4 4l8 8', 'M12 4l-8 8'],
} as const;

export type IconName = keyof typeof PATHS;

/** The Figma icon set, 16px, stroked with currentColor. */
export function Icon({ name }: { name: IconName }): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
