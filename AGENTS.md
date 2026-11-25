# AGENTS.md

Typed, dependency-free client for the Sejm schedule API (`api.sejm.gov.pl`). Public surface is `index.ts`; the code is in `src/`, imported through the `@sejm/*` alias.

## Commands

- `npm ci` — install
- `npm test` — vitest (sets `TZ=UTC`; run it through npm, not bare `vitest`)
- `npm run typecheck`, `npm run lint`, `npm run format:check`
- `npm run build` — tsdown to `dist/` (ESM only, Node >= 24)

Run test, typecheck, lint and format:check before finishing.

## Conventions

- No runtime dependencies. Keep it that way.
- Commits follow Conventional Commits (commitlint enforces it); `npm run commit` is the guided prompt. Releases are cut with release-it — do not bump versions by hand. `npm run release:prepare` opens the version PR; after it merges, `npm run release` tags and creates the GitHub release; pushing the tag triggers `.github/workflows/publish.yml`, which publishes to npm with provenance via trusted publishing (never publish from a laptop).
- Parsers never throw on bad records: they return `{ items, invalid }`. A new field must be read defensively in `read()` and covered in `test/parse.test.ts`.
- Network goes through the injectable `getJson`; tests use fakes (see `test/helpers.ts`), never the live API.
- Only `/** */` doc comments are allowed (in `src/`); other comments are banned by lint. Anything exported from `index.ts` needs one, and README.md and llms.txt must be updated in the same change.
- API shapes come from the OpenAPI description at `https://api.sejm.gov.pl/sejm/openapi/`.
