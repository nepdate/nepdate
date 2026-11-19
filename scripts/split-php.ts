/**
 * Publishes php/ to github.com/nepdate/nepdate-php, the read-only repository
 * Packagist installs `nepdatejs/nepdate` from, and tags it with core's version.
 *
 * `git subtree split` turns the history of php/ into a branch whose root is
 * php/, so the split repository holds only the PHP package. The split is
 * deterministic: the same monorepo commit always gives the same split commit,
 * so pushing it again is a no-op.
 *
 * Run after the Release workflow has published @nepdatejs/core@<version>:
 *   node scripts/split-php.ts 0.1.2               split the core release tag
 *   node scripts/split-php.ts 0.1.1 --from main   split another commit
 *   node scripts/split-php.ts 0.1.2 --dry-run     show what would be pushed
 */
import { execFileSync } from 'node:child_process';

const REMOTE = 'git@github.com:nepdate/nepdate-php.git';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fromIndex = args.indexOf('--from');
const version = args.find((arg, i) => !arg.startsWith('--') && i !== fromIndex + 1);

if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error('Usage: node scripts/split-php.ts <version> [--from <ref>] [--dry-run]');
  process.exit(1);
}

const from = fromIndex >= 0 ? args[fromIndex + 1] : `@nepdatejs/core@${version}`;
if (!from) {
  console.error('--from needs a git ref.');
  process.exit(1);
}

function git(...gitArgs: string[]): string {
  return execFileSync('git', gitArgs, { encoding: 'utf8' }).trim();
}

const tag = `v${version}`;
git('fetch', '--quiet', '--tags', 'origin');
const source = git('rev-parse', '--verify', `${from}^{commit}`);
const composer = JSON.parse(git('show', `${source}:php/composer.json`)) as {
  name?: string;
};
if (composer.name !== 'nepdatejs/nepdate') {
  console.error(`✖ ${from} has no php/composer.json for nepdatejs/nepdate.`);
  process.exit(1);
}
const coreVersion = (
  JSON.parse(git('show', `${source}:packages/core/package.json`)) as { version: string }
).version;
if (coreVersion !== version) {
  console.error(`✖ ${from} has @nepdatejs/core ${coreVersion}, not ${version}.`);
  process.exit(1);
}

const split = git('subtree', 'split', '--prefix=php', source);
console.log(`php/ at ${source.slice(0, 7)} (${from}) splits to ${split.slice(0, 7)}`);

if (dryRun) {
  console.log(`Would push ${split.slice(0, 7)} to ${REMOTE} main and tag it ${tag}.`);
  process.exit(0);
}

execFileSync('git', ['push', REMOTE, `${split}:refs/heads/main`], { stdio: 'inherit' });
execFileSync(
  'git',
  ['tag', '--sign', '--force', '-m', `nepdatejs/nepdate ${version}`, `php-${tag}`, split],
  { stdio: 'inherit' },
);
execFileSync('git', ['push', REMOTE, `refs/tags/php-${tag}:refs/tags/${tag}`], {
  stdio: 'inherit',
});
console.log(
  `✔ Pushed ${tag} to nepdate-php. Packagist picks it up from the GitHub hook, or press Update on https://packagist.org/packages/nepdatejs/nepdate.`,
);
