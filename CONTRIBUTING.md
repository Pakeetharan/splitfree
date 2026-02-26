# Contributing to SplitFree

Thank you for your interest in contributing! This document outlines the process for reporting issues, suggesting features, and submitting pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Development Guidelines](#development-guidelines)
- [Commit Message Convention](#commit-message-convention)

---

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/Pakeetharan/splitfree.git
   cd splitfree
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required values (see the README for guidance).
5. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## How to Report a Bug

- Search [existing issues](https://github.com/Pakeetharan/splitfree/issues) before opening a new one.
- Use the **Bug Report** issue template.
- Include steps to reproduce, expected behaviour, actual behaviour, and environment details (OS, browser, Node version).

---

## How to Request a Feature

- Search [existing issues](https://github.com/Pakeetharan/splitfree/issues) first.
- Use the **Feature Request** issue template.
- Describe the problem you are trying to solve, not just the solution.

---

## Submitting a Pull Request

1. Make sure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Run the linter before pushing:
   ```bash
   npm run lint
   ```
3. Ensure the project builds without errors:
   ```bash
   npm run build
   ```
4. Push your branch and open a pull request against `main`.
5. Fill in the pull request template completely.
6. A maintainer will review your PR. Please be responsive to feedback.

---

## Development Guidelines

- **TypeScript** — all new code must be typed; avoid `any`.
- **Zod** — validate all external input (API request bodies, env vars) with Zod schemas in `src/lib/validators/`.
- **Monetary amounts** — store all amounts as **integer cents** (`number`). Never use floats for money.
- **Tailwind CSS** — use utility classes; avoid inline styles.
- **Components** — keep components small and focused. Put shared UI in `src/components/ui/`.
- **Server vs. client** — prefer React Server Components; add `"use client"` only when needed.
- **Offline** — changes that affect data flow must be reflected in the sync engine (`src/lib/offline/`).
- **Tests** — if you add business logic (especially in `src/lib/engine/`), add corresponding unit tests.

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no behaviour change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates |

**Examples:**

```
feat(groups): add currency selector to group form
fix(offline): prevent duplicate sync queue entries on reconnect
docs: update environment variable table in README
```

---

## Questions?

Open a [Discussion](https://github.com/Pakeetharan/splitfree/discussions) rather than an issue for general questions.
