/**
 * Enforces the package rules in boundaries.json (docs/plan/01-architecture.md):
 * which @nepdate packages each package may import, which outside packages it may
 * use, that core/dom/styles depend on no package, and that Node built-ins are
 * only used under a package's src/node/ folder.
 *
 * Run: node scripts/check-boundaries.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export interface PackageRule {
  internal: string[];
  external: string[];
}

export interface Boundaries {
  packages: Record<string, PackageRule>;
  noPackageDependencies: string[];
}

export interface Violation {
  pkg: string;
  file: string;
  message: string;
}

const SCOPE = '@nepdate/';
const SOURCE_FILE = /\.(?:ts|tsx|mts|cts)$/;
const TEST_FILE = /\.test(?:-d)?\.tsx?$/;
const NODE_BUILTINS = new Set(builtinModules);

export function checkBoundaries(root: string): Violation[] {
  const boundaries = JSON.parse(
    readFileSync(join(root, 'boundaries.json'), 'utf8'),
  ) as Boundaries;
  const packagesDir = join(root, 'packages');
  const violations: Violation[] = [];

  for (const name of readdirSync(packagesDir).sort()) {
    const pkgDir = join(packagesDir, name);
    const manifestPath = join(pkgDir, 'package.json');
    if (!statSync(pkgDir).isDirectory() || !existsSync(manifestPath)) {
      continue;
    }
    const report = (file: string, message: string): void => {
      violations.push({ pkg: name, file: relative(root, file), message });
    };
    const rule = boundaries.packages[name];
    if (!rule) {
      report(manifestPath, `packages/${name} is not listed in boundaries.json.`);
      continue;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<
      string,
      unknown
    >;
    const declared = new Set<string>();
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      const deps = manifest[field];
      if (deps && typeof deps === 'object') {
        for (const dep of Object.keys(deps)) {
          declared.add(dep);
        }
      }
    }

    if (boundaries.noPackageDependencies.includes(name) && declared.size > 0) {
      report(
        manifestPath,
        `@nepdate/${name} must not depend on any package, but lists: ${[...declared].join(', ')}.`,
      );
    }
    for (const dep of declared) {
      if (!isAllowed(dep, rule)) {
        report(manifestPath, `@nepdate/${name} may not depend on ${dep}.`);
      }
    }

    const srcDir = join(pkgDir, 'src');
    for (const file of sourceFiles(srcDir)) {
      const inNodeFolder = file.startsWith(join(srcDir, 'node') + sep);
      const { importedFiles } = ts.preProcessFile(readFileSync(file, 'utf8'), true, true);

      for (const { fileName: specifier } of importedFiles) {
        if (specifier.startsWith('.')) {
          const target = resolve(dirname(file), specifier);
          if (!target.startsWith(srcDir + sep) && target !== srcDir) {
            report(file, `relative import "${specifier}" leaves packages/${name}/src.`);
          }
          continue;
        }
        if (specifier.startsWith('node:') || NODE_BUILTINS.has(specifier)) {
          if (!inNodeFolder) {
            report(
              file,
              `Node built-in "${specifier}" is only allowed under src/node/ (the package must also run in browsers).`,
            );
          }
          continue;
        }
        const pkg = packageName(specifier);
        if (!isAllowed(pkg, rule)) {
          report(file, `@nepdate/${name} may not import "${specifier}".`);
        } else if (!declared.has(pkg) && pkg !== `${SCOPE}${name}`) {
          report(file, `"${specifier}" is imported but ${pkg} is not in package.json.`);
        }
      }
    }
  }

  return violations;
}

function isAllowed(pkg: string, rule: PackageRule): boolean {
  if (pkg.startsWith(SCOPE)) {
    return rule.internal.includes(pkg.slice(SCOPE.length));
  }

  return rule.external.includes(pkg);
}

/** "@scope/name/sub" → "@scope/name", "name/sub" → "name". */
function packageName(specifier: string): string {
  const parts = specifier.split('/');

  return specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : (parts[0] ?? specifier);
}

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((entry) => join(dir, entry))
    .filter((file) => SOURCE_FILE.test(file) && !TEST_FILE.test(file))
    .sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const violations = checkBoundaries(root);
  for (const v of violations) {
    console.error(`✖ [${v.pkg}] ${v.file}: ${v.message}`);
  }
  if (violations.length > 0) {
    console.error(`\n${violations.length} boundary violation(s). See boundaries.json.`);
    process.exit(1);
  }
  console.log('✔ Package boundaries OK');
}
