/**
 * @nepdate/datepicker: BS/AD date picker behaviour, and nothing else. Typed
 * text ⇄ value, validation messages, the BS/AD switch, open/close, single and
 * range values. Renders nothing; adapters do (docs/plan packages/datepicker).
 */
export { createDatePicker } from './picker';
export { createDateRangePicker } from './range';
export {
  checkDate,
  equivalentText,
  formatInput,
  parseInput,
  placeholderText,
  type InputLimits,
  type ParseResult,
} from './input';
export {
  resolveRangePreset,
  resolveSinglePreset,
  type CustomPreset,
  type PresetContext,
  type PresetRange,
  type PresetState,
  type RangePreset,
  type RangePresetId,
  type SinglePreset,
  type SinglePresetId,
} from './presets';
export type {
  DateDetail,
  DateError,
  DateErrorCode,
  DatePickerActions,
  DatePickerOptions,
  DatePickerState,
  DatePickerStore,
  DateRangePickerActions,
  DateRangePickerOptions,
  DateRangePickerState,
  DateRangePickerStore,
  PickerBaseOptions,
  RangeDetail,
  RangeField,
  RangeValue,
} from './types';
