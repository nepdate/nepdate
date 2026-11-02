/**
 * One-time setup for publishing without a token (see RELEASING.md).
 *
 * npm can only trust a workflow for a package that already exists, so a new
 * package needs one publish by hand. For each package this publishes an empty,
 * deprecated placeholder, then trusts .github/workflows/release.yml to publish
 * the real versions. It is safe to run again: finished steps are skipped.
 *
 *   npm login
 *   pnpm npm:bootstrap --dry-run   show what would happen
 *   pnpm npm:bootstrap             do it
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'nepdate/nepdate';
const WORKFLOW = 'release.yml';
const ENVIRONMENT = 'npm';
const PLACEHOLDER = '0.0.0-bootstrap';
/** `npm trust` needs this version or later. */
const MIN_NPM = [11, 15];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

function capture(args: string[]): string | null {
  const result = spawnSync('npm', args, { encoding: 'utf8' });

  return result.status === 0 ? result.stdout.trim() : null;
}

/** Runs in the terminal, so npm can ask for two-factor approval. */
function run(args: string[], cwd = root): void {
  execFileSync('npm', args, { cwd, stdio: 'inherit' });
}

function publishPlaceholder(name: string): void {
  const dir = mkdtempSync(join(tmpdir(), 'nepdate-bootstrap-'));
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name,
        version: PLACEHOLDER,
        description: 'Placeholder. Install the latest version instead.',
        license: 'MIT',
        repository: { type: 'git', url: `git+https://github.com/${REPOSITORY}.git` },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, 'README.md'),
    `# ${name}\n\nThis placeholder version only reserves the name. Install the latest version.\n`,
  );
  try {
    run(
      [
        'publish',
        '--access',
        'public',
        '--tag',
        'bootstrap',
        ...(dryRun ? ['--dry-run'] : []),
      ],
      dir,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function packageNames(): string[] {
  return readdirSync(join(root, 'packages'))
    .map(
      (dir) =>
        JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8')) as {
          name: string;
          private?: boolean;
        },
    )
    .filter((manifest) => !manifest.private)
    .map((manifest) => manifest.name)
    .sort();
}

const [major = 0, minor = 0] = (capture(['--version']) ?? '').split('.').map(Number);
if (major < (MIN_NPM[0] ?? 0) || (major === MIN_NPM[0] && minor < (MIN_NPM[1] ?? 0))) {
  throw new Error(`npm ${MIN_NPM.join('.')} or newer is needed, not ${major}.${minor}.`);
}
const user = capture(['whoami']);
if (!user && !dryRun) {
  throw new Error('Not logged in. Run `npm login` first.');
}
console.log(`${dryRun ? 'Dry run' : 'Publishing'} as ${user ?? '(not logged in)'}\n`);

for (const name of packageNames()) {
  if (capture(['view', name, 'name'])) {
    console.log(`✔ ${name} exists`);
  } else {
    console.log(`→ ${name}: publishing the placeholder`);
    publishPlaceholder(name);
    if (!dryRun) {
      run([
        'deprecate',
        `${name}@${PLACEHOLDER}`,
        'Placeholder only. Install the latest version.',
      ]);
    }
  }
  if (dryRun) {
    console.log(`  would trust ${REPOSITORY} ${WORKFLOW} (environment ${ENVIRONMENT})`);
  } else if (capture(['trust', 'list', name])?.includes(WORKFLOW)) {
    console.log(`✔ ${name} already trusts ${WORKFLOW}`);
  } else {
    run([
      'trust',
      'github',
      name,
      '--repo',
      REPOSITORY,
      '--file',
      WORKFLOW,
      '--env',
      ENVIRONMENT,
      '--allow-publish',
      '--yes',
    ]);
    // npm asks for a pause between trust calls, to stay under its rate limit.
    await new Promise((done) => setTimeout(done, 2000));
  }
}

console.log('\nDone. Next: step 4 of RELEASING.md. Finish the release within 2 days.');
