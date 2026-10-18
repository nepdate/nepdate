import type { CSSProperties, ReactElement } from 'react';
import type { CalendarBindings } from './bindings';
import { Icon } from './icons';

/** The calendar markup (@nepdate/styles contract) for any set of bindings. */
export function CalendarBody({
  bindings,
  className,
  theme,
}: {
  bindings: CalendarBindings;
  className?: string | undefined;
  theme?: string | undefined;
}): ReactElement {
  const { state } = bindings;
  const tiles = state.view === 'month' ? state.months : state.years;

  return (
    <div
      className={className ? `ndp-calendar ${className}` : 'ndp-calendar'}
      data-ndp-theme={theme}
    >
      <div className="ndp-calendar__header">
        <button className="ndp-icon-button" {...bindings.getPrevProps()}>
          <Icon name="chevron-left" />
        </button>
        <div className="ndp-calendar__title" aria-live="polite">
          {bindings.getTitleButtons().map((button) => (
            <button
              key={button.key}
              className="ndp-calendar__title-button"
              {...button.props}
            >
              {button.label}
            </button>
          ))}
        </div>
        <button className="ndp-icon-button" {...bindings.getNextProps()}>
          <Icon name="chevron-right" />
        </button>
      </div>
      {state.view === 'day' ? (
        <table className="ndp-grid" {...bindings.getGridProps()}>
          <thead>
            <tr role="row">
              {state.weekdays.map((weekday) => (
                <th
                  key={weekday.index}
                  className="ndp-weekday"
                  scope="col"
                  role="columnheader"
                  abbr={weekday.longLabel}
                  data-weekend={weekday.isWeekend || undefined}
                >
                  {weekday.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.weeks.map((week, row) => (
              <tr key={row} role="row">
                {week.map((cell, column) =>
                  cell ? (
                    <td
                      key={cell.key}
                      role="gridcell"
                      aria-selected={cell.isSelected || undefined}
                    >
                      <button className="ndp-day" {...bindings.getDayProps(cell)}>
                        <span className="ndp-sr-only">{cell.ariaLabel}</span>
                        <span className="ndp-day__label" aria-hidden="true">
                          {cell.label}
                        </span>
                        {cell.subLabel !== null && (
                          <span className="ndp-day__sub" aria-hidden="true">
                            {cell.subLabel}
                          </span>
                        )}
                        {cell.events[0] && (
                          <span
                            className="ndp-day__dot"
                            aria-hidden="true"
                            style={
                              cell.events[0].color
                                ? ({
                                    '--ndp-dot-color': cell.events[0].color,
                                  } as CSSProperties)
                                : undefined
                            }
                          />
                        )}
                      </button>
                    </td>
                  ) : (
                    <td key={`empty-${column}`} role="gridcell" />
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="ndp-options" role="group" aria-label={state.title}>
          {tiles.map((tile, index) => (
            <button
              key={tile.value}
              className="ndp-option"
              {...bindings.getOptionProps(tile, index, tiles)}
            >
              <span className="ndp-option__label">{tile.label}</span>
              {tile.subLabel !== null && (
                <span className="ndp-option__sub">{tile.subLabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
