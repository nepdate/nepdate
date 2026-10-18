import '@nepdate/styles/index.css';
import './playground.css';
import '@nepdate/vanilla/define';
import { runAxe } from './axe';

const form = document.querySelector<HTMLFormElement>('#form');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const out = document.querySelector('#out');
  if (out) {
    out.textContent = `form data: ${JSON.stringify(Object.fromEntries(new FormData(form)))}`;
  }
});
document.querySelector('nep-date-range-picker')?.addEventListener('change', (event) => {
  const out = document.querySelector('#range-out');
  if (out) {
    out.textContent = JSON.stringify((event as CustomEvent).detail);
  }
});
document.querySelector('#cal')?.addEventListener('nep-select', (event) => {
  const out = document.querySelector('#cal-out');
  if (out) {
    out.textContent = JSON.stringify(
      (event as CustomEvent<{ value: string }>).detail.value,
    );
  }
});
document.querySelector('#axe')?.addEventListener('click', () => {
  void runAxe().then(({ ok, text }) => {
    const result = document.querySelector<HTMLElement>('#axe-result');
    if (result) {
      result.dataset['ok'] = String(ok);
      result.textContent = text;
    }
  });
});
