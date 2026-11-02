/**
 * Keeps the documentation honest. Run `pnpm build` first.
 *
 * For every code fence in apps/docs:
 *   - ts/tsx: type-checks it against the packages. Names exported by a package
 *     need no import in the sample; they are added here.
 *   - ts: runs it when it has `expression; // → value` lines, and compares the
 *     real result with the value. `// → throws CODE` expects that error code.
 *   - js/ts/tsx: every name imported from @nepdate must really be exported.
 *   - html/vue/svelte/blade: every attribute on a <nep-*> element must exist.
 *
 * Also, every name a package exports must appear on its reference page.
 *
 * Put <!-- no-check --> on the line before a fence to skip it (for fragments
 * that cannot stand alone).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'apps/docs');
const scratch = join(docs, '.check');

/** Import path → file under packages/. Earlier modules win when two export a name. */
const MODULES: Record<string, string> = {
  '@nepdate/core': 'core/dist/index.js',
  '@nepdate/calendar': 'calendar/dist/index.js',
  '@nepdate/datepicker': 'datepicker/dist/index.js',
  '@nepdate/holidays': 'holidays/dist/index.js',
  '@nepdate/react': 'react/dist/index.js',
  '@nepdate/react/headless': 'react/dist/headless.js',
  '@nepdate/react/server': 'react/dist/server.js',
  '@nepdate/dom': 'dom/dist/index.js',
  '@nepdate/core/data': 'core/dist/data.js',
  '@nepdate/vanilla': 'vanilla/dist/index.js',
  '@nepdate/vanilla/define': 'vanilla/dist/auto-define.js',
  '@nepdate/vanilla/date-picker': 'vanilla/dist/date-picker.js',
  '@nepdate/vanilla/calendar': 'vanilla/dist/calendar.js',
  '@nepdate/vanilla/date-range-picker': 'vanilla/dist/date-range-picker.js',
  '@nepdate/vanilla/date-time-picker': 'vanilla/dist/date-time-picker.js',
  '@nepdate/vanilla/multi-date-picker': 'vanilla/dist/multi-date-picker.js',
};
/** Modules whose names a sample may use without importing them. */
const AUTO_IMPORT = [
  '@nepdate/core',
  '@nepdate/calendar',
  '@nepdate/datepicker',
  '@nepdate/holidays',
];
const AUTO_IMPORT_TSX = ['@nepdate/react'];

/** Attributes any element may have. */
const GLOBAL_ATTRIBUTES = new Set(['id', 'class', 'style', 'hidden', 'slot', 'title']);

const fileUrl = (path: string): string =>
  pathToFileURL(join(root, 'packages', path)).href;

interface Fence {
  readonly page: string;
  readonly line: number;
  readonly language: string;
  readonly code: string;
}

const failures: string[] = [];

function fail(where: string, message: string): void {
  failures.push(`${where}: ${message}`);
}

function markdownFiles(): string[] {
  return readdirSync(docs, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.md'))
    .filter((file) => !/(^|\/)(node_modules|\.vitepress|\.check)\//.test(file))
    .sort();
}

function fencesOf(page: string): Fence[] {
  const lines = readFileSync(join(docs, page), 'utf8').split('\n');
  const fences: Fence[] = [];
  for (let index = 0; index < lines.length; index++) {
    const open = /^\s*```(\w+)/.exec(lines[index] ?? '');
    if (!open) {
      continue;
    }
    const skip = (lines[index - 1] ?? '').trim() === '<!-- no-check -->';
    const start = index + 1;
    index++;
    while (index < lines.length && !/^\s*```\s*$/.test(lines[index] ?? '')) {
      index++;
    }
    if (!skip) {
      fences.push({
        page,
        line: start + 1,
        language: open[1] ?? '',
        code: lines.slice(start, index).join('\n'),
      });
    }
  }

  return fences;
}

/** Every name each module exports at run time. */
async function loadExports(): Promise<Map<string, Set<string>>> {
  const exportsOf = new Map<string, Set<string>>();
  for (const [name, file] of Object.entries(MODULES)) {
    const loaded = (await import(fileUrl(file))) as Record<string, unknown>;
    exportsOf.set(name, new Set(Object.keys(loaded)));
  }

  return exportsOf;
}

function importedNames(code: string): { from: string; names: string[] }[] {
  const found: { from: string; names: string[] }[] = [];
  for (const match of code.matchAll(/import\s+\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
    found.push({
      from: match[2] ?? '',
      names: (match[1] ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name !== '')
        .filter((name) => !name.startsWith('type ')),
    });
  }

  return found;
}

function checkImports(fence: Fence, exportsOf: Map<string, Set<string>>): void {
  const where = `${fence.page}:${fence.line}`;
  for (const { from, names } of importedNames(fence.code)) {
    if (!from.startsWith('@nepdate/')) {
      continue;
    }
    const known = exportsOf.get(from);
    if (!known) {
      fail(where, `no such entry: ${from}`);
      continue;
    }
    for (const name of names) {
      const imported = name.split(/\s+as\s+/)[0] ?? name;
      // Capitalised names may be types, which only the type-check can see.
      if (!known.has(imported) && !/^[A-Z]/.test(imported)) {
        fail(where, `${from} does not export ${imported}`);
      }
    }
  }
}

function checkElements(fence: Fence, attributes: Map<string, ReadonlySet<string>>): void {
  const where = `${fence.page}:${fence.line}`;
  for (const match of fence.code.matchAll(/<(nep-[a-z-]+)([^<>]*)>/g)) {
    const tag = match[1] ?? '';
    const known = attributes.get(tag);
    if (!known) {
      fail(where, `no such element: <${tag}>`);
      continue;
    }
    const body = (match[2] ?? '')
      .replace(/(["'])[\s\S]*?\1/g, '""')
      .replace(/\{[^}]*\}/g, '""');
    for (const found of body.matchAll(/([^\s=/]+)/g)) {
      const raw = found[1] ?? '';
      const name = raw.replace(/^(?::|v-bind:)/, '');
      if (
        !isFrameworkBinding(raw) &&
        /^[a-z][a-z0-9-]*$/.test(name) &&
        !known.has(name) &&
        !GLOBAL_ATTRIBUTES.has(name) &&
        !/^(data|aria)-/.test(name)
      ) {
        fail(where, `<${tag}> has no attribute "${name}"`);
      }
    }
  }
}

/** Event listeners and property bindings, which are not attributes. */
function isFrameworkBinding(name: string): boolean {
  return /^(@|on:|on[a-z]+$|bind:|\[|\(|ref$|#)/.test(name);
}

function prelude(fence: Fence, exportsOf: Map<string, Set<string>>): string {
  const imported = new Set(
    importedNames(fence.code).flatMap(({ names }) =>
      names.map((name) => name.split(/\s+as\s+/).pop() ?? name),
    ),
  );
  const declared = new Set(
    [...fence.code.matchAll(/\b(?:const|let|function|class)\s+(\w+)/g)].map(
      (match) => match[1] ?? '',
    ),
  );
  const used = new Set(fence.code.match(/[A-Za-z_$][\w$]*/g));
  const sources =
    fence.language === 'tsx' ? [...AUTO_IMPORT_TSX, ...AUTO_IMPORT] : AUTO_IMPORT;
  const taken = new Set<string>();
  const lines: string[] = [];
  for (const source of sources) {
    const names = [...(exportsOf.get(source) ?? [])].filter(
      (name) =>
        used.has(name) && !imported.has(name) && !declared.has(name) && !taken.has(name),
    );
    for (const name of names) {
      taken.add(name);
    }
    if (names.length > 0) {
      lines.push(`import { ${names.join(', ')} } from '${source}';`);
    }
  }
  if (
    fence.language === 'tsx' &&
    !imported.has('useState') &&
    !declared.has('useState') &&
    used.has('useState')
  ) {
    lines.push(`import { useState } from 'react';`);
  }

  return lines.join('\n');
}

function typeCheck(fences: readonly Fence[], exportsOf: Map<string, Set<string>>): void {
  const sources = new Map<string, { fence: Fence; offset: number }>();
  fences.forEach((fence, index) => {
    const head = prelude(fence, exportsOf);
    const name = `sample-${index}.${fence.language}`;
    const offset = head === '' ? 0 : head.split('\n').length;
    writeFileSync(
      join(scratch, name),
      `${head === '' ? '' : `${head}\n`}${fence.code}\nexport {};\n`,
    );
    sources.set(name, { fence, offset });
  });
  writeFileSync(
    join(scratch, 'ambient.d.ts'),
    `/** App code the samples call but do not define. */
declare function save(value: unknown): void;
declare function render(state: unknown): void;
`,
  );
  writeFileSync(
    join(scratch, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        customConditions: ['@nepdate/source'],
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        noUncheckedSideEffectImports: false,
        types: [],
      },
      include: ['./*.ts', './*.tsx'],
    }),
  );
  let output = '';
  try {
    execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', scratch], {
      cwd: scratch,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    output = (error as { stdout?: string }).stdout ?? String(error);
  }
  for (const line of output.split('\n')) {
    const match = /(sample-\d+\.tsx?)\((\d+),\d+\): (.*)$/.exec(line);
    const source = match ? sources.get(match[1] ?? '') : undefined;
    if (match && source) {
      const at = source.fence.line + Number(match[2]) - 1 - source.offset;
      fail(`${source.fence.page}:${at}`, match[3] ?? '');
    } else if (line.includes('error TS')) {
      fail('type-check', line);
    }
  }
}

/** A sample with its `// → value` lines turned into checks, as a runnable module. */
function runnable(fence: Fence, exportsOf: Map<string, Set<string>>): string {
  const out = fence.code.split('\n').map((line, index) => {
    const match = /^(\s*)(.*?);?\s*\/\/ → (.+)$/.exec(line);
    if (!match) {
      return line;
    }
    const [, indent = '', statement = '', expected = ''] = match;
    const at = JSON.stringify(`${fence.page}:${fence.line + index}`);
    const declaration = /^(?:const|let)\s+(\w+)\s*(?::[^=]+)?=/.exec(statement);
    const thrown = /^throws (\w+)$/.exec(expected);
    if (thrown) {
      return `${indent}__throws(() => (${statement}), ${JSON.stringify(thrown[1])}, ${at});`;
    }

    return declaration
      ? `${indent}${statement}; __equal(${declaration[1] ?? ''}, ${expected}, ${at});`
      : `${indent}__equal(${statement}, ${expected}, ${at});`;
  });
  const source = `${prelude(fence, exportsOf)}\n${out.join('\n')}\nexport {};\n`;
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      verbatimModuleSyntax: false,
    },
  });

  return outputText.replace(/from '(@nepdate\/[^']+)'/g, (whole, name: string) => {
    const file = MODULES[name];
    return file ? `from '${fileUrl(file)}'` : whole;
  });
}

async function runSamples(
  fences: readonly Fence[],
  exportsOf: Map<string, Set<string>>,
): Promise<number> {
  const core = (await import(fileUrl(MODULES['@nepdate/core'] ?? ''))) as {
    resetConfig(): void;
    resetBsData(): void;
  };
  const holidays = (await import(fileUrl(MODULES['@nepdate/holidays'] ?? ''))) as {
    clearHolidays(): void;
  };
  const scope = globalThis as unknown as Record<string, unknown>;
  let checked = 0;
  scope['__equal'] = (actual: unknown, expected: unknown, at: string): void => {
    checked++;
    if (!isDeepStrictEqual(actual, expected)) {
      fail(at, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  };
  scope['__throws'] = (run: () => unknown, code: string, at: string): void => {
    checked++;
    try {
      run();
      fail(at, `expected it to throw ${code}`);
    } catch (error) {
      if ((error as { code?: string }).code !== code) {
        fail(at, `expected ${code}, got ${String(error)}`);
      }
    }
  };
  const log = console.log;
  console.log = () => undefined; // samples may log; keep the report readable
  let index = 0;
  for (const fence of fences) {
    const file = join(scratch, `run-${index++}.mjs`);
    writeFileSync(file, runnable(fence, exportsOf));
    try {
      await import(pathToFileURL(file).href);
    } catch (error) {
      fail(`${fence.page}:${fence.line}`, `sample failed: ${String(error)}`);
    }
    core.resetConfig();
    core.resetBsData();
    holidays.clearHolidays();
  }
  console.log = log;

  return checked;
}

/** Every public export has to be documented. */
function checkReference(exportsOf: Map<string, Set<string>>): void {
  const pages: Record<string, readonly string[]> = {
    core: ['@nepdate/core'],
    calendar: ['@nepdate/calendar'],
    datepicker: ['@nepdate/datepicker'],
    holidays: ['@nepdate/holidays'],
    dom: ['@nepdate/dom'],
    react: ['@nepdate/react', '@nepdate/react/headless', '@nepdate/react/server'],
    vanilla: ['@nepdate/vanilla'],
  };
  for (const [page, modules] of Object.entries(pages)) {
    const text = readFileSync(join(docs, 'reference', `${page}.md`), 'utf8');
    for (const name of modules.flatMap((module) => [...(exportsOf.get(module) ?? [])])) {
      if (!new RegExp(`\\b${name}\\b`).test(text)) {
        fail(`reference/${page}.md`, `does not mention ${name}`);
      }
    }
  }
}

async function elementAttributes(): Promise<Map<string, ReadonlySet<string>>> {
  const vanilla = (await import(fileUrl(MODULES['@nepdate/vanilla'] ?? ''))) as Record<
    string,
    { observedAttributes?: readonly string[] }
  >;
  const tags: Record<string, string> = {
    'nep-date-picker': 'NepDatePickerElement',
    'nep-calendar': 'NepCalendarElement',
    'nep-date-range-picker': 'NepDateRangePickerElement',
    'nep-date-time-picker': 'NepDateTimePickerElement',
    'nep-multi-date-picker': 'NepMultiDatePickerElement',
  };
  const out = new Map<string, ReadonlySet<string>>();
  for (const [tag, name] of Object.entries(tags)) {
    out.set(tag, new Set(vanilla[name]?.observedAttributes ?? []));
  }

  return out;
}

rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

const fences = markdownFiles().flatMap(fencesOf);
const exportsOf = await loadExports();
const attributes = await elementAttributes();

for (const fence of fences) {
  checkImports(fence, exportsOf);
  checkElements(fence, attributes);
}
checkReference(exportsOf);
const typed = fences.filter(({ language }) => language === 'ts' || language === 'tsx');
typeCheck(typed, exportsOf);
const toRun = typed.filter(({ code }) => code.includes('// → '));
const checked = await runSamples(toRun, exportsOf);

rmSync(scratch, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(failures.map((failure) => `✖ ${failure}`).join('\n'));
  console.error(`\n${failures.length} problem(s) in ${relative(root, docs)}`);
  process.exit(1);
}
console.log(
  `✔ docs: ${fences.length} code samples, ${typed.length} type-checked, ${checked} results compared`,
);
