import type { ReactElement, ReactNode } from 'react';
import type { PresetState } from '@nepdate/datepicker';

/** Panel width with and without the presets column. */
export const PANEL_WIDTH = 320;
export const PANEL_WIDTH_WITH_PRESETS = 492;

/** The calendar, with the shortcut list beside it when there are presets. */
export function PanelBody({
  presets,
  label,
  onPreset,
  children,
}: {
  presets: readonly PresetState[];
  label: string;
  onPreset: (id: string) => void;
  children: ReactNode;
}): ReactElement {
  if (presets.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className="ndp-panel__body">
      <div className="ndp-presets" role="group" aria-label={label}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="ndp-preset"
            aria-pressed={preset.isActive}
            disabled={preset.isDisabled}
            onClick={() => {
              onPreset(preset.id);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
