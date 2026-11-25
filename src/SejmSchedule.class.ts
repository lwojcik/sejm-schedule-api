import { parseCommittees } from '@sejm/committees';
import { SejmApiError } from '@sejm/errors';
import { parseProceedings } from '@sejm/proceedings';
import { parseCommitteeSittings } from '@sejm/sittings';
import { fetchJson } from '@sejm/transport';
import type {
  Committee,
  CommitteeSitting,
  GetJson,
  OnInvalid,
  Parsed,
  Proceeding,
  SejmScheduleOptions,
  SittingsOptions,
} from '@sejm/types';

const DEFAULT_TERM = 10;
const DEFAULT_BASE_URL = 'https://api.sejm.gov.pl';

const warsawDate = new Intl.DateTimeFormat('en', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today in Warsaw as `YYYY-MM-DD`. */
const today = (): string => {
  const { year, month, day } = Object.fromEntries(
    warsawDate.formatToParts().map(({ type, value }) => [type, value]),
  );

  return `${year}-${month}-${day}`;
};

/**
 * Client for the schedule in the Sejm's open API (`api.sejm.gov.pl`).
 * Read-only. Every method returns validated data; malformed records are
 * dropped and reported through `onInvalid`.
 *
 * @example
 * const sejm = new SejmSchedule({ term: 10 });
 * const sittings = await sejm.committeeSittings('2026-11-18');
 */
export class SejmSchedule {
  private readonly termUrl: string;
  private readonly getJson: GetJson;
  private readonly onInvalid: OnInvalid | undefined;

  constructor({
    term = DEFAULT_TERM,
    baseUrl = DEFAULT_BASE_URL,
    getJson = fetchJson,
    onInvalid,
  }: SejmScheduleOptions = {}) {
    this.termUrl = `${baseUrl}/sejm/term${term}`;
    this.getJson = getJson;
    this.onInvalid = onInvalid;
  }

  /** Plenary sittings of the term. Records with unreadable dates are left out. */
  async proceedings(): Promise<Proceeding[]> {
    return this.list({
      url: `${this.termUrl}/proceedings`,
      parse: parseProceedings,
    });
  }

  /** The plenary sitting under way, or `null` if there is none. */
  async currentProceeding(): Promise<Proceeding | null> {
    const proceedings = await this.proceedings();

    return proceedings.find(({ isCurrent }) => isCurrent) ?? null;
  }

  /**
   * The first plenary sitting that has not ended by `from`, so one running on
   * that day counts. `null` if every sitting is over.
   * @param from Day as `YYYY-MM-DD`. Defaults to today in Warsaw.
   */
  async nextProceeding(from = today()): Promise<Proceeding | null> {
    const proceedings = await this.proceedings();

    return (
      proceedings
        .filter(({ dates }) => dates.some((date) => date >= from))
        .toSorted((first, second) =>
          first.dates[0].localeCompare(second.dates[0]),
        )[0] ?? null
    );
  }

  /** The committees of the term (no subcommittees). */
  async committees(): Promise<Committee[]> {
    return this.list({
      url: `${this.termUrl}/committees`,
      parse: parseCommittees,
    });
  }

  /**
   * Committee sittings of one day.
   * @param date Day as `YYYY-MM-DD`.
   * @throws {SejmApiError} on a non-2xx answer or a non-list body.
   */
  async committeeSittings(
    date: string,
    { cancelled = false }: SittingsOptions = {},
  ): Promise<CommitteeSitting[]> {
    const query = cancelled ? '?cancelled=true' : '';

    return this.list({
      url: `${this.termUrl}/committees/sittings/${date}${query}`,
      parse: parseCommitteeSittings,
    });
  }

  private async list<Item>({
    url,
    parse,
  }: {
    url: string;
    parse: (records: unknown[]) => Parsed<Item>;
  }): Promise<Item[]> {
    const data = await this.getJson(url);

    if (!Array.isArray(data)) {
      throw new SejmApiError({
        message: `${url} did not answer with a list`,
        url,
        status: null,
      });
    }

    const { items, invalid } = parse(data);

    invalid.forEach((entry) => this.onInvalid?.(entry));

    return items;
  }
}
