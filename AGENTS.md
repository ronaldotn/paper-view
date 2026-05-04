# AGENTS.md - paper-view

## Project Overview
JavaScript library for paged media viewing (fork of paged.js). Supports browser, Angular, and Vue.

## Commands

```bash
npm run build     # Build UMD, ESM, and polyfill bundles (dist/)
npm test          # Run unit tests (tests/)
npm run specs     # Run integration tests with puppeteer (specs/)
npm run lint      # Run ESLint
```

## Project Structure

```
src/
├── index.js              # Main entry point
├── paperview.js          # Core PaperView class
├── modules/              # Core modules (paged-media, generated-content)
├── polisher/             # CSS parsing and processing (uses css-tree)
├── utils/                # Utilities
├── polyfill/             # Polyfills
└── chunker/              # Content chunking components

tests/                   # Unit tests (Jest)
specs/                  # Integration tests with puppeteer
examples/               # Angular and Vue example projects
dist/                   # Built bundles (UMD, ESM, polyfill)
```

## Build Configuration

- **Rollup 4** with Babel 7
- Outputs: UMD (`dist/paperview.js`), ESM (`dist/paperview.esm.js`), Polyfill (`dist/paperview.polyfill.js`)
- Uses `@rollup/plugin-babel`, `@rollup/plugin-commonjs`, `@rollup/plugin-node-resolve`, `@rollup/plugin-terser`, `@rollup/plugin-json`
- Babel config: `@babel/preset-env` with `core-js@3` polyfills

## Dependencies

- **css-tree**: v2+ (import as `import * as csstree from "css-tree"`)
- **core-js**: v3 (updated from v2)
- **@babel/runtime**: v7.26+
- **puppeteer**: v24+ (for integration tests)

## Testing

- **tests/**: Unit tests - Jest 29, pattern `**/?(*.)(test).js?(x)`
- **specs/**: Integration tests - Jest with puppeteer environment for image snapshots

## Linting

- ESLint 8 with `eslint:recommended` + `security` plugin
- Tab indentation, double quotes
- Security rules enforced in CI

## CI/CD

- GitHub Actions workflow (`.github/workflows/security.yml`)
- Runs on: push to main/develop, weekly schedule
- Checks: npm audit, ESLint, semgrep, gitleaks, snyk

## Important Notes

- This is a JavaScript library, not a monorepo
- Main source entry: `src/index.js`
- Windows compatible: scripts use `npx` style (no `./node_modules/.bin/` prefix)
- css-tree v2+ requires namespace import: `import * as csstree from "css-tree"`

## Security

- All dependencies updated to fix vulnerabilities (0 vulnerabilities as of latest audit)
- Removed deprecated packages: `@babel/polyfill`, `rollup-plugin-babel-minify`
- Replaced deprecated Rollup plugins with `@rollup/*` official plugins
