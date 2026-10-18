import type { ReactElement, ReactNode } from 'react';
import type { PresetState } from '@nepdate/datepicker';

/** Panel widths: calendar alone, plus presets column, plus time columns. */
export const PANEL_WIDTH = 320;
export const PANEL_WIDTH_WITH_PRESETS = 492;
export const TIME_COLUMNS_WIDTH = 136;

/** The panel body: the shortcut list (when there are presets), then the calendar and anything else. */
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
  return (
    <div className="ndp-panel__body">
      {presets.length > 0 && (
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
      )}
      {children}
    </div>
  );
}
