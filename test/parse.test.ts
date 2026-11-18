import { describe, expect, it } from 'vitest';

import {
  committeeGenitive,
  genitiveNames,
  isCancelled,
  mergeJointSittings,
  parseCommittees,
  parseCommitteeSittings,
  parseProceedings,
} from '../index';
import { committee, proceeding, sitting } from './helpers';

describe('parseProceedings', () => {
  it('reads a sitting of the Sejm with its days sorted and its title squeezed', () => {
    expect(parseProceedings([proceeding({ current: true })]).items).toEqual([
      {
        number: 7,
        title: '7. Posiedzenie Sejmu RP',
        dates: ['2026-11-18', '2026-11-20'],
        isCurrent: true,
      },
    ]);
  });

  it('gives a planned sitting the number 0 and leaves out what cannot be read', () => {
    const parsed = parseProceedings([
      proceeding({ number: undefined }),
      { title: 'no dates' },
      'text',
      null,
      [],
      proceeding({ dates: [] }),
      proceeding({ dates: ['2026-02-30'] }),
      proceeding({ dates: ['18.11.2026'] }),
    ]);

    expect(parsed.items.map((item) => item.number)).toEqual([0]);
    expect(parsed.invalid.map((entry) => entry.reason)).toEqual([
      'a record without a list of dates',
      'a record without a list of dates',
      'a record without a list of dates',
      'a record without a list of dates',
      'the dates of the proceeding cannot be read',
      'the dates of the proceeding cannot be read',
      'the dates of the proceeding cannot be read',
    ]);
  });
});

describe('parseCommitteeSittings', () => {
  it('reads the clocks, the flags and the joint partners of a sitting', () => {
    const [read] = parseCommitteeSittings([
      sitting({
        closed: true,
        remote: true,
        jointWith: [{ code: 'EDU', num: 9 }, { code: 'X' }, 'text'],
      }),
    ]).items;

    expect(read).toEqual({
      code: 'ASW',
      num: 3,
      date: '2026-11-18',
      start: '10:00',
      end: '12:30',
      room: 'sala nr 118, bud. C',
      status: 'PLANNED',
      notes: 'Dodatkowe uwagi',
      agendaHtml: '<p>Porządek <b>obrad</b></p>',
      isClosed: true,
      isRemote: true,
      jointWith: [{ code: 'EDU', num: 9 }],
    });
  });

  it('has no clock or agenda when the API gives none', () => {
    const [read] = parseCommitteeSittings([
      sitting({
        startDateTime: undefined,
        endDateTime: 'soon',
        agenda: undefined,
        room: undefined,
        jointWith: undefined,
      }),
    ]).items;

    expect(read).toMatchObject({
      start: null,
      end: null,
      agendaHtml: '',
      room: '',
    });
    expect(read?.jointWith).toEqual([]);
  });

  it('leaves out a record without a code, a number or a day', () => {
    const parsed = parseCommitteeSittings([
      sitting({ code: 1 }),
      sitting({ num: '3' }),
      sitting({ date: 'tomorrow' }),
      sitting({ date: 20_261_118 }),
      null,
      sitting(),
    ]);

    expect(parsed.items).toHaveLength(1);
    expect(parsed.invalid).toHaveLength(5);
  });

  it('knows a cancelled sitting by its status', () => {
    expect(isCancelled({ status: 'CANCELLED' })).toBe(true);
    expect(isCancelled({ status: 'odwołane' })).toBe(true);
    expect(isCancelled({ status: 'PLANNED' })).toBe(false);
  });
});

describe('mergeJointSittings', () => {
  it('lists a joint sitting once, under the committee that sorts first', () => {
    const parsed = parseCommitteeSittings([
      sitting({ code: 'EDU', num: 9, jointWith: [{ code: 'ASW', num: 3 }] }),
      sitting({ code: 'ASW', num: 3, jointWith: [{ code: 'EDU', num: 9 }] }),
      sitting({ code: 'ZDR', num: 1 }),
    ]).items;

    expect(
      mergeJointSittings(parsed).map(({ sitting: host, codes }) => [
        host.code,
        codes,
      ]),
    ).toEqual([
      ['ASW', ['ASW', 'EDU']],
      ['ZDR', ['ZDR']],
    ]);
  });

  it('keeps the host when the API lists only one side of a joint sitting', () => {
    const parsed = parseCommitteeSittings([
      sitting({ code: 'EDU', num: 9, jointWith: [{ code: 'ASW', num: 3 }] }),
    ]).items;

    expect(mergeJointSittings(parsed)[0]?.codes).toEqual(['EDU', 'ASW']);
  });
});

describe('committees', () => {
  it('reads the names and leaves out a record without a code', () => {
    const parsed = parseCommittees([committee(), { name: 'x' }]);

    expect(parsed.items).toEqual([
      {
        code: 'ENM',
        name: 'Komisja Edukacji',
        nameGenitive: 'Komisji Edukacji',
      },
    ]);
    expect(parsed.invalid).toHaveLength(1);
  });

  it('gives the genitive name of a committee, of its subcommittee and of an unknown code', () => {
    const names = genitiveNames(
      parseCommittees([committee(), committee({ code: 'Q', nameGenitive: '' })])
        .items,
    );

    expect(names).toEqual({ ENM: 'Komisji Edukacji' });
    expect(committeeGenitive({ code: 'ENM', names })).toBe('Komisji Edukacji');
    expect(committeeGenitive({ code: 'ENM02S', names })).toBe(
      'Podkomisji ENM02S Komisji Edukacji',
    );
    expect(committeeGenitive({ code: 'XYZ01N', names })).toBe('komisji XYZ01N');
    expect(committeeGenitive({ code: 'Q', names })).toBe('komisji Q');
  });
});
