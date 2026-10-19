import '@nepdate/styles/index.css';
import './playground.css';
import { StrictMode, useState, type ReactElement, type SyntheticEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CalendarSystem, LocaleCode } from '@nepdate/core';
import {
  Calendar,
  DatePicker,
  DateRangePicker,
  DateText,
  DateTimePicker,
} from '@nepdate/react';
import { runAxe } from './axe';

type Theme = 'light' | 'dark';

const HOLIDAYS = [
  { date: { calendar: 'BS', year: 2083, month: 6, day: 26 }, label: 'Dashain' },
  { date: { calendar: 'BS', year: 2083, month: 7, day: 22 }, label: 'Tihar' },
] as const;

function App(): ReactElement {
  const [locale, setLocale] = useState<LocaleCode>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [calendar, setCalendar] = useState<'switch' | CalendarSystem>('switch');
  const [controlled, setControlled] = useState('2026-10-10');
  const [submitted, setSubmitted] = useState('');
  const [range, setRange] = useState({ start: '', end: '' });
  const [startsAt, setStartsAt] = useState('');
  const [inlineValue, setInlineValue] = useState('');
  const [axe, setAxe] = useState<{ ok: boolean; text: string } | null>(null);
  const fixed = calendar === 'switch' ? undefined : calendar;

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
  };

  return (
    <div
      data-page-theme={theme}
      data-ndp-theme={theme}
      style={{ minHeight: '100vh', background: 'var(--page-bg)' }}
    >
      <header>
        <h1>@nepdate playground</h1>
        <nav>
          <a href="/index.html">React</a>
          <a href="/vanilla.html">Web Components</a>
          <a href="/script.html">&lt;script&gt; build</a>
          <a href="/styles.html">Styles</a>
        </nav>
        <div className="controls">
          <label>
            Locale
            <select
              value={locale}
              onChange={(event) => {
                setLocale(event.target.value);
              }}
            >
              <option value="en">English</option>
              <option value="ne">नेपाली</option>
            </select>
          </label>
          <label>
            Theme
            <select
              value={theme}
              onChange={(event) => {
                setTheme(event.target.value as Theme);
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Calendar
            <select
              value={calendar}
              onChange={(event) => {
                setCalendar(event.target.value as 'switch' | CalendarSystem);
              }}
            >
              <option value="switch">BS/AD switch</option>
              <option value="BS">BS only</option>
              <option value="AD">AD only</option>
            </select>
          </label>
          <button
            type="button"
            className="page-button"
            onClick={() => {
              void runAxe().then(setAxe);
            }}
          >
            Check accessibility
          </button>
          {axe && (
            <span className="a11y" data-ok={axe.ok} role="status">
              {axe.text}
            </span>
          )}
        </div>
      </header>
      <main>
        <section>
          <h2>Form field (uncontrolled)</h2>
          <p>Submits the AD value under its name.</p>
          <form onSubmit={submit}>
            <label className="label" htmlFor="dob">
              Date of birth
            </label>
            <DatePicker
              id="dob"
              name="dob"
              required
              locale={locale}
              theme={theme}
              calendar={fixed}
              max="2026-12-31"
              persistCalendar="playground-calendar"
              presets={['today', 'yesterday']}
            />
            <div className="row">
              <button className="page-button" type="submit">
                Submit
              </button>
              <button className="page-button" type="reset">
                Reset
              </button>
            </div>
          </form>
          <div className="value">form data: {submitted || '—'}</div>
        </section>

        <section>
          <h2>Controlled, with limits and holidays</h2>
          <p>Saturdays and holidays in red; 13th of every month disabled.</p>
          <label className="label" htmlFor="controlled">
            Appointment
          </label>
          <DatePicker
            id="controlled"
            value={controlled}
            onChange={setControlled}
            locale={locale}
            theme={theme}
            calendar={fixed}
            min="2026-09-01"
            max="2027-03-31"
            holidays={HOLIDAYS}
            isDateDisabled={(date) => date.day === 13}
          />
          <div className="value">value: {controlled || '""'}</div>
        </section>

        <section>
          <h2>Date range</h2>
          <p>Two clicks or a shortcut; fiscal years run from 1 Shrawan.</p>
          <DateRangePicker
            value={range}
            onChange={setRange}
            locale={locale}
            theme={theme}
            calendar={fixed}
            minDays={1}
            maxDays={400}
            presets={[
              'last7Days',
              'last30Days',
              'thisMonth',
              'lastMonth',
              'thisFiscalYear',
              'lastFiscalYear',
            ]}
            fiscalYearView
            startLabel="From"
            endLabel="To"
          />
          <div className="value">value: {JSON.stringify(range)}</div>
        </section>

        <section>
          <h2>Date and time</h2>
          <p>The value is one instant, with Nepal's +05:45 offset.</p>
          <DateTimePicker
            locale={locale}
            theme={theme}
            calendar={fixed}
            minuteStep={15}
            defaultTime="10:00"
            presets={['today', 'tomorrow']}
            onChange={setStartsAt}
            aria-label="Starts at"
          />
          <div className="value">value: {startsAt || '""'}</div>
        </section>

        <section>
          <h2>Inline</h2>
          <p>The calendar stays in the page; type or pick.</p>
          <DatePicker
            inline
            locale={locale}
            theme={theme}
            calendar={fixed}
            onChange={setInlineValue}
            aria-label="Inline date"
          />
          <div className="value">value: {inlineValue || '""'}</div>
        </section>

        <section>
          <h2>Calendar</h2>
          <p>Standalone, with event dots.</p>
          <Calendar
            locale={locale}
            theme={theme}
            calendar={fixed ?? 'BS'}
            holidays={HOLIDAYS}
            events={(date) => (date.day % 7 === 3 ? [{ color: '#16a34a' }] : [])}
          />
        </section>

        <section>
          <h2>Dates as text</h2>
          <p>Server-safe components.</p>
          <p>
            <DateText value="2026-09-26" locale={locale} />
          </p>
          <p>
            <DateText value="2026-10-18" calendar="AD" locale={locale} />
          </p>
        </section>
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  // Reuse the root when Vite hot-reloads this module.
  const holder = window as unknown as { __ndpRoot?: Root };
  holder.__ndpRoot ??= createRoot(container);
  holder.__ndpRoot.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
