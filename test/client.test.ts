import { afterEach, describe, expect, it, vi } from 'vitest';

import { SejmApiError, SejmSchedule } from '../index';
import { committee, proceeding, sitting } from './helpers';

const answers = (data: unknown) => vi.fn(async () => data);

describe('SejmSchedule', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for the proceedings, the committees and the sittings of a day of the tenth term', async () => {
    const getJson = vi.fn(async (url: string) =>
      url.endsWith('/proceedings')
        ? [proceeding()]
        : url.includes('/sittings/')
          ? [sitting()]
          : [committee()],
    );
    const sejm = new SejmSchedule({ getJson });

    expect(await sejm.proceedings()).toHaveLength(1);
    expect(await sejm.committees()).toHaveLength(1);
    expect(await sejm.committeeSittings('2026-11-18')).toHaveLength(1);
    expect(
      await sejm.committeeSittings('2026-11-18', { cancelled: true }),
    ).toHaveLength(1);
    expect(getJson.mock.calls.map(([url]) => url)).toEqual([
      'https://api.sejm.gov.pl/sejm/term10/proceedings',
      'https://api.sejm.gov.pl/sejm/term10/committees',
      'https://api.sejm.gov.pl/sejm/term10/committees/sittings/2026-11-18',
      'https://api.sejm.gov.pl/sejm/term10/committees/sittings/2026-11-18?cancelled=true',
    ]);
  });

  it('gives the proceeding that is current, or null when none is', async () => {
    const current = proceeding({ number: 8, current: true });

    expect(
      await new SejmSchedule({
        getJson: answers([proceeding(), current]),
      }).currentProceeding(),
    ).toMatchObject({ number: 8, isCurrent: true });
    expect(
      await new SejmSchedule({
        getJson: answers([proceeding()]),
      }).currentProceeding(),
    ).toBeNull();
  });

  it('takes another term and another host', async () => {
    const getJson = answers([]);

    await new SejmSchedule({
      term: 9,
      baseUrl: 'http://localhost:8080',
      getJson,
    }).proceedings();

    expect(getJson).toHaveBeenCalledWith(
      'http://localhost:8080/sejm/term9/proceedings',
    );
  });

  it('reports the records it leaves out and keeps the rest', async () => {
    const onInvalid = vi.fn();
    const sejm = new SejmSchedule({
      getJson: answers([sitting(), { code: 'X' }]),
      onInvalid,
    });

    expect(await sejm.committeeSittings('2026-11-18')).toHaveLength(1);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(onInvalid.mock.calls[0]?.[0]).toMatchObject({
      record: { code: 'X' },
    });
  });

  it('does not mind records it leaves out when nobody listens', async () => {
    const sejm = new SejmSchedule({ getJson: answers([{ code: 'X' }]) });

    expect(await sejm.committeeSittings('2026-11-18')).toEqual([]);
  });

  it('fails when the answer is not a list', async () => {
    const sejm = new SejmSchedule({ getJson: answers({ error: 'x' }) });

    await expect(sejm.proceedings()).rejects.toMatchObject({
      name: 'SejmApiError',
      status: null,
      url: 'https://api.sejm.gov.pl/sejm/term10/proceedings',
    });
  });

  it('uses fetch by default and fails with the status of an unhappy answer', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [committee()] })
      .mockResolvedValueOnce({ ok: false, status: 503 });

    vi.stubGlobal('fetch', fetchMock);

    const sejm = new SejmSchedule();

    expect(await sejm.committees()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.sejm.gov.pl/sejm/term10/committees',
      { headers: { Accept: 'application/json' } },
    );

    const failure = await sejm.proceedings().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(SejmApiError);
    expect(failure).toMatchObject({ status: 503 });
  });
});
