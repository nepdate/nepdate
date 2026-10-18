/** Tiny DOM builders. Text goes through textContent; nothing user-supplied becomes HTML. */

type Attrs = Record<string, string | number | boolean | null | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  setAttrs(node, attrs);
  node.append(...children);

  return node;
}

/** Set, update or remove attributes: false/null/undefined removes, true sets "". */
export function setAttrs(node: Element, attrs: Attrs): void {
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) {
      node.removeAttribute(name);
    } else {
      const text = value === true ? '' : String(value);
      if (node.getAttribute(name) !== text) {
        node.setAttribute(name, text);
      }
    }
  }
}

export function setText(node: Node, text: string): void {
  if (node.textContent !== text) {
    node.textContent = text;
  }
}

let counter = 0;
/** A document-unique id for aria-controls / aria-describedby. */
export function uid(prefix: string): string {
  counter += 1;

  return `${prefix}-${counter}`;
}

const SVG = 'http://www.w3.org/2000/svg';
const PATHS: Record<IconName, string[]> = {
  'chevron-left': ['M10 3.5 5.5 8l4.5 4.5'],
  'chevron-right': ['M6 3.5 10.5 8 6 12.5'],
  calendar: [
    'M2 6.5h12',
    'M5.5 1.5v3',
    'M10.5 1.5v3',
    'M4 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
  ],
  close: ['M4 4l8 8', 'M12 4l-8 8'],
};

export type IconName = 'chevron-left' | 'chevron-right' | 'calendar' | 'close';

/** The Figma icon set at 16px, drawn with currentColor. */
export function icon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of PATHS[name]) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }

  return svg;
}
