# Releasing

Packages are published by GitHub Actions with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers). There is no npm token in the repository, so there is no key to leak or rotate. Each published version gets a signed provenance statement that links it to the commit that built it.

## First release

Do this once. Steps 1 to 3 need your npm account, so they can't be automated. Keep steps 3 to 5 together: npm drops a new trusted publisher that hasn't published within **2 days**.

### 1. Prepare your npm account

- [ ] Sign in at [npmjs.com](https://www.npmjs.com/), or create an account.
- [ ] Turn on two-factor authentication, using a security key or passkey if you can.
- [ ] [Create an organization](https://www.npmjs.com/org/create) named `nepdate`, with the free plan for public packages.

### 2. Set up GitHub and log in to npm

Let Actions open the version pull request, and create the `npm` environment, limited to `main`, that the publish job runs in:

```bash
gh api -X PUT repos/nepdate/nepdate/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
```

```bash
echo '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}' | gh api -X PUT repos/nepdate/nepdate/environments/npm --input -
```

```bash
gh api -X POST repos/nepdate/nepdate/environments/npm/deployment-branch-policies -f name=main -f type=branch
```

Then log in to npm:

```bash
npm login
```

You need npm 11.15 or newer. Check with `npm --version`.

### 3. Create the packages and trust the workflow

npm can only trust a workflow for a package that already exists, so this publishes an empty, deprecated `0.0.0-bootstrap` placeholder for each package, then trusts `release.yml`. It's the only publish from your computer. npm asks for two-factor approval; choose the option to skip it for 5 minutes so that it doesn't ask for every package.

```bash
pnpm npm:bootstrap --dry-run
pnpm npm:bootstrap
```

Each package now trusts:

| Field       | Value             |
| ----------- | ----------------- |
| Publisher   | GitHub Actions    |
| Repository  | `nepdate/nepdate` |
| Workflow    | `release.yml`     |
| Environment | `npm`             |

If the script stops, fix the problem and run it again. It skips what's already done.

### 4. Turn on the workflow

```bash
gh variable set NPM_PUBLISH_ENABLED --body true
gh workflow run release.yml
```

The workflow opens a pull request titled **chore: version packages**, which sets every package to 0.1.0.

### 5. Publish

- [ ] Review and merge the version pull request.
- [ ] Watch the **Release** workflow. It runs `pnpm verify`, packs the packages and publishes them.

### 6. Check the result

- [ ] Each package on [npm](https://www.npmjs.com/org/nepdate) shows 0.1.0 and a provenance badge.
- [ ] A fresh project can install and use them: `npm install @nepdate/react @nepdate/styles`
- [ ] The script build loads: `https://unpkg.com/@nepdate/vanilla/dist/nepdate-picker.global.js`
- [ ] Remove the "Not on npm yet" warning from `apps/docs/guide/installation.md`, and the "not yet released" note from `apps/docs/guide/release-notes.md`.

### 7. Lock it down

For each package on npm, open **Settings → Publishing access** and choose **Require two-factor authentication and disallow tokens**. Trusted publishing keeps working, and nothing else can publish.

## Every later release

1. Add a changeset to each pull request that changes a package: `pnpm changeset`.
2. After merging, the workflow opens or updates the version pull request.
3. Merge it when you're ready. The workflow publishes everything that changed.

## Versioning

While the version is `0.x`:

- A breaking change bumps the **minor** version, and its changeset must say so and explain what to change.
- Everything else bumps the **patch** version.

Exports, type names, `ndp-*` class names, custom element names, attributes and events, and `--ndp-*` CSS variables are all public API. All `@nepdate/*` packages are linked, so they move to the same version together when they change.

## When publishing fails

| Problem                                                   | Likely cause                                                                                                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `404` or `ENEEDAUTH` when publishing                      | The trusted publisher doesn't match. Repository, workflow file and environment must match exactly, and are case-sensitive. Check with `npm trust list @nepdate/core`. |
| It worked in setup, but fails days later on the first run | The trust expired after 2 days without a publish. Revoke it with `npm trust revoke`, then run `pnpm npm:bootstrap` again.                                             |
| No version pull request appears                           | `NPM_PUBLISH_ENABLED` isn't `true`, or **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** is off.                            |
| The version pull request has no CI checks                 | Normal. GitHub doesn't run workflows for pull requests opened by Actions. The Release workflow runs `pnpm verify` before publishing.                                  |
| One package published but the rest failed                 | Re-run the workflow. It skips versions that are already on npm.                                                                                                       |
