import type { PresetState } from '@nepdate/datepicker';
import { el, setAttrs, setText } from './dom';

/** Panel width with and without the presets column. */
export const PANEL_WIDTH = 320;
export const PANEL_WIDTH_WITH_PRESETS = 492;
export const TIME_COLUMNS_WIDTH = 136;

/** The shortcut buttons beside the calendar. Hidden when there are none. */
export class PresetList {
  readonly element: HTMLDivElement;
  private ids = '';

  constructor(onApply: (id: string) => void) {
    this.element = el('div', { class: 'ndp-presets', role: 'group', hidden: true });
    this.element.addEventListener('click', (event) => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLButtonElement>('.ndp-preset')
          : null;
      const id = button?.dataset['preset'];
      if (id !== undefined && button && !button.disabled) {
        onApply(id);
      }
    });
  }

  render(presets: readonly PresetState[], label: string): void {
    this.element.hidden = presets.length === 0;
    setAttrs(this.element, { 'aria-label': label });
    const ids = presets.map((preset) => preset.id).join('\n');
    if (ids !== this.ids) {
      this.ids = ids;
      this.element.replaceChildren(
        ...presets.map((preset) =>
          el('button', { type: 'button', class: 'ndp-preset', 'data-preset': preset.id }),
        ),
      );
    }
    presets.forEach((preset, index) => {
      const button = this.element.children[index];
      if (button) {
        setText(button, preset.label);
        setAttrs(button, {
          'aria-pressed': preset.isActive ? 'true' : 'false',
          disabled: preset.isDisabled,
        });
      }
    });
  }
}
