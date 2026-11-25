# sejm-schedule-api

[![NPM Version](https://img.shields.io/npm/v/sejm-schedule-api)](https://www.npmjs.com/package/sejm-schedule-api)
[![Build status](https://ci.appveyor.com/api/projects/status/r4alm64d2sk167g4/branch/main?svg=true)](https://ci.appveyor.com/project/lwojcik/sejm-schedule-api/branch/main)
[![codecov](https://codecov.io/github/lwojcik/sejm-schedule-api/graph/badge.svg?token=Oox8MLfp8G)](https://codecov.io/github/lwojcik/sejm-schedule-api)

A typed client for the schedule of the Polish Sejm (`api.sejm.gov.pl`): the plenary sittings, the committees and the committee sittings of a day. It reads what the API answers, checks it, and leaves out the records that make no sense. It has no dependencies and runs on Node 24 or newer.

It covers the schedule only. It does not cover the MPs, the votes, the bills or the legal acts (the ELI API has packages of its own).

## Install

```sh
npm install sejm-schedule-api
```

## Use

```ts
import { SejmSchedule } from 'sejm-schedule-api';

const sejm = new SejmSchedule({ term: 10 });

const proceedings = await sejm.proceedings();
// [{ number: 7, title: '7. Posiedzenie Sejmu RP ...', dates: ['2026-11-18', '2026-11-20'], isCurrent: false }]

const committees = await sejm.committees();
// [{ code: 'ENM', name: 'Komisja Edukacji, Nauki i Młodzieży', nameGenitive: 'Komisji Edukacji, Nauki i Młodzieży' }]

const sittings = await sejm.committeeSittings('2026-11-18');
// [{ code: 'ENM', num: 3, date: '2026-11-18', start: '10:00', end: '12:30', room: '...', status: 'PLANNED',
//    notes: '', agendaHtml: '<p>...</p>', isClosed: false, isRemote: false, jointWith: [] }]
```

- **`new SejmSchedule({ term, baseUrl, getJson, onInvalid })`**: `term` is the term of the Sejm (10 by default), `baseUrl` is `https://api.sejm.gov.pl` by default.
- **`proceedings()`** gives the plenary sittings of the term. A sitting that is planned has `number: 0` until it starts, so do not take the number for a key. The `dates` are sorted. A record whose dates cannot be read is left out.
- **`currentProceeding()`** gives the plenary sitting that is under way (the one the API marks as current), or `null` when there is none.
- **`committees()`** gives the code, the name and the name in the genitive of each committee. A subcommittee (`ENM02S`) is not in the list.
- **`committeeSittings(date, { cancelled })`** gives the sittings of one day, as `YYYY-MM-DD`; `cancelled: true` adds the cancelled ones. `start` and `end` are `HH:MM` or `null`. `agendaHtml` is the agenda as the API gives it, in HTML, and it is empty for a closed sitting that has none.
- **`onInvalid({ record, reason })`** is called for every record that was left out, so you can log it.
- **`getJson(url)`** is how a request is made. By default it is `fetch` with `Accept: application/json`, and it throws a `SejmApiError` (with `status` and `url`) on an unhappy answer. Pass your own to add pacing, retries or a cache; it must return the parsed JSON. The API is public and has no key, so be gentle with it.

### Joint sittings and names

A joint sitting of committees is listed once by the API, under one of them, and the others are in `jointWith`. Where the API lists both sides, `mergeJointSittings(sittings)` keeps one and gives `{ sitting, codes }` with the codes of all the committees. `committeeGenitive({ code, names })` writes the name of a committee in the genitive from `genitiveNames(committees)`, and for a subcommittee that has no name of its own it takes its parent's (`Podkomisji ENM02S Komisji ...`). `isCancelled(sitting)` tells a cancelled sitting by its status.

### The parsers on their own

`parseProceedings`, `parseCommittees` and `parseCommitteeSittings` take the list the API answered and give `{ items, invalid }`, for when you fetch the data yourself.

## For AI agents

The package ships [`llms.txt`](llms.txt) (also at `sejm-schedule-api/llms.txt`): a compact summary of the API and its gotchas. Contributors, human or not, should start with [`AGENTS.md`](AGENTS.md).

## Development

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

The shape of the answers was read from the API's OpenAPI description at `https://api.sejm.gov.pl/sejm/openapi/`. This is an unofficial client.
