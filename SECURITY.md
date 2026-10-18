# Security

## Supported versions

Security fixes go into the latest published minor version of each `@nepdate/*` package.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through GitHub's private vulnerability reporting: on the repository, open **Security → Report a vulnerability**.

Include the affected package and version, what an attacker could do, and steps to reproduce. You'll get an answer within 7 days. Once a fix is ready, we'll agree on a disclosure date with you and credit you if you'd like.

## Scope

The packages run in the user's browser or server and parse dates and text. Relevant reports include anything that lets crafted input:

- run code (for example, HTML injection through rendered labels);
- crash or hang a process;
- corrupt values a form submits.

Bugs in date conversion that aren't security issues belong in a normal issue.
